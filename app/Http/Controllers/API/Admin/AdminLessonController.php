<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLessonRequest;
use App\Http\Requests\UpdateLessonRequest;
use App\Http\Resources\LessonDetailResource;
use App\Http\Resources\LessonResource;
use App\Models\Lesson;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLessonController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $lessons = Lesson::with('chapter.subject:id,name_en,name_km')
            ->withCount('exercises')
            ->when($request->integer('chapter_id'), fn ($query, $id) => $query->where('chapter_id', $id))
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->whereHas('chapter', fn ($builder) => $builder->where('subject_id', $id)))
            ->orderBy('sort_order')
            ->paginate($request->integer('per_page', 20));

        return ApiResponse::success(LessonResource::collection($lessons), null, ApiResponse::pagination($lessons));
    }

    public function store(StoreLessonRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['pdf']);

        if ($request->hasFile('pdf')) {
            $data['pdf_path'] = $request->file('pdf')->store('lessons/pdfs', 'public');
        }

        $lesson = Lesson::create($data);

        return ApiResponse::success(new LessonDetailResource($lesson->load('chapter.subject')), 'Lesson created.', 201);
    }

    public function show(Lesson $lesson): JsonResponse
    {
        return ApiResponse::success(new LessonDetailResource($lesson->load(['chapter.subject', 'exercises.options'])));
    }

    public function update(UpdateLessonRequest $request, Lesson $lesson): JsonResponse
    {
        $data = $request->safe()->except(['pdf']);

        if ($request->hasFile('pdf')) {
            $data['pdf_path'] = $request->file('pdf')->store('lessons/pdfs', 'public');
        }

        $lesson->update($data);

        return ApiResponse::success(new LessonDetailResource($lesson->load('chapter.subject')), 'Lesson updated.');
    }

    public function destroy(Lesson $lesson): JsonResponse
    {
        $lesson->delete();

        return ApiResponse::success(null, 'Lesson deleted.');
    }
}
