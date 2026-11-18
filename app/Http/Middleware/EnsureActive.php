<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActive
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_active) {
            $token = $user->currentAccessToken();

            if ($token !== null && method_exists($token, 'delete')) {
                $token->delete();
            }

            return ApiResponse::error('This account is inactive.', 403);
        }

        return $next($request);
    }
}
