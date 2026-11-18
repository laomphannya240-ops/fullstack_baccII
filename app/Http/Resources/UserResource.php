<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'locale' => $this->locale,
            'is_active' => $this->is_active,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_path ? asset('storage/'.$this->avatar_path) : null,
            'lesson_progress_count' => $this->when(isset($this->lesson_progress_count), (int) $this->lesson_progress_count),
            'quiz_attempts_count' => $this->when(isset($this->quiz_attempts_count), (int) $this->quiz_attempts_count),
            'exam_attempts_count' => $this->when(isset($this->exam_attempts_count), (int) $this->exam_attempts_count),
            'exercise_attempts_count' => $this->when(isset($this->exercise_attempts_count), (int) $this->exercise_attempts_count),
            'study_track' => $this->whenLoaded('studyTrack', fn () => [
                'id' => $this->studyTrack->id,
                'slug' => $this->studyTrack->slug,
                'name_en' => $this->studyTrack->name_en,
                'name_km' => $this->studyTrack->name_km,
            ]),
        ];
    }
}
