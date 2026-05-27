<?php

namespace App\Services\ElectronicBilling;

readonly class ElectronicBillingResult
{
    public function __construct(
        public string $status,
        public ?string $sunatResponseCode = null,
        public ?string $sunatDescription = null,
        public ?string $xmlHash = null,
        public ?string $xmlPath = null,
        public ?string $cdrPath = null,
        public ?string $sunatTicket = null,
    ) {}
}
