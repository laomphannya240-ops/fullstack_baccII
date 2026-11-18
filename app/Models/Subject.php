<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'study_track_id', 'slug', 'name_en', 'name_km', 'description_en', 'description_km',
    'icon', 'color', 'sort_order', 'is_active',
])]
class Subject extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'study_track_id' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function studyTrack(): BelongsTo
    {
        return $this->belongsTo(StudyTrack::class);
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class);
    }

    public function lessons(): HasManyThrough
    {
        return $this->hasManyThrough(Lesson::class, Chapter::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class);
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    public function mockExams(): HasMany
    {
        return $this->hasMany(MockExam::class);
    }

    public function studyMaterials(): HasMany
    {
        return $this->hasMany(StudyMaterial::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(StudyActivity::class);
    }
}
