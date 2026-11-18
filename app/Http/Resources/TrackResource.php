<?php

namespace App\Http\Resources;

use App\Models\StudyTrack;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StudyTrack */
class TrackResource extends JsonResource
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
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'subjects_count' => $this->whenCounted('subjects'),
            'subjects' => $this->whenLoaded('subjects', fn () => SubjectResource::collection($this->subjects)),
        ];
    }
}
