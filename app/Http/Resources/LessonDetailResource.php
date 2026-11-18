<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class LessonDetailResource extends LessonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'content_km' => $this->content_km,
            'content_en' => $this->content_en,
            'important_notes' => $this->important_notes,
            'video_url' => $this->video_url,
            'pdf_url' => $this->pdf_path ? asset('storage/'.$this->pdf_path) : null,
            'previous' => $this->when(isset($this->previous), fn () => $this->previous),
            'next' => $this->when(isset($this->next), fn () => $this->next),
            'exercises' => $this->whenLoaded('exercises', fn () => ExerciseResource::collection($this->exercises)),
        ]);
    }
}
