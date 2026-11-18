<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubjectRequest extends FormRequest
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
            'study_track_id' => ['required', 'integer', 'exists:study_tracks,id'],
            'slug' => ['required', 'string', 'max:100', 'unique:subjects,slug'],
            'name_en' => ['required', 'string', 'max:150'],
            'name_km' => ['required', 'string', 'max:150'],
            'description_en' => ['nullable', 'string'],
            'description_km' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
            'color' => ['nullable', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
