<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\PriceList;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var PriceList|null $listaPrecio */
        $listaPrecio = $this->route('listas_precio');

        if ($listaPrecio) {
            return $this->user()?->can('price_lists.update') ?? false;
        }

        return $this->user()?->can('price_lists.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var PriceList|null $listaPrecio */
        $listaPrecio = $this->route('listas_precio');

        return [
            'code' => [
                'required',
                'string',
                'max:20',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('price_lists', 'code')->ignore($listaPrecio?->id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'currency_code' => ['required', 'string', 'size:3', 'regex:/^[A-Z]{3}$/'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'code' => 'código',
            'name' => 'nombre',
            'currency_code' => 'moneda',
            'is_default' => 'lista por defecto',
            'is_active' => 'estado',
            'sort_order' => 'orden',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim((string) $this->input('code'))),
            ]);
        }

        if ($this->has('currency_code')) {
            $this->merge([
                'currency_code' => strtoupper(trim((string) $this->input('currency_code'))),
            ]);
        }

        foreach (['is_default', 'is_active'] as $key) {
            if ($this->has($key)) {
                $this->merge([
                    $key => $this->boolean($key),
                ]);
            }
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var PriceList|null $listaPrecio */
        $listaPrecio = $this->route('listas_precio');

        session()->flash('priceListModal', $listaPrecio ? 'edit' : 'create');
        if ($listaPrecio) {
            session()->flash('priceListModalId', $listaPrecio->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.listas-precios.index'));
    }
}
