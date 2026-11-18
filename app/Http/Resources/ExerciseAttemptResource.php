<?php

namespace App\Http\Resources;

use App\Models\ExerciseAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ExerciseAttempt */
class ExerciseAttemptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exercise_id' => $this->exercise_id,
            'exercise' => new ExerciseResource($this->exercise, true),
            'submitted_answer' => $this->submitted_answer,
            'is_correct' => (bool) $this->is_correct,
            'points_earned' => $this->points_earned,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
