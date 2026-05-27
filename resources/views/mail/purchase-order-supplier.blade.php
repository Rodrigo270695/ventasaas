<x-mail::message>
# Orden de compra {{ $orderNumber }}

Hola **{{ $supplierName }}**,

{{ $companyName }} te envía la siguiente orden de compra para tu confirmación.

**Fecha de orden:** {{ $orderDateLabel }}
@if($expectedDateLabel)
**Entrega esperada:** {{ $expectedDateLabel }}
@endif
**Moneda:** {{ $currencyCode }}
**Total:** {{ $totalLabel }}

<x-mail::table>
| Producto | Cantidad | Costo unit. | Subtotal |
|:---------|--------:|------------:|---------:|
@foreach($lines as $line)
| {{ $line['product'] }} | {{ $line['quantity'] }} | {{ $line['unit_cost'] }} | {{ $line['line_total'] }} |
@endforeach
</x-mail::table>

@if($notes)
**Notas:** {{ $notes }}
@endif

<x-mail::button :url="$confirmUrl">
Confirmar orden de compra
</x-mail::button>

Al confirmar, indicas que recibiste y aceptas esta orden. El enlace vence en 30 días.

Si no reconoces esta solicitud, ignora este correo.

Gracias,<br>
{{ $companyName }}
</x-mail::message>
