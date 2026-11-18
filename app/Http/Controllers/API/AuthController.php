<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\SelectTrackRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());
        $user->refresh();
        $token = $user->createToken('studyhub-web')->plainTextToken;

        return ApiResponse::success([
            'user' => new UserResource($user->load('studyTrack')),
            'token' => $token,
        ], 'Account created successfully.', 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        /** @var User|null $user */
        $user = User::where('email', $request->input('email'))->first();

        if ($user === null || ! Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => [trans('auth.failed')],
            ]);
        }

        if (! $user->is_active) {
            return ApiResponse::error('This account is inactive.', 403);
        }

        $token = $user->createToken('studyhub-web')->plainTextToken;

        return ApiResponse::success([
            'user' => new UserResource($user->load('studyTrack')),
            'token' => $token,
        ], 'Logged in successfully.');
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token !== null && method_exists($token, 'delete')) {
            $token->delete();
        }

        Auth::guard('web')->logout();

        return ApiResponse::success(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(new UserResource($request->user()->load('studyTrack')));
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            $data['avatar_path'] = $request->file('avatar')->store('avatars', 'public');
        }

        unset($data['avatar']);
        $user->update($data);

        return ApiResponse::success(new UserResource($user->load('studyTrack')), 'Profile updated successfully.');
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($request->input('current_password'), $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $request->input('password')]);

        return ApiResponse::success(null, 'Password changed successfully.');
    }

    public function selectTrack(SelectTrackRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->update(['study_track_id' => $request->integer('study_track_id')]);

        return ApiResponse::success(new UserResource($user->load('studyTrack')), 'Study track updated.');
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::broker()->sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return ApiResponse::success(null, 'A password reset link has been sent to your email.');
        }

        return ApiResponse::error('We could not send a reset link to that email address.', 422, [
            'email' => [trans($status)],
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::broker()->reset($request->only('email', 'password', 'password_confirmation', 'token'), function (User $user, string $password): void {
            $user->forceFill([
                'password' => $password,
                'remember_token' => Str::random(60),
            ])->save();

            $user->tokens()->delete();
        });

        if ($status === Password::PASSWORD_RESET) {
            return ApiResponse::success(null, 'Password reset successfully. Please log in.');
        }

        return ApiResponse::error('This password reset link is invalid or has expired.', 422, [
            'token' => [trans($status)],
        ]);
    }
}
