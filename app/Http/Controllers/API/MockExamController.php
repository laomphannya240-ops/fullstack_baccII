<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveExamAnswerRequest;
use App\Http\Requests\SubmitExamRequest;
use App\Http\Resources\ExamAttemptResource;
use App\Http\Resources\MockExamResource;
use App\Models\MockExam;
use App\Models\MockExamAttempt;
use App\Services\AssessmentService;
use App\Support\ApiResponse;
use App\Support\ContentAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MockExamController extends Controller
{
    public function __construct(private AssessmentService $assessments) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $exams = MockExam::query()
            ->with('subject:id,slug,name_en,name_km')
            ->withCount('questions')
            ->when($request->integer('subject_id'), fn ($query, $id) => $query->where('subject_id', $id))
            ->when(! ($user && $user->isAdmin()), function ($query) use ($user): void {
                $query->where('is_active', true);
                if ($user?->study_track_id) {
                    $query->whereHas('subject', fn ($subjectQuery) => $subjectQuery->where('study_track_id', $user->study_track_id));
                }
            })
            ->orderBy('id')
            ->paginate($request->integer('per_page', 12));

        $bestScores = MockExamAttempt::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereIn('mock_exam_id', $exams->pluck('id'))
            ->selectRaw('mock_exam_id, MAX(score) as best_score')
            ->groupBy('mock_exam_id')
            ->pluck('best_score', 'mock_exam_id');

        $exams->setCollection($exams->getCollection()->map(function (MockExam $exam) use ($bestScores): MockExam {
            $exam->best_score = $bestScores->get($exam->id, 0);

            return $exam;
        }));

        return ApiResponse::success(MockExamResource::collection($exams), null, ApiResponse::pagination($exams));
    }

    public function show(Request $request, MockExam $exam): JsonResponse
    {
        $exam->load('subject');
        abort_unless($exam->is_active, 404);
        ContentAccess::assertSubjectAvailable($exam->subject, $request->user());

        return ApiResponse::success(new MockExamResource($exam));
    }

    public function start(Request $request, MockExam $exam): JsonResponse
    {
        $exam->load('subject');
        abort_unless($exam->is_active, 404);
        ContentAccess::assertSubjectAvailable($exam->subject, $request->user());

        $attempt = $this->assessments->startExam($request->user(), $exam);

        return ApiResponse::success(new ExamAttemptResource($attempt), 'Exam started.', 201);
    }

    public function attempt(Request $request, int $attempt): JsonResponse
    {
        return ApiResponse::success(new ExamAttemptResource($this->findAttempt($request, $attempt)));
    }

    public function saveAnswer(SaveExamAnswerRequest $request, int $attempt): JsonResponse
    {
        $examAttempt = $this->findAttempt($request, $attempt);

        $answer = $this->assessments->saveExamAnswer(
            $examAttempt,
            (int) $request->integer('exercise_id'),
            $request->input('answer'),
        );

        return ApiResponse::success(['exercise_id' => $answer->exercise_id, 'answer' => $answer->submitted_answer], 'Answer saved.');
    }

    public function submit(SubmitExamRequest $request, int $attempt): JsonResponse
    {
        $examAttempt = $this->findAttempt($request, $attempt);
        $submitted = $this->assessments->submitExam($examAttempt);

        return ApiResponse::success(new ExamAttemptResource($submitted), 'Exam submitted.');
    }

    public function history(Request $request): JsonResponse
    {
        $attempts = MockExamAttempt::where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->with(['mockExam.subject:id,name_en,name_km', 'answers.exercise.options'])
            ->latest('submitted_at')
            ->paginate($request->integer('per_page', 15));

        return ApiResponse::success(ExamAttemptResource::collection($attempts), null, ApiResponse::pagination($attempts));
    }

    private function findAttempt(Request $request, int $attemptId): MockExamAttempt
    {
        $attempt = MockExamAttempt::whereKey($attemptId)
            ->where('user_id', $request->user()->id)
            ->with(['mockExam.subject:id,name_en,name_km', 'answers.exercise.options'])
            ->firstOrFail();

        Gate::authorize('view', $attempt);

        return $attempt;
    }
}
