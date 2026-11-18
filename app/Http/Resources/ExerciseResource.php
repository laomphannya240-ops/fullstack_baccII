<?php

namespace App\Http\Resources;

use App\Models\Exercise;
use App\Services\GradingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Exercise */
class ExerciseResource extends JsonResource
{
    public function __construct(mixed $resource, public bool $revealAnswers = false)
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject_id' => $this->subject_id,
            'chapter_id' => $this->chapter_id,
            'lesson_id' => $this->lesson_id,
            'type' => $this->type,
            'question_km' => $this->question_km,
            'question_en' => $this->question_en,
            'points' => $this->points,
            'difficulty' => $this->difficulty,
            'sort_order' => $this->sort_order,
            'is_published' => (bool) $this->is_published,
            'bookmarked' => (bool) ($this->bookmarked ?? false),
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
            'options' => $this->whenLoaded('options', fn () => $this->options->map(fn ($option): array => [
                'id' => $option->id,
                'option_km' => $option->option_km,
                'option_en' => $option->option_en,
                'is_correct' => $this->revealAnswers ? (bool) $option->is_correct : null,
            ])->values()->all()),
            'correct_answer' => $this->revealAnswers ? app(GradingService::class)->correctAnswer($this->resource) : null,
            'accepted_answers' => $this->revealAnswers ? ($this->accepted_answers ?? []) : null,
            'explanation_km' => $this->revealAnswers ? $this->explanation_km : null,
            'explanation_en' => $this->revealAnswers ? $this->explanation_en : null,
        ];
    }
}
