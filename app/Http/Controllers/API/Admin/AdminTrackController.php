<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TrackResource;
use App\Models\StudyTrack;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTrackController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tracks = StudyTrack::withCount('subjects')->orderBy('sort_order')->paginate($request->integer('per_page', 20));

        return ApiResponse::success(TrackResource::collection($tracks), null, ApiResponse::pagination($tracks));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'unique:study_tracks,slug'],
            'name_en' => ['required', 'string', 'max:150'],
            'name_km' => ['required', 'string', 'max:150'],
            'description_en' => ['nullable', 'string'],
            'description_km' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $track = StudyTrack::create($validated);

        return ApiResponse::success(new TrackResource($track), 'Study track created.', 201);
    }

    public function show(StudyTrack $track): JsonResponse
    {
        return ApiResponse::success(new TrackResource($track->loadCount('subjects')));
    }

    public function update(Request $request, StudyTrack $track): JsonResponse
    {
        $validated = $request->validate([
            'slug' => ['sometimes', 'required', 'string', 'max:100', 'unique:study_tracks,slug,'.$track->id],
            'name_en' => ['sometimes', 'required', 'string', 'max:150'],
            'name_km' => ['sometimes', 'required', 'string', 'max:150'],
            'description_en' => ['nullable', 'string'],
            'description_km' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $track->update($validated);

        return ApiResponse::success(new TrackResource($track), 'Study track updated.');
    }

    public function destroy(StudyTrack $track): JsonResponse
    {
        abort_if($track->subjects()->exists(), 422, 'Remove the subjects in this track before deleting it.');

        $track->delete();

        return ApiResponse::success(null, 'Study track deleted.');
    }
}
