<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuizRequest;
use App\Http\Requests\UpdateQuizRequest;
use App\Http\Resources\QuizResource;
use App\Models\Quiz;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminQuizController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $quizzes = Quiz::with(['subject:id,name_en,name_km', 'questions:quiz_id,exercise_id,sort_order'])
            ->withCount('questions')
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return ApiResponse::success(QuizResource::collection($quizzes), null, ApiResponse::pagination($quizzes));
    }

    public function store(StoreQuizRequest $request): JsonResponse
    {
        $quiz = DB::transaction(function () use ($request): Quiz {
            $quiz = Quiz::create($request->safe()->except(['exercise_ids']));
            $this->syncQuestions($quiz, $request->input('exercise_ids') ?? []);

            return $quiz;
        });

        return ApiResponse::success(new QuizResource($quiz->load(['subject', 'chapter', 'lesson'])), 'Quiz created.', 201);
    }

    public function show(Quiz $quiz): JsonResponse
    {
        return ApiResponse::success(new QuizResource($quiz->load(['subject', 'chapter', 'lesson', 'questions.exercise.options'])->loadCount('questions')));
    }

    public function update(UpdateQuizRequest $request, Quiz $quiz): JsonResponse
    {
        DB::transaction(function () use ($request, $quiz): void {
            $quiz->update($request->safe()->except(['exercise_ids']));

            if ($request->has('exercise_ids')) {
                $this->syncQuestions($quiz, $request->input('exercise_ids') ?? []);
            }
        });

        return ApiResponse::success(new QuizResource($quiz->load(['subject', 'chapter', 'lesson'])), 'Quiz updated.');
    }

    public function destroy(Quiz $quiz): JsonResponse
    {
        $quiz->delete();

        return ApiResponse::success(null, 'Quiz deleted.');
    }

    /**
     * @param  array<int, int>  $exerciseIds
     */
    private function syncQuestions(Quiz $quiz, array $exerciseIds): void
    {
        $quiz->questions()->delete();

        foreach (array_values(array_unique($exerciseIds)) as $index => $exerciseId) {
            $quiz->questions()->create([
                'exercise_id' => $exerciseId,
                'sort_order' => $index,
            ]);
        }
    }
}
