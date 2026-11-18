<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnouncementRequest extends FormRequest
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
            'title_en' => ['sometimes', 'required', 'string', 'max:200'],
            'title_km' => ['sometimes', 'required', 'string', 'max:200'],
            'body_en' => ['sometimes', 'required', 'string'],
            'body_km' => ['sometimes', 'required', 'string'],
            'is_pinned' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
