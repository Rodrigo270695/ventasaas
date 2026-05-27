<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('ADMIN_EMAIL', 'admin@example.com');

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => (string) env('ADMIN_NAME', 'Administrador'),
                'password' => Hash::make((string) env('ADMIN_PASSWORD', 'password')),
                'email_verified_at' => now(),
                'is_active' => true,
            ],
        );

        if (! $user->hasRole('admin')) {
            $user->assignRole('admin');
        }
    }
}
