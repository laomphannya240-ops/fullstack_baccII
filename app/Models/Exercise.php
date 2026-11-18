<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'subject_id', 'chapter_id', 'lesson_id', 'type', 'question_km', 'question_en', 'image_path',
    'explanation_km', 'explanation_en', 'correct_answer', 'accepted_answers',
    'points', 'difficulty', 'sort_order', 'is_published',
])]
class Exercise extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'subject_id' => 'integer',
            'chapter_id' => 'integer',
            'lesson_id' => 'integer',
            'points' => 'integer',
            'sort_order' => 'integer',
            'is_published' => 'boolean',
            'accepted_answers' => 'array',
        ];
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(ExerciseOption::class)->orderBy('sort_order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(ExerciseAttempt::class);
    }

    public function quizQuestions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class);
    }

    public function examQuestions(): HasMany
    {
        return $this->hasMany(MockExamQuestion::class);
    }

    public function bookmarks(): MorphMany
    {
        return $this->morphMany(Bookmark::class, 'bookmarkable');
    }
}
