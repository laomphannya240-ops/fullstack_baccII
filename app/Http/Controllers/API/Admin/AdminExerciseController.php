<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExerciseRequest;
use App\Http\Requests\UpdateExerciseRequest;
use App\Http\Resources\AdminExerciseResource;
use App\Models\Exercise;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminExerciseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $exercises = Exercise::with(['subject:id,name_en,name_km', 'chapter:id,title_en,title_km', 'lesson:id,title_en,title_km', 'options'])
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->when($request->integer('chapter_id'), fn ($query, $id) => $query->where('chapter_id', $id))
            ->when($request->integer('lesson_id'), fn ($query, $id) => $query->where('lesson_id', $id))
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20));

        return ApiResponse::success(AdminExerciseResource::collection($exercises), null, ApiResponse::pagination($exercises));
    }

    public function store(StoreExerciseRequest $request): JsonResponse
    {
        $exercise = DB::transaction(function () use ($request): Exercise {
            $data = $request->safe()->except(['options']);
            $exercise = Exercise::create($data);
            $this->syncOptions($exercise, $request->input('options', []));

            return $exercise;
        });

        return ApiResponse::success(new AdminExerciseResource($exercise->load(['subject', 'chapter', 'lesson', 'options'])), 'Exercise created.', 201);
    }

    public function show(Exercise $exercise): JsonResponse
    {
        return ApiResponse::success(new AdminExerciseResource($exercise->load(['subject', 'chapter', 'lesson', 'options'])));
    }

    public function update(UpdateExerciseRequest $request, Exercise $exercise): JsonResponse
    {
        DB::transaction(function () use ($request, $exercise): void {
            $exercise->update($request->safe()->except(['options']));

            if ($request->has('options')) {
                $this->syncOptions($exercise, $request->input('options') ?? []);
            }
        });

        return ApiResponse::success(new AdminExerciseResource($exercise->load(['subject', 'chapter', 'lesson', 'options'])), 'Exercise updated.');
    }

    public function destroy(Exercise $exercise): JsonResponse
    {
        $exercise->delete();

        return ApiResponse::success(null, 'Exercise deleted.');
    }

    /**
     * @param  array<int, array{option_km?: string, option_en?: string|null, is_correct?: bool, sort_order?: int}>  $options
     */
    private function syncOptions(Exercise $exercise, array $options): void
    {
        if (! in_array($exercise->type, ['mcq', 'true_false'], true)) {
            $exercise->options()->delete();

            return;
        }

        $exercise->options()->delete();

        foreach ($options as $index => $option) {
            $exercise->options()->create([
                'option_km' => $option['option_km'] ?? '',
                'option_en' => $option['option_en'] ?? null,
                'is_correct' => (bool) ($option['is_correct'] ?? false),
                'sort_order' => $option['sort_order'] ?? $index,
            ]);
        }
    }
}
