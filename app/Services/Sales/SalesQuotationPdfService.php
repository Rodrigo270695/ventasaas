<?php

namespace App\Services\Sales;

use App\Models\CfgStoreSetting;
use App\Models\SalesQuotation;
use App\Support\CompanyBranding;
use App\Support\Datetime\PeruDateTime;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdfDocument;
use Illuminate\Support\Facades\File;

class SalesQuotationPdfService
{
    /**
     * @return array<string, mixed>
     */
    public function viewData(SalesQuotation $quotation): array
    {
        $quotation->loadMissing(['customer', 'lines.variant.product', 'creator']);

        $store = CfgStoreSetting::query()->orderBy('id')->first();
        $branding = CompanyBranding::forInertia();
        $company = config('company');

        $legalName = $store?->razon_social
            ?: ($branding['legal_name'] ?: $branding['name']);

        $contactParts = array_filter([
            filled($company['phone'] ?? null) ? 'Tel: '.$company['phone'] : null,
            filled($company['email'] ?? null) ? 'Email: '.$company['email'] : null,
            filled($company['website'] ?? null) ? 'Web: '.$company['website'] : null,
        ]);

        $validUntilLabel = $quotation->valid_until
            ? PeruDateTime::parse($quotation->valid_until)->format('d/m/Y')
            : '—';

        $lines = $quotation->lines->values()->map(function ($line, $index) {
            $sku = $line->manual_sku ?: ($line->variant?->sku ?? '—');

            return [
                'index' => $index + 1,
                'code' => $sku,
                'description' => (string) $line->description,
                'quantity' => number_format((float) $line->quantity, 2, '.', ','),
                'unit' => 'UND',
                'unit_price' => number_format((float) $line->unit_price, 2, '.', ','),
                'line_total' => number_format((float) $line->line_total, 2, '.', ','),
            ];
        })->all();

        return [
            'quotation' => $quotation,
            'lines' => $lines,
            'company' => [
                'legal_name' => $legalName,
                'ruc' => $store?->ruc ?: ($company['ruc'] ?? null),
                'address' => $store?->direccion ?: ($company['address'] ?? null),
                'contact_line' => implode(' | ', $contactParts),
                'logo_data_uri' => $this->resolveLogoDataUri($branding['logo_url']),
            ],
            'customer' => [
                'name' => $quotation->customer?->legal_name ?? '—',
                'document' => $quotation->customer
                    ? trim($quotation->customer->documentLabel().' '.$quotation->customer->document_number)
                    : '—',
            ],
            'meta' => [
                'issue_date_label' => $quotation->issue_date
                    ? PeruDateTime::parse($quotation->issue_date)->format('d/m/Y')
                    : '—',
                'valid_until_label' => $validUntilLabel,
                'seller_name' => $quotation->creator?->name ?? '—',
            ],
            'totals' => [
                'currency' => $quotation->currency_code,
                'subtotal' => number_format((float) $quotation->subtotal, 2, '.', ','),
                'tax' => number_format((float) $quotation->tax_amount, 2, '.', ','),
                'total' => number_format((float) $quotation->total, 2, '.', ','),
            ],
            'conditions' => [
                'validity' => (string) ($company['quotation_validity'] ?? '30 días'),
                'payment' => (string) ($company['quotation_payment_terms'] ?? 'Transferencia, Yape o PLIN'),
                'notes' => filled($quotation->notes) ? (string) $quotation->notes : null,
            ],
            'signature' => [
                'name' => (string) ($company['manager_name'] ?? $quotation->creator?->name ?? ''),
                'title' => (string) ($company['manager_title'] ?? 'Gerente General'),
                'company' => $legalName,
            ],
        ];
    }

    public function generate(SalesQuotation $quotation): DomPdfDocument
    {
        return Pdf::loadView('pdf.sales-quotation', $this->viewData($quotation))
            ->setPaper('a4', 'portrait');
    }

    public function output(SalesQuotation $quotation): string
    {
        return (string) $this->generate($quotation)->output();
    }

    public function filename(SalesQuotation $quotation): string
    {
        return preg_replace('/[^\w\-]+/', '_', $quotation->internal_number).'.pdf';
    }

    private function resolveLogoDataUri(?string $logoUrl): ?string
    {
        if (! filled($logoUrl)) {
            return null;
        }

        $path = null;

        if (str_starts_with($logoUrl, '/')) {
            $path = public_path(ltrim($logoUrl, '/'));
        } elseif (str_starts_with($logoUrl, 'http://') || str_starts_with($logoUrl, 'https://')) {
            $appUrl = rtrim((string) config('app.url'), '/');
            if (str_starts_with($logoUrl, $appUrl.'/')) {
                $path = public_path(ltrim(parse_url($logoUrl, PHP_URL_PATH) ?? '', '/'));
            }
        } else {
            $path = public_path(ltrim($logoUrl, '/'));
        }

        if (! $path || ! File::isFile($path)) {
            return null;
        }

        $mime = File::mimeType($path) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode((string) File::get($path));
    }
}
