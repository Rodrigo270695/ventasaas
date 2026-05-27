<?php

namespace App\Mail;

use App\Models\SalesQuotation;
use App\Services\Sales\SalesQuotationPdfService;
use App\Support\Datetime\PeruDateTime;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SalesQuotationMail extends Mailable
{
    use Queueable, SerializesModels;

    /** @var list<array{description: string, sku: string|null, quantity: string, unit_price: string, line_total: string}> */
    public array $lines;

    public function __construct(
        public SalesQuotation $quotation,
        public string $companyName,
    ) {
        $this->lines = $quotation->lines->map(fn ($line) => [
            'description' => self::escapeMarkdownCell((string) $line->description),
            'sku' => $line->variant?->sku ?: $line->manual_sku,
            'quantity' => number_format((float) $line->quantity, 2, '.', ','),
            'unit_price' => number_format((float) $line->unit_price, 2, '.', ','),
            'line_total' => number_format((float) $line->line_total, 2, '.', ','),
        ])->values()->all();
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Cotización {$this->quotation->internal_number} — {$this->companyName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.sales-quotation',
            with: [
                'quotationNumber' => $this->quotation->internal_number,
                'customerName' => $this->quotation->customer?->legal_name ?? 'Cliente',
                'issueDateLabel' => PeruDateTime::label($this->quotation->issue_date),
                'validUntilLabel' => $this->quotation->valid_until?->format('d/m/Y'),
                'currencyCode' => $this->quotation->currency_code,
                'totalLabel' => number_format((float) $this->quotation->total, 2, '.', ','),
                'notes' => $this->quotation->notes,
                'lines' => $this->lines,
                'companyName' => $this->companyName,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $pdfService = app(SalesQuotationPdfService::class);

        return [
            Attachment::fromData(
                fn () => $pdfService->output($this->quotation),
                $pdfService->filename($this->quotation),
            )->withMime('application/pdf'),
        ];
    }

    private static function escapeMarkdownCell(string $value): string
    {
        return str_replace(['|', "\r", "\n"], ['\\|', ' ', ' '], trim($value));
    }
}

