<?php

namespace App\Http\Controllers\Admin\Tesoreria;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tesoreria\TreasuryPaymentMethodRequest;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentMethod;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('treasury.payment_methods.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['paymentMethodModal', 'paymentMethodModalId', 'errors']);
        }

        $methods = TreasuryPaymentMethod::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/tesoreria/metodos-pago/index', [
            'methods' => $methods->map(fn (TreasuryPaymentMethod $method) => $this->mapRow($method)),
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $methods->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activos', 'value' => $methods->where('is_active', true)->count(), 'tone' => 'green'],
                ['key' => 'inactive', 'label' => 'Inactivos', 'value' => $methods->where('is_active', false)->count(), 'tone' => 'amber'],
            ],
            'paymentMethodModal' => session()->pull('paymentMethodModal'),
            'paymentMethodModalId' => session()->pull('paymentMethodModalId'),
            'oldForm' => $this->oldFormDefaults(),
            'typeOptions' => $this->typeOptions(),
            'nextSortOrder' => TreasuryPaymentMethod::nextSortOrder(),
        ]);
    }

    public function store(TreasuryPaymentMethodRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        TreasuryPaymentMethod::query()->create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'is_active' => $validated['is_active'] ?? true,
            'code' => TreasuryPaymentMethod::generateUniqueCodeFromName($validated['name']),
            'sort_order' => TreasuryPaymentMethod::nextSortOrder(),
        ]);

        Toast::success('Método de pago creado.');

        return to_route('admin.tesoreria.metodos-pago.index');
    }

    public function update(TreasuryPaymentMethodRequest $request, TreasuryPaymentMethod $metodosPago): RedirectResponse
    {
        $validated = $request->validated();

        $metodosPago->update([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        Toast::success('Método de pago actualizado.');

        return to_route('admin.tesoreria.metodos-pago.index');
    }

    public function destroy(Request $request, TreasuryPaymentMethod $metodosPago): RedirectResponse
    {
        abort_unless($request->user()?->can('treasury.payment_methods.delete'), 403);

        $inUse = TreasuryPayment::query()
            ->where('payment_method_id', $metodosPago->id)
            ->exists();

        if ($inUse) {
            Toast::error('No se puede eliminar: hay cobros registrados con este método.');

            return to_route('admin.tesoreria.metodos-pago.index');
        }

        $metodosPago->delete();

        Toast::success('Método de pago eliminado.');

        return to_route('admin.tesoreria.metodos-pago.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function mapRow(TreasuryPaymentMethod $method): array
    {
        return [
            'id' => $method->id,
            'code' => $method->code,
            'name' => $method->name,
            'type' => $method->type,
            'type_label' => $method->typeLabel(),
            'is_active' => $method->is_active,
            'sort_order' => $method->sort_order,
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function typeOptions(): array
    {
        return [
            ['value' => TreasuryPaymentMethod::TYPE_CASH, 'label' => 'Efectivo'],
            ['value' => TreasuryPaymentMethod::TYPE_BANK_TRANSFER, 'label' => 'Transferencia'],
            ['value' => TreasuryPaymentMethod::TYPE_DIGITAL_WALLET, 'label' => 'Billetera digital'],
            ['value' => TreasuryPaymentMethod::TYPE_CARD, 'label' => 'Tarjeta'],
            ['value' => TreasuryPaymentMethod::TYPE_OTHER, 'label' => 'Otro'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'name' => old('name', ''),
            'type' => old('type', TreasuryPaymentMethod::TYPE_CASH),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
