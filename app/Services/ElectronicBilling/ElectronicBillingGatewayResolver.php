<?php

namespace App\Services\ElectronicBilling;

use App\Contracts\ElectronicBilling\ElectronicBillingGateway;
use App\Models\CfgStoreSetting;
use App\Models\ElectronicDocument;
use App\Services\ElectronicBilling\Gateways\SunatSoapGateway;
use InvalidArgumentException;

class ElectronicBillingGatewayResolver
{
    public function resolveForStore(?CfgStoreSetting $settings = null): ElectronicBillingGateway
    {
        $settings ??= CfgStoreSetting::query()->orderBy('id')->first();
        $channel = $settings?->billing_channel ?? 'direct_sunat';

        $gatewayKey = config("electronic_billing.gateways.{$channel}");

        return $this->resolveByKey($gatewayKey ?? ElectronicDocument::GATEWAY_SUNAT_SOAP);
    }

    public function resolveByKey(string $gatewayKey): ElectronicBillingGateway
    {
        return match ($gatewayKey) {
            ElectronicDocument::GATEWAY_SUNAT_SOAP => app(SunatSoapGateway::class),
            ElectronicDocument::GATEWAY_APISUNAT,
            ElectronicDocument::GATEWAY_OSE => app(SunatSoapGateway::class),
            default => throw new InvalidArgumentException("Gateway de facturación no soportado: {$gatewayKey}"),
        };
    }
}
