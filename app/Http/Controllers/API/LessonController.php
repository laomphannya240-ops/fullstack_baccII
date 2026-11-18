<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\LessonDetailResource;
use App\Http\Resources\LessonResource;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Services\ActivityService;
use App\Support\ApiResponse;
use App\Support\ContentAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $lessons = Lesson::query()
            ->with(['chapter.subject:id,slug,name_en,name_km,study_track_id,is_active'])
            ->when($request->integer('chapter_id'), fn ($query, $chapterId) => $query->where('chapter_id', $chapterId))
            ->when($request->integer('subject_id'), fn ($query, $subjectId) => $query->whereHas('chapter', fn ($chapterQuery) => $chapterQuery->where('subject_id', $subjectId)))
            ->when($request->has('is_reference'), fn ($query) => $query->where('is_reference', $request->boolean('is_reference')))
            ->when($request->string('search')->toString() !== '', function ($query) use ($request): void {
                $term = $request->string('search')->toString();
                $query->where(function ($builder) use ($term): void {
                    $builder->where('title_en', 'like', "%{$term}%")
                        ->orWhere('title_km', 'like', "%{$term}%")
                        ->orWhere('summary_en', 'like', "%{$term}%")
                        ->orWhere('summary_km', 'like', "%{$term}%");
                });
            })
            ->when($request->string('track_slug')->toString() !== '', function ($query) use ($request): void {
                $query->whereHas('chapter.subject.studyTrack', fn ($trackQuery) => $trackQuery->where('slug', $request->string('track_slug')->toString()));
            })
            ->when(! ($user && $user->isAdmin()), fn ($query) => $query->where('is_published', true))
            ->orderBy('sort_order')
            ->paginate($request->integer('per_page', 20));

        $progress = $user ? LessonProgress::where('user_id', $user->id)->whereIn('lesson_id', $lessons->pluck('id'))->get()->keyBy('lesson_id') : collect();
        $bookmarks = $user ? $user->bookmarks()->where('bookmarkable_type', 'lesson')->whereIn('bookmarkable_id', $lessons->pluck('id'))->pluck('bookmarkable_id') : collect();

        $lessons->setCollection($lessons->getCollection()->map(function (Lesson $lesson) use ($progress, $bookmarks) {
            $lesson->is_completed = (bool) $progress->get($lesson->id)?->is_completed;
            $lesson->bookmarked = $bookmarks->contains($lesson->id);

            return $lesson;
        }));

        return ApiResponse::success(LessonResource::collection($lessons), null, ApiResponse::pagination($lessons));
    }

    public function show(Request $request, Lesson $lesson, ActivityService $activities): JsonResponse
    {
        $user = $request->user();
        $lesson->load(['chapter.subject.studyTrack', 'exercises' => fn ($query) => $query->where('is_published', true)->orderBy('sort_order')->with('options')]);

        ContentAccess::assertPublished($lesson);
        ContentAccess::assertSubjectAvailable($lesson->chapter->subject, $user);

        if ($lesson->is_reference) {
            $activities->log(
                $user,
                'reference_viewed',
                $lesson->chapter->subject_id,
                $lesson->id,
                'Viewed reference: '.$lesson->title_en,
            );
        }

        $neighbors = Lesson::where('chapter_id', $lesson->chapter_id)
            ->where('is_published', true)
            ->where('is_reference', $lesson->is_reference)
            ->orderBy('sort_order')
            ->get(['id', 'slug', 'title_en', 'title_km', 'sort_order']);

        $index = $neighbors->search(fn ($item) => $item->id === $lesson->id);
        $previous = $index !== false ? $neighbors->get($index - 1) : null;
        $next = $index !== false ? $neighbors->get($index + 1) : null;

        $lesson->previous = $previous ? ['id' => $previous->id, 'title_en' => $previous->title_en, 'title_km' => $previous->title_km] : null;
        $lesson->next = $next ? ['id' => $next->id, 'title_en' => $next->title_en, 'title_km' => $next->title_km] : null;
        $lesson->bookmarked = $user ? $user->bookmarks()->where('bookmarkable_type', 'lesson')->where('bookmarkable_id', $lesson->id)->exists() : false;
        $lesson->is_completed = $user ? LessonProgress::where('user_id', $user->id)->where('lesson_id', $lesson->id)->where('is_completed', true)->exists() : false;

        return ApiResponse::success(new LessonDetailResource($lesson));
    }

    public function markProgress(Request $request, Lesson $lesson, ActivityService $activities): JsonResponse
    {
        $user = $request->user();
        $lesson->load('chapter.subject');
        ContentAccess::assertPublished($lesson);
        ContentAccess::assertSubjectAvailable($lesson->chapter->subject, $user);

        $request->validate([
            'is_completed' => ['nullable', 'boolean'],
            'last_position' => ['nullable', 'integer', 'min:0'],
        ]);

        $progress = LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'is_completed' => $request->boolean('is_completed'),
                'last_position' => $request->integer('last_position', 0),
                'completed_at' => $request->boolean('is_completed') ? now() : null,
            ],
        );

        if ($progress->is_completed) {
            $activities->log($user, 'lesson_completed', $lesson->chapter->subject_id, $lesson->id, 'Completed lesson: '.$lesson->title_en);
        }

        return ApiResponse::success(['progress' => $progress], 'Lesson progress saved.');
    }
}
