<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminExerciseAttemptResource;
use App\Models\ExerciseAttempt;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminExerciseAttemptController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['nullable', 'integer'],
            'subject_id' => ['nullable', 'integer'],
            'exercise_id' => ['nullable', 'integer'],
            'is_correct' => ['nullable', 'boolean'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $attempts = ExerciseAttempt::query()
            ->with($this->relations())
            ->when($request->integer('student_id'), fn ($query, $id) => $query->where('user_id', $id))
            ->when($request->integer('exercise_id'), fn ($query, $id) => $query->where('exercise_id', $id))
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->whereHas('exercise', fn ($exerciseQuery) => $exerciseQuery->where('subject_id', $id)))
            ->when($request->has('is_correct'), fn ($query) => $query->where('is_correct', $request->boolean('is_correct')))
            ->when($request->string('from')->toString() !== '', fn ($query) => $query->whereDate('created_at', '>=', $request->string('from')->toString()))
            ->when($request->string('to')->toString() !== '', fn ($query) => $query->whereDate('created_at', '<=', $request->string('to')->toString()))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return ApiResponse::success(AdminExerciseAttemptResource::collection($attempts), null, ApiResponse::pagination($attempts));
    }

    public function show(ExerciseAttempt $exerciseAttempt): JsonResponse
    {
        $exerciseAttempt->load($this->relations());

        return ApiResponse::success(new AdminExerciseAttemptResource($exerciseAttempt));
    }

    /**
     * @return array<int, string>
     */
    private function relations(): array
    {
        return [
            'user:id,name,email',
            'exercise:id,subject_id,type,question_km,question_en,points,difficulty,image_path',
            'exercise.subject:id,slug,name_en,name_km',
        ];
    }
}
