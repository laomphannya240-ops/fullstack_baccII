<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated.', 401);
        }

        if (! $user->is_active) {
            return ApiResponse::error('This account is inactive.', 403);
        }

        if ($user->role !== $role) {
            return ApiResponse::error('You do not have permission to perform this action.', 403);
        }

        return $next($request);
    }
}
