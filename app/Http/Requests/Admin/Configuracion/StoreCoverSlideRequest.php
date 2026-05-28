<?php

namespace App\Http\Requests\Admin\Configuracion;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

class StoreCoverSlideRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->isMethod('post')) {
            return $this->user()?->can('store_covers.create') ?? false;
        }

        return $this->user()?->can('store_covers.update') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isCreate = $this->isMethod('post');

        return [
            'title' => ['nullable', 'string', 'max:120'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'image' => [
                $isCreate ? 'required' : 'nullable',
                'file',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title' => 'título',
            'subtitle' => 'subtítulo',
            'is_active' => 'estado',
            'image' => 'imagen de portada',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => $this->boolean('is_active'),
            ]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        session()->flash('coverModal', $this->route('portada') ? 'edit' : 'create');
        session()->flash('coverModalSlideId', $this->route('portada')?->id);

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.configuracion.portada.index'));
    }
}
