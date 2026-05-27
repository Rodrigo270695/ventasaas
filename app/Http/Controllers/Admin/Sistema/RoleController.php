<?php

namespace App\Http\Controllers\Admin\Sistema;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Sistema\RolePermissionRequest;
use App\Http\Requests\Admin\Sistema\RoleRequest;
use App\Models\User;
use App\Support\PermissionCatalog;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('roles.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['roleModal', 'roleModalRoleId', 'errors']);
        }

        $canAssignPermissions = $request->user()->can('roles.assign-permissions');

        $roles = Role::query()
            ->where('guard_name', PermissionCatalog::guard())
            ->withCount(['permissions', 'users'])
            ->when($canAssignPermissions, fn ($query) => $query->with('permissions:id,name'))
            ->orderBy('name')
            ->get(['id', 'name']);

        $rolesPayload = $roles->map(fn (Role $role) => [
            'id' => $role->id,
            'name' => $role->name,
            'permissions_count' => $role->permissions_count,
            'users_count' => $role->users_count,
            'permission_names' => $canAssignPermissions
                ? $role->permissions->pluck('name')->values()->all()
                : [],
        ]);

        $withPermissions = $roles->where('permissions_count', '>', 0)->count();
        $withoutPermissions = $roles->count() - $withPermissions;
        $usersWithRole = User::query()->whereHas('roles')->count();
        $rolesWithUsers = $roles->where('users_count', '>', 0)->count();

        return Inertia::render('admin/sistema/roles/index', [
            'roles' => $rolesPayload,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $roles->count(), 'tone' => 'violet'],
                ['key' => 'with_permissions', 'label' => 'Con permisos', 'value' => $withPermissions, 'tone' => 'cyan'],
                ['key' => 'without_permissions', 'label' => 'Sin permisos', 'value' => $withoutPermissions, 'tone' => 'amber'],
                ['key' => 'users_with_role', 'label' => 'Usuarios con rol', 'value' => $usersWithRole, 'tone' => 'green'],
                ['key' => 'roles_with_users', 'label' => 'Roles en uso', 'value' => $rolesWithUsers, 'tone' => 'slate'],
            ],
            'permissionCatalog' => $canAssignPermissions
                ? PermissionCatalog::groups()
                : null,
            'roleModal' => session()->pull('roleModal'),
            'roleModalRoleId' => session()->pull('roleModalRoleId'),
            'oldName' => old('name', ''),
        ]);
    }

    public function store(RoleRequest $request): RedirectResponse
    {
        Role::create([
            'name' => $request->validated('name'),
            'guard_name' => PermissionCatalog::guard(),
        ]);

        Toast::success('Rol creado correctamente.');

        return to_route('admin.sistema.roles.index');
    }

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        abort_unless($role->guard_name === PermissionCatalog::guard(), 404);

        $role->update($request->validated());

        Toast::success('Rol actualizado correctamente.');

        return to_route('admin.sistema.roles.index');
    }

    public function syncPermissions(RolePermissionRequest $request, Role $role): RedirectResponse
    {
        abort_unless($role->guard_name === PermissionCatalog::guard(), 404);

        if ($role->name === 'admin') {
            Toast::error('Los permisos del rol administrador no se pueden modificar.');

            return to_route('admin.sistema.roles.index');
        }

        $role->syncPermissions($request->validated('permissions', []));

        Toast::success('Permisos del rol actualizados.');

        return to_route('admin.sistema.roles.index');
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        abort_unless($request->user()?->can('roles.delete'), 403);
        abort_unless($role->guard_name === PermissionCatalog::guard(), 404);

        if ($role->name === 'admin') {
            Toast::error('No se puede eliminar el rol administrador.');

            return to_route('admin.sistema.roles.index');
        }

        if ($role->users()->count() > 0) {
            Toast::error('No se puede eliminar un rol asignado a usuarios.');

            return to_route('admin.sistema.roles.index');
        }

        $role->delete();

        Toast::success('Rol eliminado correctamente.');

        return to_route('admin.sistema.roles.index');
    }
}
