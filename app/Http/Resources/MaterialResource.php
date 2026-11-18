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
            'file_type' => $this->file_type,
            'file_size' => $this->file_size,
            'file_url' => asset('storage/'.$this->file_path),
            'is_published' => $this->is_published,
            'bookmarked' => (bool) ($this->bookmarked ?? false),
            'subject' => $this->whenLoaded('subject', fn () => [
                'id' => $this->subject->id,
                'name_en' => $this->subject->name_en,
                'name_km' => $this->subject->name_km,
            ]),
            'chapter' => $this->whenLoaded('chapter', fn () => [
                'id' => $this->chapter->id,
                'title_en' => $this->chapter->title_en,
                'title_km' => $this->chapter->title_km,
            ]),
        ];
    }
}
