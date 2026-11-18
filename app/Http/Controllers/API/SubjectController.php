<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;
use App\Support\ApiResponse;
use App\Support\ContentAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $subjects = Subject::query()
            ->with(['studyTrack:id,slug,name_en,name_km'])
            ->withCount(['chapters', 'lessons', 'exercises'])
            ->when($request->string('search')->toString() !== '', function ($query) use ($request): void {
                $term = $request->string('search')->toString();
                $query->where(function ($builder) use ($term): void {
                    $builder->where('name_en', 'like', "%{$term}%")
                        ->orWhere('name_km', 'like', "%{$term}%")
                        ->orWhere('slug', 'like', "%{$term}%");
                });
            })
            ->when(! ($user && $user->isAdmin()), function ($query): void {
                $query->where('is_active', true);
            })
            ->when($request->string('track_slug')->toString() !== '', function ($query) use ($request): void {
                $query->whereHas('studyTrack', fn ($trackQuery) => $trackQuery->where('slug', $request->string('track_slug')->toString()));
            })
            ->when($request->integer('track_id'), fn ($query, $trackId) => $query->where('study_track_id', $trackId))
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success(SubjectResource::collection($subjects));
    }

    public function show(Request $request, Subject $subject): JsonResponse
    {
        ContentAccess::assertSubjectAvailable($subject, $request->user());

        $subject->load([
            'studyTrack:id,slug,name_en,name_km',
            'chapters' => fn ($query) => $query->where('is_active', true)->orderBy('sort_order')->with(['lessons' => fn ($lessonQuery) => $lessonQuery->where('is_published', true)->orderBy('sort_order')]),
        ])->loadCount('chapters');

        return ApiResponse::success(new SubjectResource($subject));
    }
}
