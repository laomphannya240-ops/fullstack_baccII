<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SelectTrackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'study_track_id' => ['required', 'integer', 'exists:study_tracks,id,is_active,1'],
        ];
    }
}
