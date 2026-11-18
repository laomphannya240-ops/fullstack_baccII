<?php

namespace App\Http\Resources;

use App\Models\StudyActivity;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StudyActivity */
class ActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'description' => $this->description,
            'reference_id' => $this->reference_id,
            'occurred_at' => $this->occurred_at?->toISOString(),
            'subject' => $this->whenLoaded('subject', fn () => [
                'id' => $this->subject->id,
                'name_en' => $this->subject->name_en,
                'name_km' => $this->subject->name_km,
            ]),
        ];
    }
}
