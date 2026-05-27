<?php

namespace App\Support\Treasury;

use App\Models\User;

class TreasuryAuthorization
{
    public static function canViewCollections(?User $user): bool
    {
        return $user?->can('treasury.collections.view') ?? false;
    }

    public static function canCreateCollections(?User $user): bool
    {
        return $user?->can('treasury.collections.create') ?? false;
    }

    public static function canUpdateCollections(?User $user): bool
    {
        return $user?->can('treasury.collections.update') ?? false;
    }

    public static function canViewDisbursements(?User $user): bool
    {
        if ($user?->can('treasury.disbursements.view')) {
            return true;
        }

        return $user?->can('treasury.collections.view') ?? false;
    }

    public static function canCreateDisbursements(?User $user): bool
    {
        if ($user?->can('treasury.disbursements.create')) {
            return true;
        }

        return $user?->can('treasury.collections.create') ?? false;
    }

    public static function canUpdateDisbursements(?User $user): bool
    {
        if ($user?->can('treasury.disbursements.update')) {
            return true;
        }

        return $user?->can('treasury.collections.create') ?? false;
    }
}
