<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExerciseResource;
use App\Http\Resources\LessonResource;
use App\Http\Resources\MaterialResource;
use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\StudyMaterial;
use App\Services\BookmarkService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookmarkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $bookmarks = $user->bookmarks()->with('bookmarkable')->latest()->paginate($request->integer('per_page', 20));

        $items = $bookmarks->getCollection()->map(function ($bookmark) {
            $item = $bookmark->bookmarkable;

            if (! $item) {
                return null;
            }

            $resource = match (true) {
                $item instanceof Lesson => new LessonResource($item),
                $item instanceof Exercise => new ExerciseResource($item),
                $item instanceof StudyMaterial => new MaterialResource($item),
                default => null,
            };

            return $resource ? [
                'id' => $bookmark->id,
                'type' => $bookmark->bookmarkable_type,
                'created_at' => $bookmark->created_at?->toISOString(),
                'item' => $resource,
            ] : null;
        })->filter()->values();

        $bookmarks->setCollection($items);

        return ApiResponse::success($bookmarks->items(), null, ApiResponse::pagination($bookmarks));
    }

    public function toggle(Request $request, BookmarkService $bookmarks): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['lesson', 'exercise', 'material'])],
            'id' => ['required', 'integer', 'min:1'],
        ]);

        $result = $bookmarks->toggle($request->user(), $validated['type'], (int) $validated['id']);

        return ApiResponse::success($result, $result['bookmarked'] ? 'Bookmark added.' : 'Bookmark removed.');
    }

    public function destroy(Request $request, int $bookmark): JsonResponse
    {
        $deleted = $request->user()->bookmarks()->whereKey($bookmark)->delete();

        abort_unless($deleted, 404);

        return ApiResponse::success(null, 'Bookmark removed.');
    }
}
