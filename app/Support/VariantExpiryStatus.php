<?php

namespace App\Support;

use Carbon\CarbonInterface;

final class VariantExpiryStatus
{
    public static function defaultAlertDays(): int
    {
        return max(0, (int) config('inventory.expiry_alert_days_default', 14));
    }

    public static function resolveAlertDays(?int $variantDays): int
    {
        if ($variantDays !== null) {
            return max(0, $variantDays);
        }

        return self::defaultAlertDays();
    }

    /**
     * @return array{
     *     is_expired: bool,
     *     is_expiring_soon: bool,
     *     days_until_expiry: int|null,
     *     level: 'critical'|'warning'|null
     * }
     */
    public static function evaluate(
        ?CarbonInterface $expiresAt,
        ?int $alertDays = null,
        ?CarbonInterface $today = null,
    ): array {
        if (! $expiresAt) {
            return [
                'is_expired' => false,
                'is_expiring_soon' => false,
                'days_until_expiry' => null,
                'level' => null,
            ];
        }

        $today = ($today ?? now())->startOfDay();
        $expiry = $expiresAt->copy()->startOfDay();
        $daysUntil = (int) $today->diffInDays($expiry, false);
        $isExpired = $daysUntil < 0;
        $alertWindow = self::resolveAlertDays($alertDays);
        $isExpiringSoon = ! $isExpired && $alertWindow > 0 && $daysUntil <= $alertWindow;

        $level = $isExpired
            ? 'critical'
            : ($isExpiringSoon ? 'warning' : null);

        return [
            'is_expired' => $isExpired,
            'is_expiring_soon' => $isExpiringSoon,
            'days_until_expiry' => $daysUntil,
            'level' => $level,
        ];
    }

    public static function formatExpiresAt(?CarbonInterface $expiresAt): ?string
    {
        return $expiresAt?->toDateString();
    }

    /**
     * @return array<string, mixed>
     */
    public static function toPayload(?CarbonInterface $expiresAt, ?int $alertDays): array
    {
        $status = self::evaluate($expiresAt, $alertDays);

        return [
            'expires_at' => self::formatExpiresAt($expiresAt),
            'expiry_alert_days' => $alertDays,
            'is_expired' => $status['is_expired'],
            'is_expiring_soon' => $status['is_expiring_soon'],
            'days_until_expiry' => $status['days_until_expiry'],
            'expiry_level' => $status['level'],
        ];
    }
}
