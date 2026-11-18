<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChapterRequest;
use App\Http\Requests\UpdateChapterRequest;
use App\Http\Resources\ChapterResource;
use App\Models\Chapter;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminChapterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $chapters = Chapter::with('subject:id,name_en,name_km,slug')
            ->withCount('lessons')
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->orderBy('sort_order')
            ->paginate($request->integer('per_page', 20));

        return ApiResponse::success(ChapterResource::collection($chapters), null, ApiResponse::pagination($chapters));
    }

    public function store(StoreChapterRequest $request): JsonResponse
    {
        $chapter = Chapter::create($request->validated());

        return ApiResponse::success(new ChapterResource($chapter->load('subject')), 'Chapter created.', 201);
    }

    public function show(Chapter $chapter): JsonResponse
    {
        return ApiResponse::success(new ChapterResource($chapter->load('subject')->loadCount('lessons')));
    }

    public function update(UpdateChapterRequest $request, Chapter $chapter): JsonResponse
    {
        $chapter->update($request->validated());

        return ApiResponse::success(new ChapterResource($chapter->load('subject')), 'Chapter updated.');
    }

    public function destroy(Chapter $chapter): JsonResponse
    {
        $chapter->delete();

        return ApiResponse::success(null, 'Chapter deleted.');
    }
}
