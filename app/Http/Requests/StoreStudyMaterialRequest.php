<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesMaterialPayload;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreStudyMaterialRequest extends FormRequest
{
    use ValidatesMaterialPayload;

    public function authorize(): bool
    {
        return $this->user()?->can('access-admin') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'chapter_id' => ['required', 'integer', 'exists:chapters,id'],
            'title_en' => ['required', 'string', 'max:200'],
            'title_km' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'files' => ['required_without:file', 'array', 'min:1', 'max:20'],
            'files.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:20480'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:20480'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $this->validateMaterialPlacement($validator);
        $this->validateMaterialFiles($validator);
    }
}
