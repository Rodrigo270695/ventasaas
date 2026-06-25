<?php

namespace App\Http\Controllers\Admin\Socios;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Socios\PartyRequest;
use App\Models\Party;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartyController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('parties.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['partyModal', 'partyModalId', 'errors']);
        }

        $parties = Party::query()
            ->orderBy('legal_name')
            ->get([
                'id',
                'type',
                'document_type',
                'document_number',
                'legal_name',
                'trade_name',
                'address',
                'sunat_estado',
                'sunat_condicion',
                'email',
                'phone',
                'credit_limit',
                'payment_term_days',
                'is_active',
            ]);

        $partiesPayload = $parties->map(fn (Party $party) => $this->mapParty($party));

        $activeCount = $parties->where('is_active', true)->count();
        $customerCount = $parties->filter(
            fn (Party $party) => in_array($party->type, [Party::TYPE_CUSTOMER, Party::TYPE_BOTH], true),
        )->count();
        $supplierCount = $parties->filter(
            fn (Party $party) => in_array($party->type, [Party::TYPE_SUPPLIER, Party::TYPE_BOTH], true),
        )->count();

        return Inertia::render('admin/socios/index', [
            'parties' => $partiesPayload,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $parties->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activos', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'customers', 'label' => 'Clientes', 'value' => $customerCount, 'tone' => 'cyan'],
                ['key' => 'suppliers', 'label' => 'Proveedores', 'value' => $supplierCount, 'tone' => 'amber'],
            ],
            'partyModal' => session()->pull('partyModal'),
            'partyModalId' => session()->pull('partyModalId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(PartyRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Si existe un registro eliminado con el mismo documento, restaurarlo en lugar de crear duplicado
        $trashed = Party::withTrashed()
            ->where('document_type', $data['document_type'])
            ->where('document_number', $data['document_number'])
            ->whereNotNull('deleted_at')
            ->first();

        if ($trashed !== null) {
            $trashed->restore();
            $trashed->update(collect($data)->only($trashed->getFillable())->all());
            $party = $trashed;
            Toast::success('Socio reactivado y actualizado correctamente.');
        } else {
            $party = Party::create($data);
            Toast::success('Socio registrado correctamente.');
        }

        $returnUrl = $request->string('return_url')->toString();

        if ($returnUrl !== '' && str_starts_with($returnUrl, '/admin/ventas/')) {
            return redirect($returnUrl)
                ->with('selected_customer_party_id', $party->id);
        }

        return to_route('admin.socios.index');
    }

    public function update(PartyRequest $request, Party $socio): RedirectResponse
    {
        $socio->update($request->validated());

        Toast::success('Socio actualizado.');

        return to_route('admin.socios.index');
    }

    public function destroy(Request $request, Party $socio): RedirectResponse
    {
        abort_unless($request->user()?->can('parties.delete'), 403);

        $socio->delete();

        Toast::success('Socio eliminado.');

        return to_route('admin.socios.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function mapParty(Party $party): array
    {
        return [
            'id' => $party->id,
            'type' => $party->type,
            'document_type' => $party->document_type,
            'document_type_label' => $party->documentLabel(),
            'document_number' => $party->document_number,
            'document_label' => $party->documentLabel().' '.$party->document_number,
            'legal_name' => $party->legal_name,
            'trade_name' => $party->trade_name,
            'email' => $party->email,
            'phone' => $party->phone,
            'credit_limit' => (string) $party->credit_limit,
            'payment_term_days' => $party->payment_term_days,
            'is_active' => $party->is_active,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'type' => old('type', Party::TYPE_CUSTOMER),
            'document_type' => old('document_type', Party::DOC_RUC),
            'document_number' => old('document_number', ''),
            'legal_name' => old('legal_name', ''),
            'trade_name' => old('trade_name', ''),
            'address' => old('address', ''),
            'sunat_estado' => old('sunat_estado', ''),
            'sunat_condicion' => old('sunat_condicion', ''),
            'email' => old('email', ''),
            'phone' => old('phone', ''),
            'credit_limit' => old('credit_limit', '0'),
            'payment_term_days' => (int) old('payment_term_days', 0),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
