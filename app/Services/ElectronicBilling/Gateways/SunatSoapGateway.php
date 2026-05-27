<?php

namespace App\Services\ElectronicBilling\Gateways;

use App\Contracts\ElectronicBilling\ElectronicBillingGateway;
use App\Models\CfgStoreSetting;
use App\Models\ElectronicDocument;
use App\Services\ElectronicBilling\ElectronicBillingResult;
use App\Services\ElectronicBilling\ElectronicDocumentStorage;
use App\Services\ElectronicBilling\GreenterInvoiceBuilder;
use App\Services\ElectronicBilling\SunatSeeFactory;
use Greenter\Model\Response\BillResult;
use Greenter\Model\Response\CdrResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class SunatSoapGateway implements ElectronicBillingGateway
{
    public function __construct(
        private readonly GreenterInvoiceBuilder $invoiceBuilder,
        private readonly SunatSeeFactory $seeFactory,
        private readonly ElectronicDocumentStorage $documentStorage,
    ) {}

    public function gatewayKey(): string
    {
        return ElectronicDocument::GATEWAY_SUNAT_SOAP;
    }

    public function emit(ElectronicDocument $electronicDocument): ElectronicBillingResult
    {
        $settings = CfgStoreSetting::query()->orderBy('id')->first();

        if (! $settings) {
            return $this->reject('CFG', 'Configura los datos de la tienda (RUC, ubigeo) antes de emitir.');
        }

        if (config('electronic_billing.fake_accept') && app()->environment(['local', 'testing'])) {
            return new ElectronicBillingResult(
                status: ElectronicDocument::STATUS_ACCEPTED,
                sunatResponseCode: '0',
                sunatDescription: 'Aceptado (emisión simulada para desarrollo).',
                xmlHash: hash('sha256', 'fake-'.$electronicDocument->id),
            );
        }

        if (blank($settings->cdt_path_enc) || blank($settings->cdt_password_enc)) {
            return $this->reject('CDT', 'Falta el certificado digital (CDT) en Configuración → Tienda.');
        }

        if (blank($settings->sol_user) || blank($settings->sol_password_enc)) {
            return $this->reject(
                'SOL',
                'Falta la Clave SOL (usuario secundario y contraseña) en Configuración → Tienda.',
            );
        }

        $electronicDocument->loadMissing('salesDocument');

        $salesDocument = $electronicDocument->salesDocument;

        if (! $salesDocument) {
            return $this->reject('DOC', 'No se encontró el comprobante de venta asociado.');
        }

        try {
            $invoice = $this->invoiceBuilder->build($salesDocument, $settings);
            $see = $this->seeFactory->make($settings);
            $xmlSigned = $see->getXmlSigned($invoice);

            if ($xmlSigned === null) {
                return $this->reject('XML', 'No se pudo generar el XML firmado del comprobante.');
            }

            $xmlPath = $this->documentStorage->storeXml($electronicDocument, $xmlSigned);
            $xmlHash = hash('sha256', $xmlSigned);

            $result = $see->send($invoice);

            if ($result === null) {
                return new ElectronicBillingResult(
                    status: ElectronicDocument::STATUS_REJECTED,
                    sunatResponseCode: 'SUNAT',
                    sunatDescription: 'SUNAT no devolvió respuesta al enviar el comprobante.',
                    xmlHash: $xmlHash,
                    xmlPath: $xmlPath,
                );
            }

            if (! $result->isSuccess()) {
                $error = $result->getError();
                [$code, $description] = $this->formatSunatError($error?->getCode(), $error?->getMessage());

                return new ElectronicBillingResult(
                    status: ElectronicDocument::STATUS_REJECTED,
                    sunatResponseCode: $code,
                    sunatDescription: $description,
                    xmlHash: $xmlHash,
                    xmlPath: $xmlPath,
                );
            }

            $cdrPath = null;
            $cdrCode = '0';
            $cdrDescription = 'Comprobante aceptado por SUNAT.';

            if ($result instanceof BillResult) {
                $zip = $result->getCdrZip();

                if (filled($zip)) {
                    $cdrPath = $this->documentStorage->storeCdrZip($electronicDocument, $zip);
                }

                $cdr = $result->getCdrResponse();

                if ($cdr instanceof CdrResponse) {
                    $cdrCode = (string) ($cdr->getCode() ?? '0');
                    $cdrDescription = (string) ($cdr->getDescription() ?? $cdrDescription);

                    $status = $this->statusFromCdr($cdr);

                    return new ElectronicBillingResult(
                        status: $status,
                        sunatResponseCode: $cdrCode,
                        sunatDescription: $cdrDescription,
                        xmlHash: $xmlHash,
                        xmlPath: $xmlPath,
                        cdrPath: $cdrPath,
                    );
                }
            }

            return new ElectronicBillingResult(
                status: ElectronicDocument::STATUS_ACCEPTED,
                sunatResponseCode: $cdrCode,
                sunatDescription: $cdrDescription,
                xmlHash: $xmlHash,
                xmlPath: $xmlPath,
                cdrPath: $cdrPath,
            );
        } catch (Throwable $exception) {
            Log::warning('SUNAT SOAP emission failed', [
                'electronic_document_id' => $electronicDocument->id,
                'message' => $exception->getMessage(),
            ]);

            return $this->reject('EXC', $exception->getMessage());
        }
    }

    private function statusFromCdr(CdrResponse $cdr): string
    {
        $code = (int) $cdr->getCode();

        if ($code === 0) {
            return ElectronicDocument::STATUS_ACCEPTED;
        }

        if ($code >= 4000) {
            return ElectronicDocument::STATUS_OBSERVED;
        }

        return ElectronicDocument::STATUS_REJECTED;
    }

    private function reject(string $code, string $message): ElectronicBillingResult
    {
        return new ElectronicBillingResult(
            status: ElectronicDocument::STATUS_REJECTED,
            sunatResponseCode: $code,
            sunatDescription: $message,
        );
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function formatSunatError(?string $code, ?string $message): array
    {
        $code = trim((string) $code);
        $message = trim((string) $message);

        if ($code === 'HTTP' && str_contains(strtolower($message), 'bad request')) {
            return [
                $code,
                'SUNAT rechazó la petición SOAP (Bad Request). Suele deberse a: contraseña SOL incorrecta del usuario secundario, certificado no vigente en SUNAT, o encabezado WS-Security inválido. Ejecuta: php artisan billing:verify-sol',
            ];
        }

        if ($message === '') {
            $message = 'SUNAT rechazó el envío del comprobante.';
        }

        return [$code !== '' ? $code : 'ERR', $message];
    }
}
