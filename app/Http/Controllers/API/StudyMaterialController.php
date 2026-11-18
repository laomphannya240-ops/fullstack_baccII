<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\MaterialResource;
use App\Models\StudyMaterial;
use App\Support\ApiResponse;
use App\Support\ContentAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudyMaterialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $materials = StudyMaterial::query()
            ->with(['subject:id,name_en,name_km', 'chapter:id,title_en,title_km'])
            ->where('is_published', true)
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->when($request->user()?->study_track_id, function ($query) use ($request): void {
                if (! $request->user()->isAdmin()) {
                    $query->whereHas('subject', fn ($subjectQuery) => $subjectQuery->where('study_track_id', $request->user()->study_track_id));
                }
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        $bookmarks = $request->user()
            ? $request->user()->bookmarks()->where('bookmarkable_type', 'material')->whereIn('bookmarkable_id', $materials->pluck('id'))->pluck('bookmarkable_id')
            : collect();

        $materials->setCollection($materials->getCollection()->map(function (StudyMaterial $material) use ($bookmarks): StudyMaterial {
            $material->bookmarked = $bookmarks->contains($material->id);

            return $material;
        }));

        return ApiResponse::success(MaterialResource::collection($materials), null, ApiResponse::pagination($materials));
    }

    public function show(Request $request, StudyMaterial $material): JsonResponse
    {
        abort_unless($material->is_published, 404);
        $material->load(['subject', 'chapter']);
        ContentAccess::assertSubjectAvailable($material->subject, $request->user());

        return ApiResponse::success(new MaterialResource($material));
    }
}
