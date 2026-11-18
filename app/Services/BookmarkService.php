<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;

class BookmarkService
{
    /**
     * @return array{bookmarked: bool, type: string, id: int}
     */
    public function toggle(User $user, string $type, int $id): array
    {
        $modelClass = Relation::morphMap()[$type] ?? null;

        abort_unless($modelClass !== null, 422, 'Unsupported bookmark type.');

        /** @var Model $model */
        $model = $modelClass::query()->findOrFail($id);

        if (isset($model->is_published) && ! $model->is_published) {
            abort(404);
        }

        $bookmark = $user->bookmarks()
            ->where('bookmarkable_type', $type)
            ->where('bookmarkable_id', $id)
            ->first();

        if ($bookmark) {
            $bookmark->delete();

            return ['bookmarked' => false, 'type' => $type, 'id' => $id];
        }

        $user->bookmarks()->create([
            'bookmarkable_type' => $type,
            'bookmarkable_id' => $id,
        ]);

        return ['bookmarked' => true, 'type' => $type, 'id' => $id];
    }
}
