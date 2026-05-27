import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PermissionGroup } from '@/types/admin/roles';

type Props = {
    catalog: PermissionGroup[];
    roleId: number;
    selected: Set<string>;
    disabled?: boolean;
    onTogglePermission: (name: string, checked: boolean) => void;
    onToggleGroup: (names: string[], checked: boolean) => void;
};

function groupCheckState(
    names: string[],
    selected: Set<string>,
): boolean | 'indeterminate' {
    const checkedCount = names.filter((name) => selected.has(name)).length;

    if (checkedCount === 0) {
        return false;
    }

    if (checkedCount === names.length) {
        return true;
    }

    return 'indeterminate';
}

type PermissionGroupListProps = {
    groups: PermissionGroup[];
    roleId: number;
    selected: Set<string>;
    disabled: boolean;
    defaultOpen: boolean;
    muted?: boolean;
    onTogglePermission: (name: string, checked: boolean) => void;
    onToggleGroup: (names: string[], checked: boolean) => void;
};

function groupsBySection(groups: PermissionGroup[]): Array<{
    section: string | null;
    groups: PermissionGroup[];
}> {
    const sections: Array<{ section: string | null; groups: PermissionGroup[] }> =
        [];
    const indexBySection = new Map<string | null, number>();

    for (const group of groups) {
        const section = group.section ?? null;
        let index = indexBySection.get(section);

        if (index === undefined) {
            index = sections.length;
            indexBySection.set(section, index);
            sections.push({ section, groups: [] });
        }

        sections[index].groups.push(group);
    }

    return sections;
}

function PermissionGroupList({
    groups,
    roleId,
    selected,
    disabled,
    defaultOpen,
    muted = false,
    onTogglePermission,
    onToggleGroup,
}: PermissionGroupListProps) {
    if (groups.length === 0) {
        return null;
    }

    const sectioned = groupsBySection(groups);

    return (
        <div className="space-y-3">
            {sectioned.map(({ section, groups: sectionGroups }) => (
                <div key={section ?? '__default'} className="space-y-1.5">
                    {section ? (
                        <p
                            className={cn(
                                'px-0.5 text-[10px] font-bold uppercase tracking-wide',
                                muted ? 'text-[#9d8fb0]' : 'text-[#6d28d9]',
                            )}
                        >
                            {section}
                        </p>
                    ) : null}
                    <div
                        className={cn(
                            'overflow-hidden rounded-lg border border-violet-100/90',
                            muted ? 'bg-slate-50/80' : 'bg-violet-50/30',
                        )}
                    >
                        {sectionGroups.map((group, index) => {
                const names = group.permissions.map((p) => p.name);
                const groupChecked = groupCheckState(names, selected);
                const groupSelectedCount = names.filter((n) =>
                    selected.has(n),
                ).length;

                return (
                    <Collapsible
                        key={group.key}
                        defaultOpen={defaultOpen}
                        className={cn(
                            'group/collapse',
                            index > 0 && 'border-t border-violet-100/80',
                        )}
                    >
                        <div
                            className={cn(
                                'flex items-center gap-1 px-1.5 py-1',
                                muted
                                    ? 'hover:bg-white/50'
                                    : 'hover:bg-white/60',
                            )}
                        >
                            <Checkbox
                                id={`perm-group-${roleId}-${group.key}`}
                                checked={groupChecked}
                                onCheckedChange={(value) =>
                                    onToggleGroup(
                                        names,
                                        value === true ||
                                            value === 'indeterminate',
                                    )
                                }
                                disabled={disabled}
                                className="size-3.5 border-violet-300 data-[state=checked]:border-[#7c3aed] data-[state=checked]:bg-[#7c3aed] data-[state=indeterminate]:border-[#7c3aed] data-[state=indeterminate]:bg-[#7c3aed]"
                            />
                            <CollapsibleTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className={cn(
                                        'h-7 min-w-0 flex-1 cursor-pointer justify-start gap-1 px-1 py-0 text-xs font-semibold hover:bg-transparent',
                                        muted
                                            ? 'text-[#6b5f7a]'
                                            : 'text-[#4c1d95]',
                                    )}
                                >
                                    <ChevronRight className="size-3.5 shrink-0 text-violet-500 transition-transform duration-200 group-data-[state=open]/collapse:rotate-90" />
                                    <span className="truncate">
                                        {group.label}
                                    </span>
                                    <span className="ml-auto shrink-0 text-[10px] font-normal tabular-nums text-[#9d8fb0]">
                                        {groupSelectedCount}/{names.length}
                                    </span>
                                </Button>
                            </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent>
                            <ul
                                role="group"
                                aria-labelledby={`perm-group-${roleId}-${group.key}`}
                                className="space-y-0 border-l border-violet-200/70 pb-1 pl-4 ml-3 mr-1.5"
                            >
                                {group.permissions.map((permission) => (
                                    <li
                                        key={permission.name}
                                        className="flex items-center gap-1.5 rounded-sm py-0.5 pr-1 hover:bg-white/70"
                                    >
                                        <Checkbox
                                            id={`perm-${roleId}-${permission.name}`}
                                            checked={selected.has(
                                                permission.name,
                                            )}
                                            onCheckedChange={(value) =>
                                                onTogglePermission(
                                                    permission.name,
                                                    value === true,
                                                )
                                            }
                                            disabled={disabled}
                                            className="size-3.5 border-violet-300 data-[state=checked]:border-[#7c3aed] data-[state=checked]:bg-[#7c3aed]"
                                        />
                                        <Label
                                            htmlFor={`perm-${roleId}-${permission.name}`}
                                            className={cn(
                                                'cursor-pointer truncate text-[11px] leading-tight font-normal',
                                                muted
                                                    ? 'text-[#7a6d8a]'
                                                    : 'text-[#5c4d6b]',
                                            )}
                                        >
                                            {permission.label}
                                        </Label>
                                    </li>
                                ))}
                            </ul>
                        </CollapsibleContent>
                    </Collapsible>
                );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function RolePermissionsTree({
    catalog,
    roleId,
    selected,
    disabled = false,
    onTogglePermission,
    onToggleGroup,
}: Props) {
    const { activeGroups, plannedGroups } = useMemo(() => {
        const active: PermissionGroup[] = [];
        const planned: PermissionGroup[] = [];

        for (const group of catalog) {
            if (group.implemented) {
                active.push(group);
            } else {
                planned.push(group);
            }
        }

        return { activeGroups: active, plannedGroups: planned };
    }, [catalog]);

    const totalCount = useMemo(
        () => catalog.reduce((sum, g) => sum + g.permissions.length, 0),
        [catalog],
    );

    const activeCount = useMemo(
        () =>
            activeGroups.reduce((sum, g) => sum + g.permissions.length, 0),
        [activeGroups],
    );

    const selectedCount = selected.size;

    return (
        <div className="space-y-3">
            <p className="text-[11px] font-medium text-[#7c6f8a]">
                <span className="tabular-nums text-[#4c1d95]">
                    {selectedCount}
                </span>{' '}
                de{' '}
                <span className="tabular-nums">{totalCount}</span> permisos
            </p>

            <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                    Módulos activos ({activeCount})
                </p>
                <PermissionGroupList
                    groups={activeGroups}
                    roleId={roleId}
                    selected={selected}
                    disabled={disabled}
                    defaultOpen
                    onTogglePermission={onTogglePermission}
                    onToggleGroup={onToggleGroup}
                />
            </div>

            {plannedGroups.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9d8fb0]">
                        Próximamente
                    </p>
                    <PermissionGroupList
                        groups={plannedGroups}
                        roleId={roleId}
                        selected={selected}
                        disabled={disabled}
                        defaultOpen={false}
                        muted
                        onTogglePermission={onTogglePermission}
                        onToggleGroup={onToggleGroup}
                    />
                </div>
            )}
        </div>
    );
}
