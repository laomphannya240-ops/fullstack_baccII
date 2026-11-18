<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'chapter_id', 'slug', 'title_en', 'title_km', 'summary_en', 'summary_km',
    'content_km', 'content_en', 'video_url', 'pdf_path', 'important_notes',
    'sort_order', 'estimated_minutes', 'is_published', 'is_reference',
])]
class Lesson extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'chapter_id' => 'integer',
            'sort_order' => 'integer',
            'estimated_minutes' => 'integer',
            'is_published' => 'boolean',
            'is_reference' => 'boolean',
        ];
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function bookmarks(): MorphMany
    {
        return $this->morphMany(Bookmark::class, 'bookmarkable');
    }
}
