<?php

namespace App\Support;

class PermissionCatalog
{
    /**
     * @return list<array{
     *     key: string,
     *     section: string|null,
     *     label: string,
     *     implemented: bool,
     *     permissions: list<array{name: string, label: string}>
     * }>
     */
    public static function groups(): array
    {
        /** @var list<array{key: string, section?: string|null, label: string, implemented?: bool, permissions: list<array{name: string, label: string}>}> $groups */
        $groups = config('permissions.groups', []);

        return array_map(
            static fn (array $group): array => [
                'key' => $group['key'],
                'section' => isset($group['section']) && $group['section'] !== ''
                    ? (string) $group['section']
                    : null,
                'label' => $group['label'],
                'implemented' => (bool) ($group['implemented'] ?? true),
                'permissions' => $group['permissions'],
            ],
            $groups,
        );
    }

    /**
     * @return list<string>
     */
    public static function allNames(): array
    {
        return collect(self::groups())
            ->flatMap(fn (array $group) => collect($group['permissions'])->pluck('name'))
            ->unique()
            ->values()
            ->all();
    }

    public static function guard(): string
    {
        return (string) config('permissions.guard', 'web');
    }
}
