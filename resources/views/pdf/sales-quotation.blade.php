<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Cotización {{ $quotation->internal_number }}</title>
    <style>
        @page { margin: 22px 28px 30px; }
        * { box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 10px;
            color: #1f2937;
            line-height: 1.35;
        }
        .muted { color: #6b7280; font-size: 9px; }
        .label {
            color: #6b7280;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 2px;
        }
        .value { font-size: 10px; font-weight: 700; color: #111827; }
        .section-title {
            color: #1e3a5f;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            margin: 16px 0 8px;
            padding-bottom: 4px;
            border-bottom: 2px solid #1e3a5f;
        }
        .doc-box {
            border: 1.5px solid #1e3a5f;
            border-radius: 4px;
            padding: 10px 14px;
            text-align: center;
            min-width: 150px;
        }
        .doc-box .doc-type {
            color: #2563eb;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
        }
        .doc-box .doc-number {
            font-size: 14px;
            font-weight: 700;
            margin-top: 4px;
            color: #111827;
        }
        .info-panel {
            background: #f3f4f6;
            border-radius: 4px;
            padding: 10px 12px;
            margin-top: 12px;
        }
        table { width: 100%; border-collapse: collapse; }
        .items-table th {
            background: #1e3a5f;
            color: #ffffff;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 7px 6px;
            text-align: left;
        }
        .items-table th.num { text-align: right; }
        .items-table td {
            border-bottom: 1px solid #e5e7eb;
            padding: 8px 6px;
            vertical-align: top;
            font-size: 9px;
        }
        .items-table td.num {
            text-align: right;
            white-space: nowrap;
        }
        .items-table td.desc { width: 42%; }
        .items-table tr:last-child td { border-bottom: none; }
        .totals-wrap { margin-top: 8px; }
        .totals-table td {
            padding: 3px 0;
            font-size: 10px;
        }
        .totals-table .total-row td {
            padding-top: 6px;
            font-size: 12px;
            font-weight: 700;
            border-top: 1px solid #9ca3af;
        }
        .conditions-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 10px 12px;
            font-size: 9px;
        }
        .signature {
            margin-top: 36px;
            text-align: center;
        }
        .signature .line {
            width: 220px;
            margin: 0 auto 6px;
            border-top: 1px solid #9ca3af;
        }
        .signature .name { font-weight: 700; font-size: 11px; }
        .signature .role { font-size: 9px; color: #6b7280; }
    </style>
</head>
<body>
    <table>
        <tr>
            <td style="width: 68%; vertical-align: top;">
                @if($company['logo_data_uri'])
                    <img src="{{ $company['logo_data_uri'] }}" alt="Logo" style="height: 42px; margin-bottom: 8px;">
                @endif
                <div style="font-size: 9px; line-height: 1.5;">
                    <div><span class="muted">Razón social:</span> <strong>{{ $company['legal_name'] }}</strong></div>
                    @if($company['ruc'])
                        <div><span class="muted">RUC:</span> {{ $company['ruc'] }}</div>
                    @endif
                    @if($company['address'])
                        <div><span class="muted">Dirección:</span> {{ $company['address'] }}</div>
                    @endif
                    @if($company['contact_line'])
                        <div>{{ $company['contact_line'] }}</div>
                    @endif
                </div>
            </td>
            <td style="width: 32%; vertical-align: top; text-align: right;">
                <div class="doc-box" style="display: inline-block;">
                    <div class="doc-type">COTIZACIÓN</div>
                    <div class="doc-number">{{ $quotation->internal_number }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="info-panel">
        <table>
            <tr>
                <td style="width: 55%; vertical-align: top;">
                    <div class="label">Cliente / Razón social</div>
                    <div class="value">{{ $customer['name'] }}</div>
                    <div style="margin-top: 8px;">
                        <div class="label">{{ str_contains($customer['document'], 'RUC') ? 'RUC' : 'Documento' }}</div>
                        <div class="value">{{ $customer['document'] }}</div>
                    </div>
                </td>
                <td style="width: 45%; vertical-align: top;">
                    <table style="width: 100%;">
                        <tr>
                            <td class="label" style="width: 45%;">Fecha de emisión</td>
                            <td class="value" style="text-align: right;">{{ $meta['issue_date_label'] }}</td>
                        </tr>
                        <tr>
                            <td class="label">Vencimiento</td>
                            <td class="value" style="text-align: right;">{{ $meta['valid_until_label'] }}</td>
                        </tr>
                        <tr>
                            <td class="label">Vendedor</td>
                            <td class="value" style="text-align: right;">{{ $meta['seller_name'] }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <div class="section-title">DETALLE DE PRODUCTOS</div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 12%;">Código</th>
                <th class="desc">Descripción</th>
                <th class="num" style="width: 8%;">Cant.</th>
                <th class="num" style="width: 7%;">U.M.</th>
                <th class="num" style="width: 11%;">P.Unit.</th>
                <th class="num" style="width: 12%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($lines as $line)
                <tr>
                    <td>{{ $line['index'] }}</td>
                    <td>{{ $line['code'] }}</td>
                    <td class="desc">{{ $line['description'] }}</td>
                    <td class="num">{{ $line['quantity'] }}</td>
                    <td class="num">{{ $line['unit'] }}</td>
                    <td class="num">{{ $totals['currency'] }} {{ $line['unit_price'] }}</td>
                    <td class="num"><strong>{{ $totals['currency'] }} {{ $line['line_total'] }}</strong></td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-wrap">
        <tr>
            <td style="width: 58%;"></td>
            <td style="width: 42%;">
                <table class="totals-table">
                    <tr>
                        <td>Sub Total Ventas</td>
                        <td style="text-align: right;">{{ $totals['currency'] }} {{ $totals['subtotal'] }}</td>
                    </tr>
                    <tr>
                        <td>IGV / impuestos</td>
                        <td style="text-align: right;">{{ $totals['currency'] }} {{ $totals['tax'] }}</td>
                    </tr>
                    <tr class="total-row">
                        <td>TOTAL</td>
                        <td style="text-align: right;">{{ $totals['currency'] }} {{ $totals['total'] }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="section-title">CONDICIONES</div>
    <div class="conditions-box">
        <div><strong>Validez:</strong> {{ $conditions['validity'] }}</div>
        <div style="margin-top: 4px;"><strong>Forma de pago:</strong> {{ $conditions['payment'] }}</div>
        @if($conditions['notes'])
            <div style="margin-top: 6px;"><strong>Observaciones:</strong> {{ $conditions['notes'] }}</div>
        @endif
    </div>

    @if(filled($signature['name']))
        <div class="signature">
            <div class="line"></div>
            <div class="name">{{ $signature['name'] }}</div>
            <div class="role">{{ $signature['title'] }}</div>
            <div class="role">{{ $signature['company'] }}</div>
        </div>
    @endif
</body>
</html>
