<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('role')->default('student')->after('email');
            $table->foreignId('study_track_id')->nullable()->after('role')->constrained()->nullOnDelete();
            $table->string('phone')->nullable()->after('study_track_id');
            $table->string('locale')->default('en')->after('phone');
            $table->string('avatar_path')->nullable()->after('locale');
            $table->boolean('is_active')->default(true)->after('avatar_path');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropForeign(['study_track_id']);
            $table->dropColumn([
                'role',
                'study_track_id',
                'phone',
                'locale',
                'avatar_path',
                'is_active',
            ]);
        });
    }
};
