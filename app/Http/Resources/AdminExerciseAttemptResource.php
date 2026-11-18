<?php

namespace App\Http\Resources;

use App\Models\ExerciseAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ExerciseAttempt */
class AdminExerciseAttemptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'submitted_answer' => $this->submitted_answer,
            'is_correct' => (bool) $this->is_correct,
            'points_earned' => $this->points_earned,
            'feedback' => $this->feedback,
            'created_at' => $this->created_at?->toISOString(),
            'student' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'exercise' => $this->whenLoaded('exercise', fn () => [
                'id' => $this->exercise->id,
                'type' => $this->exercise->type,
                'question_km' => $this->exercise->question_km,
                'question_en' => $this->exercise->question_en,
                'difficulty' => $this->exercise->difficulty,
                'points' => $this->exercise->points,
                'image_url' => $this->exercise->image_path ? asset('storage/'.$this->exercise->image_path) : null,
                'subject' => $this->exercise->relationLoaded('subject') ? [
                    'id' => $this->exercise->subject->id,
                    'slug' => $this->exercise->subject->slug,
                    'name_en' => $this->exercise->subject->name_en,
                    'name_km' => $this->exercise->subject->name_km,
                ] : null,
            ]),
        ];
    }
}
