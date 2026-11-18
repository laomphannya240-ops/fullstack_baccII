<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\UserResource;
use App\Models\Announcement;
use App\Models\Chapter;
use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\MockExam;
use App\Models\Quiz;
use App\Models\StudyActivity;
use App\Models\StudyMaterial;
use App\Models\StudyTrack;
use App\Models\Subject;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $counts = [
            'students' => User::students()->count(),
            'tracks' => StudyTrack::count(),
            'subjects' => Subject::count(),
            'chapters' => Chapter::count(),
            'lessons' => Lesson::count(),
            'exercises' => Exercise::count(),
            'quizzes' => Quiz::count(),
            'mock_exams' => MockExam::count(),
            'materials' => StudyMaterial::count(),
            'announcements' => Announcement::count(),
        ];

        $recentActivity = StudyActivity::with(['user:id,name,email', 'subject:id,name_en,name_km'])
            ->latest('occurred_at')
            ->limit(10)
            ->get();

        $recentStudents = User::students()
            ->with('studyTrack:id,slug,name_en,name_km')
            ->latest()
            ->limit(5)
            ->get();

        return ApiResponse::success([
            'counts' => $counts,
            'recent_activity' => ActivityResource::collection($recentActivity),
            'recent_students' => UserResource::collection($recentStudents),
        ]);
    }
}
