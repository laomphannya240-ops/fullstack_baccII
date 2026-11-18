<?php

namespace App\Http\Resources;

use App\Models\Chapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Chapter */
class ChapterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title_en' => $this->title_en,
            'title_km' => $this->title_km,
            'description_en' => $this->description_en,
            'description_km' => $this->description_km,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'subject' => $this->whenLoaded('subject', fn () => [
                'id' => $this->subject->id,
                'slug' => $this->subject->slug,
                'name_en' => $this->subject->name_en,
                'name_km' => $this->subject->name_km,
            ]),
            'lessons_count' => $this->whenCounted('lessons'),
            'progress_percentage' => $this->when(isset($this->progress_percentage), (int) $this->progress_percentage),
            'lessons' => $this->whenLoaded('lessons', fn () => LessonResource::collection($this->lessons)),
        ];
    }
}
