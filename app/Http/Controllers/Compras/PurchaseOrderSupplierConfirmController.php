<?php

namespace App\Http\Controllers\Compras;

use App\Http\Controllers\Controller;
use App\Services\Compras\PurchaseOrderSupplierMailService;
use App\Support\Datetime\PeruDateTime;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class PurchaseOrderSupplierConfirmController extends Controller
{
    public function __construct(
        private readonly PurchaseOrderSupplierMailService $supplierMail,
    ) {}

    public function __invoke(Request $request, string $token): Response
    {
        $error = null;
        $order = null;

        try {
            $order = $this->supplierMail->confirmByToken($token);
        } catch (InvalidArgumentException $exception) {
            $error = $exception->getMessage();
        }

        return Inertia::render('compras/orden-confirmada', [
            'success' => $order !== null,
            'error' => $error,
            'order' => $order ? [
                'internal_number' => $order->internal_number,
                'supplier_name' => $order->supplier?->legal_name,
                'confirmed_at_label' => PeruDateTime::label($order->supplier_confirmed_at),
            ] : null,
            'companyName' => config('company.name', config('app.name')),
        ]);
    }
}
