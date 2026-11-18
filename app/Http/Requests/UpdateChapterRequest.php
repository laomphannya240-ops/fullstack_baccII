<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChapterRequest extends FormRequest
{
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
            'subject_id' => ['sometimes', 'required', 'integer', 'exists:subjects,id'],
            'slug' => ['sometimes', 'required', 'string', 'max:100'],
            'title_en' => ['sometimes', 'required', 'string', 'max:200'],
            'title_km' => ['sometimes', 'required', 'string', 'max:200'],
            'description_en' => ['nullable', 'string'],
            'description_km' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
