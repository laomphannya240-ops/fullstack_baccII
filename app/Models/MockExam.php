<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'subject_id', 'title_en', 'title_km', 'description_en', 'description_km',
    'question_count', 'duration_minutes', 'passing_score', 'is_active',
])]
class MockExam extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'subject_id' => 'integer',
            'question_count' => 'integer',
            'duration_minutes' => 'integer',
            'passing_score' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(MockExamQuestion::class)->orderBy('sort_order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(MockExamAttempt::class);
    }
}
