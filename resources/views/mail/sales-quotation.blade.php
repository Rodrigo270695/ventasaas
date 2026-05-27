<x-mail::message>
# Cotización {{ $quotationNumber }}

Hola **{{ $customerName }}**,

{{ $companyName }} te envía la cotización **{{ $quotationNumber }}** adjunta en PDF con el detalle de productos/servicios.

**Fecha:** {{ $issueDateLabel ?? '—' }}  
**Válida hasta:** {{ $validUntilLabel ?? 'Sin fecha límite' }}  
**Total:** {{ $currencyCode }} {{ $totalLabel }}

@if(!empty($lines))

<x-mail::table>
| Descripción | SKU | Cant. | P. unit. | Importe |
|:------------|:----|------:|---------:|--------:|
@foreach($lines as $line)
| {{ $line['description'] }} | {{ $line['sku'] ?? '—' }} | {{ $line['quantity'] }} | {{ $line['unit_price'] }} | {{ $line['line_total'] }} |
@endforeach
</x-mail::table>
@endif

@if($notes)
**Observaciones:** {{ $notes }}
@endif

Si tienes alguna duda o necesitas ajustar la cotización, puedes responder directamente a este correo.

Gracias,<br>
{{ $companyName }}
</x-mail::message>

