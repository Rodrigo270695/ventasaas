<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\Brand;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Brand|null $marca */
        $marca = $this->route('marca');

        if ($marca) {
            return $this->user()?->can('brands.update') ?? false;
        }

        return $this->user()?->can('brands.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Brand|null $marca */
        $marca = $this->route('marca');

        return [
            'code' => [
                'required',
                'string',
                'max:20',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('brands', 'code')->ignore($marca?->id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
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
            'is_active' => 'estado',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim((string) $this->input('code'))),
            ]);
        }

        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => $this->boolean('is_active'),
            ]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var Brand|null $marca */
        $marca = $this->route('marca');

        session()->flash('brandModal', $marca ? 'edit' : 'create');
        if ($marca) {
            session()->flash('brandModalBrandId', $marca->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.marcas.index'));
    }
}
