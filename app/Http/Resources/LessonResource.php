<?php

namespace App\Http\Resources;

use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Lesson */
class LessonResource extends JsonResource
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
            'summary_en' => $this->summary_en,
            'summary_km' => $this->summary_km,
            'sort_order' => $this->sort_order,
            'estimated_minutes' => $this->estimated_minutes,
            'is_published' => (bool) $this->is_published,
            'is_reference' => (bool) $this->is_reference,
            'kind' => $this->is_reference ? 'reference' : 'lesson',
            'has_pdf' => (bool) $this->pdf_path,
            'has_video' => (bool) $this->video_url,
            'bookmarked' => (bool) ($this->bookmarked ?? false),
            'is_completed' => (bool) ($this->is_completed ?? false),
            'chapter' => $this->whenLoaded('chapter', fn () => [
                'id' => $this->chapter->id,
                'slug' => $this->chapter->slug,
                'title_en' => $this->chapter->title_en,
                'title_km' => $this->chapter->title_km,
                'subject' => $this->whenLoaded('chapter.subject', fn () => [
                    'id' => $this->chapter->subject->id,
                    'slug' => $this->chapter->subject->slug,
                    'name_en' => $this->chapter->subject->name_en,
                    'name_km' => $this->chapter->subject->name_km,
                ]),
            ]),
            'exercises_count' => $this->whenCounted('exercises'),
        ];
    }
}
