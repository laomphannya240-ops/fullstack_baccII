<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\ProgressService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminStudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $students = User::students()
            ->search($request->string('search')->toString() ?: null)
            ->with('studyTrack:id,slug,name_en,name_km')
            ->withCount(['lessonProgress', 'quizAttempts', 'examAttempts', 'exerciseAttempts'])
            ->when($request->integer('track_id'), fn ($query, $id) => $query->where('study_track_id', $id))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return ApiResponse::success(UserResource::collection($students), null, ApiResponse::pagination($students));
    }

    public function show(User $student): JsonResponse
    {
        abort_unless($student->role === 'student', 404);

        $student->load('studyTrack:id,slug,name_en,name_km')
            ->loadCount(['lessonProgress', 'quizAttempts', 'examAttempts', 'exerciseAttempts']);

        return ApiResponse::success(new UserResource($student));
    }

    public function update(UpdateStudentRequest $request, User $student): JsonResponse
    {
        abort_unless($student->role === 'student', 404);

        $student->update($request->validated());

        return ApiResponse::success(new UserResource($student->load('studyTrack')), 'Student updated.');
    }

    public function progress(User $student, ProgressService $progress): JsonResponse
    {
        abort_unless($student->role === 'student', 404);

        return ApiResponse::success($progress->dashboard($student));
    }

    public function destroy(User $student): JsonResponse
    {
        abort_unless($student->role === 'student', 404);

        $student->update(['is_active' => false]);
        $student->tokens()->delete();

        return ApiResponse::success(null, 'Student deactivated.');
    }
}
