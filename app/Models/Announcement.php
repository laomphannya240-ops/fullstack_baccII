<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['created_by', 'title_en', 'title_km', 'body_en', 'body_km', 'is_pinned', 'published_at'])]
class Announcement extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'created_by' => 'integer',
            'is_pinned' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
