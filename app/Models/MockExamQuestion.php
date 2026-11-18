<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['mock_exam_id', 'exercise_id', 'marks', 'sort_order'])]
class MockExamQuestion extends Model
{
    protected function casts(): array
    {
        return [
            'mock_exam_id' => 'integer',
            'exercise_id' => 'integer',
            'marks' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function mockExam(): BelongsTo
    {
        return $this->belongsTo(MockExam::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
