<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\ProductCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var ProductCategory|null $categoria */
        $categoria = $this->route('categoria');

        if ($categoria) {
            return $this->user()?->can('categories.update') ?? false;
        }

        return $this->user()?->can('categories.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var ProductCategory|null $categoria */
        $categoria = $this->route('categoria');

        return [
            'parent_id' => [
                'nullable',
                'uuid',
                Rule::exists('product_categories', 'id'),
                Rule::notIn(array_filter([$categoria?->id])),
            ],
            'code' => [
                'required',
                'string',
                'max:20',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('product_categories', 'code')->ignore($categoria?->id),
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
            'parent_id' => 'categoría padre',
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

        if ($this->has('parent_id') && blank($this->input('parent_id'))) {
            $this->merge(['parent_id' => null]);
        }

        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => $this->boolean('is_active'),
            ]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var ProductCategory|null $categoria */
        $categoria = $this->route('categoria');

        session()->flash('categoryModal', $categoria ? 'edit' : 'create');
        if ($categoria) {
            session()->flash('categoryModalCategoryId', $categoria->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.categorias.index'));
    }
}
