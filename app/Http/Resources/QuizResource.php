<?php

namespace App\Http\Resources;

use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Quiz */
class QuizResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_en' => $this->title_en,
            'title_km' => $this->title_km,
            'description_en' => $this->description_en,
            'description_km' => $this->description_km,
            'question_count' => $this->question_count,
            'duration_minutes' => $this->duration_minutes,
            'passing_score' => $this->passing_score,
            'is_active' => $this->is_active,
            'subject' => $this->whenLoaded('subject', fn () => [
                'id' => $this->subject->id,
                'slug' => $this->subject->slug,
                'name_en' => $this->subject->name_en,
                'name_km' => $this->subject->name_km,
            ]),
            'chapter' => $this->whenLoaded('chapter', fn () => [
                'id' => $this->chapter->id,
                'title_en' => $this->chapter->title_en,
                'title_km' => $this->chapter->title_km,
            ]),
            'lesson' => $this->whenLoaded('lesson', fn () => [
                'id' => $this->lesson->id,
                'title_en' => $this->lesson->title_en,
                'title_km' => $this->lesson->title_km,
            ]),
            'exercise_ids' => $this->whenLoaded('questions', fn () => $this->questions->pluck('exercise_id')->all()),
            'questions_count' => $this->whenCounted('questions'),
            'attempts_count' => $this->whenCounted('attempts'),
            'best_score' => $this->when(isset($this->best_score), (int) $this->best_score),
            'questions' => $this->whenLoaded('questions', fn () => ExerciseResource::collection($this->questions->pluck('exercise')->filter()->values())),
        ];
    }
}
