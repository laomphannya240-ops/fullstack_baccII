<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMockExamRequest;
use App\Http\Requests\UpdateMockExamRequest;
use App\Http\Resources\MockExamResource;
use App\Models\MockExam;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminMockExamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $exams = MockExam::with(['subject:id,name_en,name_km', 'questions:mock_exam_id,exercise_id,marks,sort_order'])
            ->withCount('questions')
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return ApiResponse::success(MockExamResource::collection($exams), null, ApiResponse::pagination($exams));
    }

    public function store(StoreMockExamRequest $request): JsonResponse
    {
        $exam = DB::transaction(function () use ($request): MockExam {
            $exam = MockExam::create($request->safe()->except(['exercise_ids']));
            $this->syncQuestions($exam, $request->input('exercise_ids') ?? []);

            return $exam;
        });

        return ApiResponse::success(new MockExamResource($exam->load('subject')), 'Mock exam created.', 201);
    }

    public function show(MockExam $exam): JsonResponse
    {
        return ApiResponse::success(new MockExamResource($exam->load(['subject', 'questions.exercise.options'])->loadCount('questions')));
    }

    public function update(UpdateMockExamRequest $request, MockExam $exam): JsonResponse
    {
        DB::transaction(function () use ($request, $exam): void {
            $exam->update($request->safe()->except(['exercise_ids']));

            if ($request->has('exercise_ids')) {
                $this->syncQuestions($exam, $request->input('exercise_ids') ?? []);
            }
        });

        return ApiResponse::success(new MockExamResource($exam->load('subject')), 'Mock exam updated.');
    }

    public function destroy(MockExam $exam): JsonResponse
    {
        $exam->delete();

        return ApiResponse::success(null, 'Mock exam deleted.');
    }

    /**
     * @param  array<int, int>  $exerciseIds
     */
    private function syncQuestions(MockExam $exam, array $exerciseIds): void
    {
        $exam->questions()->delete();

        foreach (array_values(array_unique($exerciseIds)) as $index => $exerciseId) {
            $exam->questions()->create([
                'exercise_id' => $exerciseId,
                'sort_order' => $index,
                'marks' => 1,
            ]);
        }
    }
}
