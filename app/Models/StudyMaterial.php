<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable([
    'subject_id', 'chapter_id', 'title_en', 'title_km', 'description',
    'file_path', 'file_name', 'file_type', 'file_size', 'is_published',
])]
class StudyMaterial extends Model
{
    protected function casts(): array
    {
        return [
            'subject_id' => 'integer',
            'chapter_id' => 'integer',
            'file_size' => 'integer',
            'is_published' => 'boolean',
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

    public function files(): HasMany
    {
        return $this->hasMany(StudyMaterialFile::class)->orderBy('sort_order');
    }

    public function bookmarks(): MorphMany
    {
        return $this->morphMany(Bookmark::class, 'bookmarkable');
    }
}
