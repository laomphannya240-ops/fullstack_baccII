<?php

namespace App\Http\Resources;

use App\Models\StudyMaterial;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StudyMaterial */
class MaterialResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_en' => $this->title_en,
            'title_km' => $this->title_km,
            'description' => $this->description,
            'material_type' => $this->materialType(),
            'file_type' => $this->file_type,
            'file_name' => $this->file_name,
            'file_size' => $this->file_size,
            'file_url' => $this->publicUrl($this->file_path),
            'files' => $this->whenLoaded(
                'files',
                fn () => $this->files->isNotEmpty()
                    ? $this->files->map(fn ($file) => [
                        'id' => $file->id,
                        'name' => $file->original_name,
                        'type' => $file->type,
                        'mime_type' => $file->mime_type,
                        'size' => $file->size,
                        'sort_order' => $file->sort_order,
                        'url' => $this->publicUrl($file->path),
                    ])->values()->all()
                    : $this->legacyFiles(),
                fn () => $this->legacyFiles(),
            ),
            'is_published' => $this->is_published,
            'bookmarked' => (bool) ($this->bookmarked ?? false),
            'created_at' => $this->created_at?->toISOString(),
            'subject' => $this->whenLoaded('subject', fn () => [
                'id' => $this->subject->id,
                'slug' => $this->subject->slug,
                'name_en' => $this->subject->name_en,
                'name_km' => $this->subject->name_km,
                'study_track' => $this->subject->relationLoaded('studyTrack') ? [
                    'id' => $this->subject->studyTrack->id,
                    'slug' => $this->subject->studyTrack->slug,
                    'name_en' => $this->subject->studyTrack->name_en,
                    'name_km' => $this->subject->studyTrack->name_km,
                ] : null,
            ]),
            'chapter' => $this->whenLoaded('chapter', fn () => [
                'id' => $this->chapter->id,
                'slug' => $this->chapter->slug,
                'title_en' => $this->chapter->title_en,
                'title_km' => $this->chapter->title_km,
            ]),
        ];
    }

    private function materialType(): string
    {
        if ($this->relationLoaded('files') && $this->files->isNotEmpty()) {
            return $this->files->first()->type;
        }

        $extension = strtolower((string) $this->file_type);

        return match (true) {
            $extension === 'pdf' => 'pdf',
            in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true) => 'image',
            default => $extension !== '' ? $extension : 'pdf',
        };
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function legacyFiles(): array
    {
        if (! $this->file_path) {
            return [];
        }

        return [[
            'id' => null,
            'name' => $this->file_name ?: basename($this->file_path),
            'type' => $this->materialType(),
            'mime_type' => null,
            'size' => $this->file_size,
            'sort_order' => 0,
            'url' => $this->publicUrl($this->file_path),
        ]];
    }

    private function publicUrl(?string $path): ?string
    {
        return $path ? asset('storage/'.$path) : null;
    }
}
