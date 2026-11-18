<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'exercise_id', 'submitted_answer', 'is_correct', 'points_earned', 'feedback'])]
class ExerciseAttempt extends Model
{
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'exercise_id' => 'integer',
            'is_correct' => 'boolean',
            'points_earned' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
