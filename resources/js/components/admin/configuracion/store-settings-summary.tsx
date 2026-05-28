import {
    labelForBillingChannel,
    labelForSunatEnvironment,
    labelForTaxRegime,
} from '@/lib/store-settings-options';
import type { StoreSettingsRow } from '@/types/admin/store-settings';

type Props = {
    settings: StoreSettingsRow;
};

function Field({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-violet-100/90 bg-white/80 px-3 py-2.5 shadow-sm">
            <p className="text-[10px] font-semibold tracking-wide text-[#9d8fb0] uppercase">
                {label}
            </p>
            <p className="mt-0.5 text-sm font-medium text-[#3b2d4a]">{value}</p>
        </div>
    );
}

export function StoreSettingsSummary({ settings }: Props) {
    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="RUC" value={settings.ruc} />
            <Field label="Razón social" value={settings.razon_social} />
            <Field label="Ubigeo" value={settings.ubigeo} />
            <Field label="Dirección" value={settings.direccion || '—'} />
            <Field
                label="WhatsApp de pedidos"
                value={settings.whatsapp_number || 'Sin configurar'}
            />
            <Field
                label="Régimen tributario"
                value={labelForTaxRegime(settings.tax_regime)}
            />
            <Field
                label="Canal de facturación"
                value={labelForBillingChannel(settings.billing_channel)}
            />
            <Field
                label="Ambiente SUNAT"
                value={labelForSunatEnvironment(settings.sunat_environment)}
            />
            <Field
                label="IGV por defecto"
                value={`${settings.default_igv_rate.toFixed(2)} %`}
            />
            <Field
                label="Certificado digital"
                value={
                    settings.certificate_name ??
                    (settings.has_certificate
                        ? 'Configurado'
                        : 'Sin configurar')
                }
            />
            <Field
                label="Clave del certificado"
                value={
                    settings.has_certificate_password
                        ? 'Guardada (no se muestra por seguridad)'
                        : settings.has_certificate
                          ? 'Falta registrar la clave'
                          : '—'
                }
            />
            <Field
                label="Usuario Clave SOL"
                value={settings.sol_user || 'Sin configurar'}
            />
            <Field
                label="Contraseña Clave SOL"
                value={
                    settings.has_sol_password
                        ? 'Guardada (no se muestra por seguridad)'
                        : settings.sol_user
                          ? 'Falta registrar la contraseña'
                          : '—'
                }
            />
            <Field
                label="Token API"
                value={settings.has_api_token ? 'Configurado' : 'Sin configurar'}
            />
        </div>
    );
}
