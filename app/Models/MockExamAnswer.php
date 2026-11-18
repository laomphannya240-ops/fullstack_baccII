<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['attempt_id', 'exercise_id', 'submitted_answer', 'is_correct', 'points_earned'])]
class MockExamAnswer extends Model
{
    protected function casts(): array
    {
        return [
            'attempt_id' => 'integer',
            'exercise_id' => 'integer',
            'is_correct' => 'boolean',
            'points_earned' => 'integer',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(MockExamAttempt::class, 'attempt_id');
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
