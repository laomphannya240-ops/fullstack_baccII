<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudyMaterialRequest;
use App\Http\Requests\UpdateStudyMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\StudyMaterial;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMaterialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $materials = StudyMaterial::with(['subject:id,name_en,name_km', 'chapter:id,title_en,title_km'])
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return ApiResponse::success(MaterialResource::collection($materials), null, ApiResponse::pagination($materials));
    }

    public function store(StoreStudyMaterialRequest $request): JsonResponse
    {
        $file = $request->file('file');

        $material = StudyMaterial::create(array_merge($request->safe()->except(['file']), [
            'file_path' => $file->store('materials', 'public'),
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
        ]));

        return ApiResponse::success(new MaterialResource($material->load(['subject', 'chapter'])), 'Material uploaded.', 201);
    }

    public function show(StudyMaterial $material): JsonResponse
    {
        return ApiResponse::success(new MaterialResource($material->load(['subject', 'chapter'])));
    }

    public function update(UpdateStudyMaterialRequest $request, StudyMaterial $material): JsonResponse
    {
        $data = $request->safe()->except(['file']);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $data['file_path'] = $file->store('materials', 'public');
            $data['file_type'] = $file->getClientOriginalExtension();
            $data['file_size'] = $file->getSize();
        }

        $material->update($data);

        return ApiResponse::success(new MaterialResource($material->load(['subject', 'chapter'])), 'Material updated.');
    }

    public function destroy(StudyMaterial $material): JsonResponse
    {
        $material->delete();

        return ApiResponse::success(null, 'Material deleted.');
    }
}
