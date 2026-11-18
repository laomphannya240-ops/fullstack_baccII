<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Http\Resources\TrackResource;
use App\Models\Announcement;
use App\Models\Chapter;
use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\MockExam;
use App\Models\Quiz;
use App\Models\StudyTrack;
use App\Models\Subject;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    public function tracks(): JsonResponse
    {
        $tracks = StudyTrack::where('is_active', true)
            ->with(['subjects' => fn ($query) => $query->where('is_active', true)->orderBy('sort_order')])
            ->withCount('subjects')
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success(TrackResource::collection($tracks));
    }

    public function stats(): JsonResponse
    {
        return ApiResponse::success([
            'tracks' => StudyTrack::where('is_active', true)->count(),
            'subjects' => Subject::where('is_active', true)->count(),
            'chapters' => Chapter::where('is_active', true)->count(),
            'lessons' => Lesson::where('is_published', true)->count(),
            'exercises' => Exercise::where('is_published', true)->count(),
            'quizzes' => Quiz::where('is_active', true)->count(),
            'mock_exams' => MockExam::where('is_active', true)->count(),
            'students' => User::students()->where('is_active', true)->count(),
        ]);
    }

    public function announcements(): JsonResponse
    {
        $announcements = Announcement::whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->limit(5)
            ->get();

        return ApiResponse::success(AnnouncementResource::collection($announcements));
    }
}
