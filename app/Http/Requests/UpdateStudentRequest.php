<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
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
        $student = $this->route('student');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($student)],
            'phone' => ['nullable', 'string', 'max:30'],
            'study_track_id' => ['nullable', 'integer', 'exists:study_tracks,id'],
            'role' => ['sometimes', 'in:student,admin'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
