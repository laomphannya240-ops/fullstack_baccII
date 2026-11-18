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
    private const MATERIAL_RELATIONS = [
        'subject:id,study_track_id,slug,name_en,name_km,is_active',
        'subject.studyTrack:id,slug,name_en,name_km',
        'chapter:id,subject_id,slug,title_en,title_km',
        'files',
    ];

    public function index(Request $request): JsonResponse
    {
        $materials = StudyMaterial::query()
            ->with(self::MATERIAL_RELATIONS)
            ->where('is_published', true)
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->when($request->integer('chapter_id'), fn ($query, $id) => $query->where('chapter_id', $id))
            ->when($request->integer('track_id'), fn ($query, $id) => $query->whereHas('subject', fn ($subjectQuery) => $subjectQuery->where('study_track_id', $id)))
            ->when($request->string('track_slug')->toString(), fn ($query, $slug) => $query->whereHas('subject.studyTrack', fn ($trackQuery) => $trackQuery->where('slug', $slug)))
            ->when($request->string('search')->toString() !== '', function ($query) use ($request): void {
                $term = '%'.$request->string('search')->toString().'%';
                $query->where(function ($builder) use ($term): void {
                    $builder->where('title_en', 'like', $term)
                        ->orWhere('title_km', 'like', $term)
                        ->orWhere('description', 'like', $term)
                        ->orWhere('file_name', 'like', $term)
                        ->orWhereHas('files', fn ($fileQuery) => $fileQuery->where('original_name', 'like', $term));
                });
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
        $material->load(self::MATERIAL_RELATIONS);
        ContentAccess::assertSubjectAvailable($material->subject, $request->user());

        return ApiResponse::success(new MaterialResource($material));
    }
}
