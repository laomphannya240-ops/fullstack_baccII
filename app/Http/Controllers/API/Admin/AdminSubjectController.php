<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $subjects = Subject::with('studyTrack:id,slug,name_en,name_km')
            ->withCount(['chapters', 'lessons', 'exercises'])
            ->when($request->string('search')->toString() !== '', function ($query) use ($request): void {
                $term = $request->string('search')->toString();
                $query->where(function ($builder) use ($term): void {
                    $builder->where('name_en', 'like', "%{$term}%")
                        ->orWhere('name_km', 'like', "%{$term}%");
                });
            })
            ->when($request->integer('track_id'), fn ($query, $id) => $query->where('study_track_id', $id))
            ->orderBy('sort_order')
            ->paginate($request->integer('per_page', 15));

        return ApiResponse::success(SubjectResource::collection($subjects), null, ApiResponse::pagination($subjects));
    }

    public function store(StoreSubjectRequest $request): JsonResponse
    {
        $subject = Subject::create($request->validated());

        return ApiResponse::success(new SubjectResource($subject->load('studyTrack')), 'Subject created.', 201);
    }

    public function show(Subject $subject): JsonResponse
    {
        return ApiResponse::success(new SubjectResource($subject->load('studyTrack')->loadCount(['chapters', 'lessons', 'exercises'])));
    }

    public function update(UpdateSubjectRequest $request, Subject $subject): JsonResponse
    {
        $subject->update($request->validated());

        return ApiResponse::success(new SubjectResource($subject->load('studyTrack')), 'Subject updated.');
    }

    public function destroy(Subject $subject): JsonResponse
    {
        $subject->delete();

        return ApiResponse::success(null, 'Subject deleted.');
    }
}
