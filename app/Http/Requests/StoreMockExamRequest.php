<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMockExamRequest extends FormRequest
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
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'title_en' => ['required', 'string', 'max:200'],
            'title_km' => ['required', 'string', 'max:200'],
            'description_en' => ['nullable', 'string'],
            'description_km' => ['nullable', 'string'],
            'question_count' => ['nullable', 'integer', 'min:1', 'max:200'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:300'],
            'passing_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'exercise_ids' => ['nullable', 'array', 'min:1'],
            'exercise_ids.*' => ['integer', 'exists:exercises,id'],
        ];
    }
}
