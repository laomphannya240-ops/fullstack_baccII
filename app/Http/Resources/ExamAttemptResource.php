<?php

namespace App\Http\Resources;

use App\Models\MockExamAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MockExamAttempt */
class ExamAttemptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $reveal = $this->status === 'completed';
        $percentage = $this->max_score > 0 ? (int) round($this->score / $this->max_score * 100) : 0;

        return [
            'id' => $this->id,
            'status' => $this->status,
            'started_at' => $this->started_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'score' => $this->score,
            'max_score' => $this->max_score,
            'correct_count' => $this->correct_count,
            'percentage' => $percentage,
            'mock_exam' => $this->whenLoaded('mockExam', fn () => [
                'id' => $this->mockExam->id,
                'title_en' => $this->mockExam->title_en,
                'title_km' => $this->mockExam->title_km,
                'duration_minutes' => $this->mockExam->duration_minutes,
                'passing_score' => $this->mockExam->passing_score,
                'subject' => $this->whenLoaded('mockExam.subject', fn () => [
                    'id' => $this->mockExam->subject?->id,
                    'name_en' => $this->mockExam->subject?->name_en,
                    'name_km' => $this->mockExam->subject?->name_km,
                ]),
            ]),
            'answers' => $this->whenLoaded('answers', fn () => $this->answers->map(fn ($answer): array => [
                'id' => $answer->id,
                'exercise_id' => $answer->exercise_id,
                'submitted_answer' => $answer->submitted_answer,
                'is_correct' => $reveal ? (bool) $answer->is_correct : null,
                'points_earned' => $reveal ? $answer->points_earned : null,
                'exercise' => new ExerciseResource($answer->exercise, $reveal),
            ])->values()->all()),
        ];
    }
}
