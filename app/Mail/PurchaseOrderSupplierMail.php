<?php

namespace App\Mail;

use App\Models\PurchaseOrder;
use App\Support\Compras\PurchaseDisplayFormat;
use App\Support\Datetime\PeruDateTime;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PurchaseOrderSupplierMail extends Mailable
{
    use Queueable, SerializesModels;

    /** @var list<array{product: string, quantity: string, unit_cost: string, line_total: string}> */
    public array $lines;

    public function __construct(
        public PurchaseOrder $order,
        public string $confirmUrl,
        public string $companyName,
    ) {
        $this->lines = $order->lines->map(fn ($line) => [
            'product' => self::escapeMarkdownCell(
                $line->variant?->product?->name
                ?? $line->description
                ?? $line->variant?->sku
                ?? '—',
            ),
            'quantity' => PurchaseDisplayFormat::decimal($line->quantity_ordered),
            'unit_cost' => PurchaseDisplayFormat::decimal($line->unit_cost),
            'line_total' => PurchaseDisplayFormat::decimal(
                bcmul((string) $line->quantity_ordered, (string) $line->unit_cost, 4),
            ),
        ])->values()->all();
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Orden de compra {$this->order->internal_number} — {$this->companyName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.purchase-order-supplier',
            with: [
                'orderNumber' => $this->order->internal_number,
                'supplierName' => $this->order->supplier?->legal_name ?? 'Proveedor',
                'orderDateLabel' => PeruDateTime::label($this->order->order_date),
                'expectedDateLabel' => $this->order->expected_date
                    ? PeruDateTime::parse($this->order->expected_date)->format('d/m/Y')
                    : null,
                'currencyCode' => $this->order->currency_code,
                'totalLabel' => PurchaseDisplayFormat::decimal($this->order->total),
                'notes' => $this->order->notes,
                'lines' => $this->lines,
                'confirmUrl' => $this->confirmUrl,
                'companyName' => $this->companyName,
            ],
        );
    }

    private static function escapeMarkdownCell(string $value): string
    {
        return str_replace(['|', "\r", "\n"], ['\\|', ' ', ' '], trim($value));
    }
}
