<?php

namespace App\Contracts\ElectronicBilling;

use App\Models\ElectronicDocument;
use App\Services\ElectronicBilling\ElectronicBillingResult;

interface ElectronicBillingGateway
{
    public function gatewayKey(): string;

    public function emit(ElectronicDocument $electronicDocument): ElectronicBillingResult;
}
