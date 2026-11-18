<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->paginate($request->integer('per_page', 10));

        return ApiResponse::success(
            AnnouncementResource::collection($announcements),
            null,
            ApiResponse::pagination($announcements),
        );
    }

    public function show(Announcement $announcement): JsonResponse
    {
        abort_unless($announcement->published_at && $announcement->published_at->isPast(), 404);

        return ApiResponse::success(new AnnouncementResource($announcement));
    }
}
