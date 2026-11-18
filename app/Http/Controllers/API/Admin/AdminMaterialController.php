<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudyMaterialRequest;
use App\Http\Requests\UpdateStudyMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\StudyMaterial;
use App\Models\StudyMaterialFile;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AdminMaterialController extends Controller
{
    private const MATERIAL_RELATIONS = [
        'subject:id,study_track_id,slug,name_en,name_km',
        'subject.studyTrack:id,slug,name_en,name_km',
        'chapter:id,subject_id,slug,title_en,title_km',
        'files',
    ];

    public function index(Request $request): JsonResponse
    {
        $materials = StudyMaterial::with(self::MATERIAL_RELATIONS)
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

        return ApiResponse::success(MaterialResource::collection($materials), null, ApiResponse::pagination($materials));
    }

    public function store(StoreStudyMaterialRequest $request): JsonResponse
    {
        $uploads = $this->uploadedFiles($request);
        $storedPaths = [];

        try {
            $material = DB::transaction(function () use ($request, $uploads, &$storedPaths): StudyMaterial {
                $material = StudyMaterial::create(array_merge($request->safe()->only([
                    'subject_id', 'chapter_id', 'title_en', 'title_km', 'description',
                ]), [
                    'file_path' => '',
                    'file_type' => 'pdf',
                    'is_published' => $request->has('is_published') ? $request->boolean('is_published') : true,
                ]));

                $files = $this->storeFiles($material, $uploads);
                $storedPaths = $files->pluck('path')->all();
                $this->syncLegacyColumns($material, $files);

                return $material->load(self::MATERIAL_RELATIONS);
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);

            throw $exception;
        }

        return ApiResponse::success(new MaterialResource($material), 'Material uploaded.', 201);
    }

    public function show(StudyMaterial $material): JsonResponse
    {
        return ApiResponse::success(new MaterialResource($material->load(self::MATERIAL_RELATIONS)));
    }

    public function update(UpdateStudyMaterialRequest $request, StudyMaterial $material): JsonResponse
    {
        $uploads = $this->uploadedFiles($request);
        $storedPaths = [];

        try {
            $material = DB::transaction(function () use ($request, $material, $uploads, &$storedPaths): StudyMaterial {
                $data = $request->safe()->only([
                    'subject_id', 'chapter_id', 'title_en', 'title_km', 'description',
                ]);

                if ($request->has('is_published')) {
                    $data['is_published'] = $request->boolean('is_published');
                }

                $material->update($data);

                if ($request->boolean('replace_files')) {
                    $this->deleteFileRecords($material->files()->get());
                }

                $removedIds = collect($request->input('removed_file_ids', []))
                    ->filter()
                    ->map(fn ($id) => (int) $id)
                    ->values();

                if ($removedIds->isNotEmpty() && ! $request->boolean('replace_files')) {
                    $this->deleteFileRecords($material->files()->whereIn('id', $removedIds)->get());
                }

                $files = $this->storeFiles($material, $uploads);
                $storedPaths = $files->pluck('path')->all();
                $this->syncLegacyColumns($material);

                return $material->load(self::MATERIAL_RELATIONS);
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);

            throw $exception;
        }

        return ApiResponse::success(new MaterialResource($material), 'Material updated.');
    }

    public function destroy(StudyMaterial $material): JsonResponse
    {
        DB::transaction(function () use ($material): void {
            $this->deleteFileRecords($material->files()->get());
            $material->delete();
        });

        return ApiResponse::success(null, 'Material deleted.');
    }

    /**
     * @return array<int, UploadedFile>
     */
    private function uploadedFiles(Request $request): array
    {
        $files = $request->file('files', []);

        if (! is_array($files)) {
            $files = [$files];
        }

        $legacyFile = $request->file('file');

        if ($legacyFile instanceof UploadedFile) {
            $files[] = $legacyFile;
        }

        return array_values(array_filter($files, fn ($file) => $file instanceof UploadedFile));
    }

    /**
     * @param  array<int, UploadedFile>  $uploads
     * @return EloquentCollection<int, StudyMaterialFile>
     */
    private function storeFiles(StudyMaterial $material, array $uploads): EloquentCollection
    {
        $material->loadMissing(['subject.studyTrack', 'chapter']);

        $trackSlug = $material->subject?->studyTrack?->slug ?: 'general';
        $subjectSlug = $material->subject?->slug ?: 'subject';
        $chapterSlug = $material->chapter?->slug ?: 'chapter';
        $folder = "materials/{$trackSlug}/{$subjectSlug}/{$chapterSlug}";
        $maxOrder = $material->files()->max('sort_order');
        $nextOrder = $maxOrder === null ? 0 : (int) $maxOrder + 1;
        $created = new EloquentCollection;

        foreach ($uploads as $upload) {
            $path = $upload->store($folder, 'public');
            $type = StudyMaterialFile::kindFor($upload);
            $file = $material->files()->create([
                'original_name' => $upload->getClientOriginalName(),
                'path' => $path,
                'type' => $type,
                'mime_type' => $upload->getMimeType(),
                'size' => $upload->getSize(),
                'sort_order' => $nextOrder,
            ]);
            $created->push($file);
            $nextOrder += 1;
        }

        return $created;
    }

    /**
     * @param  EloquentCollection<int, StudyMaterialFile>  $files
     */
    private function deleteFileRecords(EloquentCollection $files): void
    {
        if ($files->isEmpty()) {
            return;
        }

        Storage::disk('public')->delete($files->pluck('path')->filter()->all());
        StudyMaterialFile::whereIn('id', $files->pluck('id'))->delete();
    }

    /**
     * @param  EloquentCollection<int, StudyMaterialFile>|null  $files
     */
    private function syncLegacyColumns(StudyMaterial $material, ?EloquentCollection $files = null): void
    {
        $files ??= $material->files()->get();
        $first = $files->first();

        $material->update([
            'file_path' => $first?->path ?? '',
            'file_name' => $first?->original_name,
            'file_type' => $first?->type ?? 'image',
            'file_size' => $files->sum('size') ?: null,
        ]);
    }
}
