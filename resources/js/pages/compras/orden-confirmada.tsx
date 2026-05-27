import { Head } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';

type Props = {
    success: boolean;
    error: string | null;
    order: {
        internal_number: string;
        supplier_name: string | null;
        confirmed_at_label: string | null;
    } | null;
    companyName: string;
};

export default function PurchaseOrderConfirmedPage({
    success,
    error,
    order,
    companyName,
}: Props) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-violet-50 via-white to-pink-50 p-6">
            <Head
                title={
                    success
                        ? 'Orden confirmada'
                        : 'Confirmación no disponible'
                }
            />
            <div className="w-full max-w-md rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-lg shadow-violet-200/40">
                {success && order ? (
                    <>
                        <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
                        <h1 className="mt-4 text-xl font-bold text-[#4c1d95]">
                            Orden confirmada
                        </h1>
                        <p className="mt-2 text-sm text-[#6b5b7a]">
                            {companyName} registró tu confirmación de la orden{' '}
                            <span className="font-mono font-semibold text-[#7c3aed]">
                                {order.internal_number}
                            </span>
                            .
                        </p>
                        {order.confirmed_at_label ? (
                            <p className="mt-3 text-xs text-emerald-800">
                                {order.confirmed_at_label} (hora Perú)
                            </p>
                        ) : null}
                    </>
                ) : (
                    <>
                        <XCircle className="mx-auto size-14 text-red-500" />
                        <h1 className="mt-4 text-xl font-bold text-[#4c1d95]">
                            No se pudo confirmar
                        </h1>
                        <p className="mt-2 text-sm text-[#6b5b7a]">
                            {error ??
                                'El enlace no es válido. Contacta a quien te envió la orden.'}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
