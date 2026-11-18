<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'mock_exam_id', 'status', 'started_at', 'expires_at',
    'submitted_at', 'score', 'max_score', 'correct_count',
])]
class MockExamAttempt extends Model
{
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'mock_exam_id' => 'integer',
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
            'submitted_at' => 'datetime',
            'score' => 'integer',
            'max_score' => 'integer',
            'correct_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function mockExam(): BelongsTo
    {
        return $this->belongsTo(MockExam::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(MockExamAnswer::class, 'attempt_id');
    }
}
