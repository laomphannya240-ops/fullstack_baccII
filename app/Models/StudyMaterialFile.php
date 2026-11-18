<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\UploadedFile;

#[Fillable([
    'study_material_id', 'original_name', 'path', 'type',
    'mime_type', 'size', 'sort_order',
])]
class StudyMaterialFile extends Model
{
    protected function casts(): array
    {
        return [
            'study_material_id' => 'integer',
            'size' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(StudyMaterial::class, 'study_material_id');
    }

    public static function kindFor(UploadedFile $file): string
    {
        $extension = strtolower($file->guessExtension() ?: $file->getClientOriginalExtension());

        return $extension === 'pdf' ? 'pdf' : 'image';
    }
}
