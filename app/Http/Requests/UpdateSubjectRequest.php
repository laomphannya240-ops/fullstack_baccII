<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubjectRequest extends FormRequest
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
        $subject = $this->route('subject');

        return [
            'study_track_id' => ['sometimes', 'required', 'integer', 'exists:study_tracks,id'],
            'slug' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('subjects', 'slug')->ignore($subject)],
            'name_en' => ['sometimes', 'required', 'string', 'max:150'],
            'name_km' => ['sometimes', 'required', 'string', 'max:150'],
            'description_en' => ['nullable', 'string'],
            'description_km' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
            'color' => ['nullable', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
