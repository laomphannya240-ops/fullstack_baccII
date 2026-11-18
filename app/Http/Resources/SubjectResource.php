<?php

namespace App\Http\Resources;

use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Subject */
class SubjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name_en' => $this->name_en,
            'name_km' => $this->name_km,
            'description_en' => $this->description_en,
            'description_km' => $this->description_km,
            'icon' => $this->icon,
            'color' => $this->color,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'study_track' => $this->whenLoaded('studyTrack', fn () => [
                'id' => $this->studyTrack->id,
                'slug' => $this->studyTrack->slug,
                'name_en' => $this->studyTrack->name_en,
                'name_km' => $this->studyTrack->name_km,
            ]),
            'chapters_count' => $this->whenCounted('chapters'),
            'lessons_count' => $this->whenCounted('lessons'),
            'exercises_count' => $this->whenCounted('exercises'),
            'progress_percentage' => $this->when(isset($this->progress_percentage), (int) $this->progress_percentage),
            'completed_lessons' => $this->when(isset($this->completed_lessons), (int) $this->completed_lessons),
            'chapters' => $this->whenLoaded('chapters', fn () => ChapterResource::collection($this->chapters)),
        ];
    }
}
