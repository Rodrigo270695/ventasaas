<?php

namespace App\Services\Compras;

use App\Mail\PurchaseOrderSupplierMail;
use App\Models\Party;
use App\Models\PurchaseOrder;
use App\Support\Datetime\PeruDateTime;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use InvalidArgumentException;

class PurchaseOrderSupplierMailService
{
    public function send(
        PurchaseOrder $order,
        string $toEmail,
        array $ccEmails = [],
        bool $updateSupplierEmail = false,
    ): PurchaseOrder {
        if (! $order->isApproved() || $order->status === PurchaseOrder::STATUS_CANCELLED) {
            throw new InvalidArgumentException(
                'Solo puedes enviar por correo una orden aprobada que no esté anulada.',
            );
        }

        $toEmail = strtolower(trim($toEmail));

        if (! filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('El correo del proveedor no es válido.');
        }

        $ccEmails = collect($ccEmails)
            ->map(fn ($email) => strtolower(trim((string) $email)))
            ->filter(fn ($email) => $email !== '' && $email !== $toEmail)
            ->unique()
            ->values()
            ->all();

        foreach ($ccEmails as $cc) {
            if (! filter_var($cc, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException("El correo en copia «{$cc}» no es válido.");
            }
        }

        $order->load(['lines.variant.product', 'supplier']);

        $token = Str::random(64);
        $expiresAt = PeruDateTime::now()->addDays(30);

        return DB::transaction(function () use ($order, $toEmail, $ccEmails, $updateSupplierEmail, $token, $expiresAt) {
            $order->update([
                'supplier_email_sent_at' => PeruDateTime::now(),
                'supplier_email_to' => $toEmail,
                'supplier_email_cc' => $ccEmails === [] ? null : $ccEmails,
                'supplier_confirmation_token' => $token,
                'supplier_confirmation_expires_at' => $expiresAt,
            ]);

            if ($updateSupplierEmail && $order->supplier) {
                $order->supplier->update(['email' => $toEmail]);
            }

            $confirmUrl = route('purchase-order.supplier.confirm', ['token' => $token]);

            $mail = Mail::to($toEmail);

            if ($ccEmails !== []) {
                $mail->cc($ccEmails);
            }

            $companyName = config('company.name', config('app.name'));

            $mail->send(new PurchaseOrderSupplierMail(
                order: $order->fresh(['lines.variant.product', 'supplier']),
                confirmUrl: $confirmUrl,
                companyName: (string) $companyName,
            ));

            return $order->fresh(['lines.variant.product', 'supplier']);
        });
    }

    public function confirmByToken(string $token): PurchaseOrder
    {
        $order = PurchaseOrder::query()
            ->where('supplier_confirmation_token', $token)
            ->first();

        if (! $order) {
            throw new InvalidArgumentException('El enlace de confirmación no es válido o ya fue utilizado.');
        }

        if ($order->supplier_confirmed_at) {
            return $order->load(['lines.variant.product', 'supplier']);
        }

        if (
            $order->supplier_confirmation_expires_at
            && PeruDateTime::now()->greaterThan(PeruDateTime::parse($order->supplier_confirmation_expires_at))
        ) {
            throw new InvalidArgumentException('El enlace de confirmación ha vencido. Solicita un nuevo envío.');
        }

        if ($order->status === PurchaseOrder::STATUS_CANCELLED) {
            throw new InvalidArgumentException('Esta orden de compra fue anulada.');
        }

        $order->update([
            'supplier_confirmed_at' => PeruDateTime::now(),
            'supplier_confirmation_token' => null,
            'supplier_confirmation_expires_at' => null,
        ]);

        return $order->fresh(['lines.variant.product', 'supplier']);
    }
}
