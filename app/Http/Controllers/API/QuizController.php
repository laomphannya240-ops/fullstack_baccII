<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartQuizRequest;
use App\Http\Requests\SubmitQuizRequest;
use App\Http\Resources\QuizAttemptResource;
use App\Http\Resources\QuizResource;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Services\AssessmentService;
use App\Support\ApiResponse;
use App\Support\ContentAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class QuizController extends Controller
{
    public function __construct(private AssessmentService $assessments) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $quizzes = Quiz::query()
            ->with(['subject:id,slug,name_en,name_km', 'chapter:id,title_en,title_km'])
            ->withCount('questions')
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->when($request->integer('chapter_id'), fn ($query, $id) => $query->where('chapter_id', $id))
            ->when(! ($user && $user->isAdmin()), function ($query) use ($user): void {
                $query->where('is_active', true);
                if ($user?->study_track_id) {
                    $query->whereHas('subject', fn ($subjectQuery) => $subjectQuery->where('study_track_id', $user->study_track_id));
                }
            })
            ->orderBy('id')
            ->paginate($request->integer('per_page', 12));

        $bestScores = QuizAttempt::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereIn('quiz_id', $quizzes->pluck('id'))
            ->selectRaw('quiz_id, MAX(score) as best_score')
            ->groupBy('quiz_id')
            ->pluck('best_score', 'quiz_id');

        $quizzes->setCollection($quizzes->getCollection()->map(function (Quiz $quiz) use ($bestScores): Quiz {
            $quiz->best_score = $bestScores->get($quiz->id, 0);

            return $quiz;
        }));

        return ApiResponse::success(QuizResource::collection($quizzes), null, ApiResponse::pagination($quizzes));
    }

    public function show(Request $request, Quiz $quiz): JsonResponse
    {
        $quiz->load(['subject', 'chapter', 'lesson', 'questions.exercise.options']);
        abort_unless($quiz->is_active, 404);
        ContentAccess::assertSubjectAvailable($quiz->subject, $request->user());

        return ApiResponse::success(new QuizResource($quiz));
    }

    public function start(StartQuizRequest $request, Quiz $quiz): JsonResponse
    {
        $quiz->load('subject');
        abort_unless($quiz->is_active, 404);
        ContentAccess::assertSubjectAvailable($quiz->subject, $request->user());

        $attempt = $this->assessments->startQuiz(
            $request->user(),
            $quiz,
            $request->integer('question_count') ?: null,
        );

        return ApiResponse::success(new QuizAttemptResource($attempt), 'Quiz started.', 201);
    }

    public function attempt(Request $request, int $attempt): JsonResponse
    {
        $quizAttempt = $this->findAttempt($request, $attempt);

        return ApiResponse::success(new QuizAttemptResource($quizAttempt));
    }

    public function submit(SubmitQuizRequest $request, int $attempt): JsonResponse
    {
        $quizAttempt = $this->findAttempt($request, $attempt);

        $submitted = $this->assessments->submitQuiz($quizAttempt, $request->input('answers', []));

        return ApiResponse::success(new QuizAttemptResource($submitted), 'Quiz submitted.');
    }

    public function history(Request $request): JsonResponse
    {
        $attempts = QuizAttempt::where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->with(['quiz.subject:id,name_en,name_km', 'answers.exercise.options'])
            ->latest('submitted_at')
            ->paginate($request->integer('per_page', 15));

        return ApiResponse::success(QuizAttemptResource::collection($attempts), null, ApiResponse::pagination($attempts));
    }

    private function findAttempt(Request $request, int $attemptId): QuizAttempt
    {
        $attempt = QuizAttempt::whereKey($attemptId)
            ->where('user_id', $request->user()->id)
            ->with(['quiz.subject:id,name_en,name_km', 'answers.exercise.options'])
            ->firstOrFail();

        Gate::authorize('view', $attempt);

        return $attempt;
    }
}
