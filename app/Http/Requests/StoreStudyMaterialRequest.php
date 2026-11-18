<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudyMaterialRequest extends FormRequest
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
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'chapter_id' => ['nullable', 'integer', 'exists:chapters,id'],
            'title_en' => ['required', 'string', 'max:200'],
            'title_km' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,ppt,pptx,png,jpg,jpeg', 'max:10240'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
