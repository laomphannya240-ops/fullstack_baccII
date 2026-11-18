<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLessonRequest extends FormRequest
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
            'chapter_id' => ['sometimes', 'required', 'integer', 'exists:chapters,id'],
            'slug' => ['sometimes', 'required', 'string', 'max:100'],
            'title_en' => ['sometimes', 'required', 'string', 'max:200'],
            'title_km' => ['sometimes', 'required', 'string', 'max:200'],
            'summary_en' => ['nullable', 'string'],
            'summary_km' => ['nullable', 'string'],
            'content_km' => ['nullable', 'string'],
            'content_en' => ['nullable', 'string'],
            'important_notes' => ['nullable', 'string'],
            'video_url' => ['nullable', 'url', 'max:500'],
            'pdf' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'estimated_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
            'is_published' => ['nullable', 'boolean'],
            'is_reference' => ['nullable', 'boolean'],
        ];
    }
}
