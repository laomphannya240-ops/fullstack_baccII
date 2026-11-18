<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\TrackResource;
use App\Models\StudyTrack;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class TrackController extends Controller
{
    public function index(): JsonResponse
    {
        $tracks = StudyTrack::query()
            ->withCount('subjects')
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success(TrackResource::collection($tracks));
    }
}
