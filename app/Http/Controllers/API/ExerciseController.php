<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitExerciseRequest;
use App\Http\Resources\ExerciseAttemptResource;
use App\Http\Resources\ExerciseResource;
use App\Models\Exercise;
use App\Services\ActivityService;
use App\Services\GradingService;
use App\Support\ApiResponse;
use App\Support\ContentAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExerciseController extends Controller
{
    public function __construct(private GradingService $grading) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate([
            'subject_id' => ['nullable', 'integer'],
            'chapter_id' => ['nullable', 'integer'],
            'lesson_id' => ['nullable', 'integer'],
            'difficulty' => ['nullable', Rule::in(['easy', 'medium', 'hard'])],
            'type' => ['nullable', Rule::in(['mcq', 'true_false', 'short_answer', 'numerical'])],
        ]);

        $exercises = Exercise::query()
            ->with([
                'subject:id,slug,name_en,name_km',
                'chapter:id,title_en,title_km',
                'lesson:id,title_en,title_km',
                'options',
            ])
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->when($request->integer('chapter_id'), fn ($query, $id) => $query->where('chapter_id', $id))
            ->when($request->integer('lesson_id'), fn ($query, $id) => $query->where('lesson_id', $id))
            ->when($request->input('difficulty'), fn ($query, $value) => $query->where('difficulty', $value))
            ->when($request->input('type'), fn ($query, $value) => $query->where('type', $value))
            ->when($user && ! $user->isAdmin(), function ($query) use ($user): void {
                $query->where('is_published', true);
                if ($user->study_track_id) {
                    $query->whereHas('subject', fn ($subjectQuery) => $subjectQuery->where('study_track_id', $user->study_track_id));
                }
            })
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate($request->integer('per_page', 15));

        $bookmarkedIds = $user
            ? $user->bookmarks()->where('bookmarkable_type', 'exercise')->whereIn('bookmarkable_id', $exercises->pluck('id'))->pluck('bookmarkable_id')
            : collect();

        $exercises->setCollection($exercises->getCollection()->map(function (Exercise $exercise) use ($bookmarkedIds): Exercise {
            $exercise->bookmarked = $bookmarkedIds->contains($exercise->id);

            return $exercise;
        }));

        return ApiResponse::success(ExerciseResource::collection($exercises), null, ApiResponse::pagination($exercises));
    }

    public function show(Request $request, Exercise $exercise): JsonResponse
    {
        ContentAccess::assertPublished($exercise);
        $exercise->load(['subject', 'chapter', 'lesson', 'options']);
        ContentAccess::assertSubjectAvailable($exercise->subject, $request->user());

        return ApiResponse::success(new ExerciseResource($exercise));
    }

    public function submit(SubmitExerciseRequest $request, Exercise $exercise, ActivityService $activities): JsonResponse
    {
        ContentAccess::assertPublished($exercise);
        $exercise->load('subject');
        ContentAccess::assertSubjectAvailable($exercise->subject, $request->user());

        $submittedAnswer = $request->input('answer');
        $result = $this->grading->grade($exercise, $submittedAnswer);

        $attempt = $request->user()->exerciseAttempts()->create([
            'exercise_id' => $exercise->id,
            'submitted_answer' => $submittedAnswer,
            'is_correct' => $result['is_correct'],
            'points_earned' => $result['points_earned'],
            'feedback' => $result['is_correct'] ? 'Correct!' : 'Review the explanation and try again.',
        ]);

        $activities->log(
            $request->user(),
            'exercise_attempted',
            $exercise->subject_id,
            $exercise->id,
            $result['is_correct'] ? 'Solved an exercise correctly' : 'Attempted an exercise',
        );

        return ApiResponse::success(new ExerciseAttemptResource($attempt->load('exercise.options')), 'Answer submitted.');
    }

    public function history(Request $request): JsonResponse
    {
        $attempts = $request->user()->exerciseAttempts()
            ->with(['exercise.subject:id,name_en,name_km', 'exercise.options'])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return ApiResponse::success(ExerciseAttemptResource::collection($attempts), null, ApiResponse::pagination($attempts));
    }
}
