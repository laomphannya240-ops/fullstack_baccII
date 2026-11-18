<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::latest('created_at')->paginate($request->integer('per_page', 15));

        return ApiResponse::success(AnnouncementResource::collection($announcements), null, ApiResponse::pagination($announcements));
    }

    public function store(StoreAnnouncementRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['published_at'] = $data['published_at'] ?? now();

        $announcement = Announcement::create($data);

        return ApiResponse::success(new AnnouncementResource($announcement), 'Announcement created.', 201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        return ApiResponse::success(new AnnouncementResource($announcement));
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): JsonResponse
    {
        $announcement->update($request->validated());

        return ApiResponse::success(new AnnouncementResource($announcement), 'Announcement updated.');
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return ApiResponse::success(null, 'Announcement deleted.');
    }
}
