<?php

namespace App\Http\Controllers\Admin\Sistema;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Sistema\UserRequest;
use App\Http\Requests\Admin\Sistema\UserRoleRequest;
use App\Models\User;
use App\Support\PermissionCatalog;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('users.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['userModal', 'userModalUserId', 'errors']);
        }

        $canAssignRoles = $request->user()->can('users.assign-roles');

        $users = User::query()
            ->with('roles:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'is_active']);

        $usersPayload = $users->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => $user->is_active,
            'role_names' => $canAssignRoles
                ? $user->roles->pluck('name')->values()->all()
                : [],
            'role_ids' => $canAssignRoles
                ? $user->roles->pluck('id')->values()->all()
                : [],
        ]);

        $activeCount = $users->where('is_active', true)->count();
        $withRoles = $users->filter(fn (User $user) => $user->roles->isNotEmpty())->count();

        return Inertia::render('admin/sistema/users/index', [
            'users' => $usersPayload,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $users->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activos', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'inactive', 'label' => 'Inactivos', 'value' => $users->count() - $activeCount, 'tone' => 'amber'],
                ['key' => 'with_roles', 'label' => 'Con rol', 'value' => $withRoles, 'tone' => 'cyan'],
            ],
            'rolesCatalog' => $canAssignRoles
                ? Role::query()
                    ->where('guard_name', PermissionCatalog::guard())
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : null,
            'userModal' => session()->pull('userModal'),
            'userModalUserId' => session()->pull('userModalUserId'),
            'oldForm' => [
                'name' => old('name', ''),
                'email' => old('email', ''),
                'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
            ],
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        Toast::success('Usuario creado correctamente.');

        return to_route('admin.sistema.usuarios.index');
    }

    public function update(UserRequest $request, User $usuario): RedirectResponse
    {
        $validated = $request->validated();

        $usuario->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'is_active' => $validated['is_active'] ?? $usuario->is_active,
        ]);

        if (! empty($validated['password'])) {
            $usuario->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        Toast::success('Usuario actualizado correctamente.');

        return to_route('admin.sistema.usuarios.index');
    }

    public function syncRoles(UserRoleRequest $request, User $usuario): RedirectResponse
    {
        $roleIds = $request->validated('roles', []);
        $roles = Role::query()
            ->where('guard_name', PermissionCatalog::guard())
            ->whereIn('id', $roleIds)
            ->get();

        $usuario->syncRoles($roles);

        Toast::success('Roles del usuario actualizados.');

        return to_route('admin.sistema.usuarios.index');
    }

    public function destroy(Request $request, User $usuario): RedirectResponse
    {
        abort_unless($request->user()?->can('users.delete'), 403);

        if ($request->user()->is($usuario)) {
            Toast::error('No puedes eliminar tu propia cuenta.');

            return to_route('admin.sistema.usuarios.index');
        }

        $usuario->delete();

        Toast::success('Usuario eliminado correctamente.');

        return to_route('admin.sistema.usuarios.index');
    }
}
