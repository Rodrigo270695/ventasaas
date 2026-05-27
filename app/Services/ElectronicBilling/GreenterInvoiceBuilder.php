<?php

namespace App\Services\ElectronicBilling;

use App\Models\CfgStoreSetting;
use App\Models\Party;
use App\Models\SalesDocument;
use App\Models\SalesDocumentLine;
use App\Support\AmountInWords;
use Carbon\Carbon;
use DateTime;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\Legend;
use Greenter\Model\Sale\SaleDetail;
use InvalidArgumentException;

class GreenterInvoiceBuilder
{
    public function build(SalesDocument $document, CfgStoreSetting $settings): Invoice
    {
        $document->loadMissing([
            'customer',
            'lines.variant.product.baseUnit',
        ]);

        if ($document->lines->isEmpty()) {
            throw new InvalidArgumentException('El comprobante no tiene líneas para emitir.');
        }

        $tipoDoc = (string) $document->sunat_document_type_code;

        if (! in_array($tipoDoc, ['01', '03'], true)) {
            throw new InvalidArgumentException("Tipo de comprobante SUNAT no soportado: {$tipoDoc}");
        }

        $gravadas = $this->money($document->subtotal);
        $igv = $this->money($document->tax_amount);
        $total = $this->money($document->total);

        $invoice = new Invoice;
        $invoice
            ->setUblVersion('2.1')
            ->setTipoOperacion('0101')
            ->setTipoDoc($tipoDoc)
            ->setSerie((string) $document->series)
            ->setCorrelativo($this->correlativo($document->number))
            ->setFechaEmision($this->emissionDateTime($document))
            ->setTipoMoneda($document->currency_code ?: 'PEN')
            ->setCompany($this->company($settings))
            ->setClient($this->client($document))
            ->setMtoOperGravadas((float) $gravadas)
            ->setMtoIGV((float) $igv)
            ->setTotalImpuestos((float) $igv)
            ->setValorVenta((float) $gravadas)
            ->setSubTotal((float) $total)
            ->setMtoImpVenta((float) $total)
            ->setFormaPago(new FormaPagoContado);

        $details = $document->lines
            ->map(fn (SalesDocumentLine $line, int $index) => $this->detail($line, $index + 1))
            ->all();

        $legend = (new Legend)
            ->setCode('1000')
            ->setValue(AmountInWords::soles($total));

        return $invoice
            ->setDetails($details)
            ->setLegends([$legend]);
    }

    private function company(CfgStoreSetting $settings): Company
    {
        $address = (new Address)
            ->setUbigueo($settings->ubigeo)
            ->setDepartamento(substr($settings->ubigeo, 0, 2))
            ->setProvincia(substr($settings->ubigeo, 0, 4))
            ->setDistrito($settings->ubigeo)
            ->setDireccion($settings->direccion ?: '-');

        return (new Company)
            ->setRuc($settings->ruc)
            ->setRazonSocial($settings->razon_social)
            ->setNombreComercial($settings->razon_social)
            ->setAddress($address);
    }

    private function client(SalesDocument $document): Client
    {
        $party = $document->customer;

        if (! $party instanceof Party) {
            return (new Client)
                ->setTipoDoc('0')
                ->setNumDoc('-')
                ->setRznSocial('CLIENTE VARIOS');
        }

        $client = (new Client)
            ->setTipoDoc((string) $party->document_type)
            ->setNumDoc((string) $party->document_number)
            ->setRznSocial($party->legal_name);

        if (filled($party->address)) {
            $client->setAddress((new Address)->setDireccion($party->address));
        }

        return $client;
    }

    private function detail(SalesDocumentLine $line, int $order): SaleDetail
    {
        $quantity = (float) $line->quantity;
        $base = (float) $this->money($line->line_subtotal);
        $igv = (float) $this->money($line->igv_amount);
        $unitValue = $quantity > 0 ? round($base / $quantity, 4) : 0.0;
        $unitPrice = (float) $this->money($line->unit_price);
        $igvPercent = $this->igvPercent($line->igv_rate);

        $description = $line->description
            ?: $line->variant?->label
            ?: $line->variant?->product?->name
            ?: 'Ítem '.$order;

        $unitCode = $line->variant?->product?->baseUnit?->sunat_code ?: 'NIU';
        $productCode = $line->variant?->sku ?: (string) $order;

        return (new SaleDetail)
            ->setCodProducto(substr((string) $productCode, 0, 30))
            ->setUnidad($unitCode)
            ->setCantidad($quantity)
            ->setDescripcion(substr($description, 0, 250))
            ->setMtoBaseIgv($base)
            ->setPorcentajeIgv($igvPercent)
            ->setIgv($igv)
            ->setTipAfeIgv((string) ($line->tax_affectation_code ?: '10'))
            ->setTotalImpuestos($igv)
            ->setMtoValorVenta($base)
            ->setMtoValorUnitario($unitValue)
            ->setMtoPrecioUnitario($unitPrice);
    }

    /**
     * Correlativo numérico sin ceros a la izquierda (nombre ZIP SUNAT: RUC-TIPO-SERIE-N).
     * El XML usa serie-correlativo vía Greenter (ej. E001-92).
     */
    private function correlativo(?int $number): string
    {
        return (string) max(1, (int) $number);
    }

    private function emissionDateTime(SalesDocument $document): DateTime
    {
        $tz = config('app.timezone', 'America/Lima');
        $issue = Carbon::parse($document->issue_date)->timezone($tz);

        if ($issue->isSameDay(now($tz))) {
            return DateTime::createFromInterface(now($tz));
        }

        return DateTime::createFromFormat(
            'Y-m-d H:i:s',
            $issue->format('Y-m-d').' 12:00:00',
        ) ?: new DateTime($issue->format('Y-m-d'));
    }

    private function igvPercent(mixed $rate): float
    {
        $value = (float) $this->money((string) $rate);

        if ($value > 0 && $value <= 1) {
            return round($value * 100, 2);
        }

        return round($value, 2);
    }

    private function money(string|float|int $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }
}
