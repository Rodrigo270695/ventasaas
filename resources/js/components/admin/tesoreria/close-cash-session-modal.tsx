import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { close } from '@/routes/admin/tesoreria/sesiones';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import { FormSection, FormTextField } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { CashRegisterSessionRow } from '@/types/admin/treasury';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: CashRegisterSessionRow | null;
    errors?: Record<string, string>;
};

export function CloseCashSessionModal({
    open,
    onOpenChange,
    session,
    errors = {},
}: Props) {
    const [counted, setCounted] = useState('');
    const [closingNotes, setClosingNotes] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && session) {
            setCounted(session.expected_cash_label ?? '0');
            setClosingNotes('');
            setFieldErrors(errors);
        }
    }, [open, session?.id, session?.expected_cash_label, errors]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setCounted('');
            setClosingNotes('');
            setFieldErrors({});
        }

        onOpenChange(next);
    };

    if (!session) {
        return null;
    }

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `close-${session.id}` : 'closed'}
                action={close.url(session.id)}
                method="put"
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title="Cerrar sesión de caja"
                            description={`${session.cash_register_name} · Abierta ${session.opened_at_label}`}
                        />
                        <AppModalBody className="space-y-4">
                            {session.summary ? (
                                <dl className="grid grid-cols-2 gap-2 rounded-lg bg-violet-50/50 p-3 text-xs text-[#4c1d95] ring-1 ring-violet-100">
                                    <dt>Fondo inicial</dt>
                                    <dd className="text-right font-mono">
                                        PEN {session.opening_float_label}
                                    </dd>
                                    <dt>Cobros en efectivo</dt>
                                    <dd className="text-right font-mono">
                                        PEN{' '}
                                        {session.summary.cash_collected_label}
                                    </dd>
                                    <dt>Otros métodos</dt>
                                    <dd className="text-right font-mono">
                                        PEN{' '}
                                        {
                                            session.summary
                                                .non_cash_collected_label
                                        }
                                    </dd>
                                    <dt className="font-semibold">
                                        Efectivo esperado
                                    </dt>
                                    <dd className="text-right font-mono font-semibold">
                                        PEN {session.expected_cash_label}
                                    </dd>
                                    <dt>Cobros registrados</dt>
                                    <dd className="text-right">
                                        {session.summary.payments_count}
                                    </dd>
                                </dl>
                            ) : null}
                            <FormSection
                                title="Arqueo"
                                gridClassName="grid w-full min-w-0 grid-cols-1 gap-3"
                            >
                                <FormTextField
                                    id="close-session-counted"
                                    name="closing_cash_counted"
                                    label="Efectivo contado en caja"
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={counted}
                                    onChange={setCounted}
                                    disabled={processing}
                                    error={message(
                                        'closing_cash_counted',
                                        formErrors,
                                    )}
                                />
                                <FormTextField
                                    id="close-session-notes"
                                    name="closing_notes"
                                    label="Notas de cierre (opcional)"
                                    value={closingNotes}
                                    onChange={setClosingNotes}
                                    disabled={processing}
                                />
                            </FormSection>
                        </AppModalBody>
                        <AppModalFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer rounded-xl border-violet-200"
                                onClick={() => handleOpenChange(false)}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && <Spinner />}
                                Cerrar sesión
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
