import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store } from '@/routes/admin/tesoreria/sesiones';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import {
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { CashSessionsOldForm } from '@/types/admin/treasury';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cashRegisterOptions: Array<{
        value: string;
        label: string;
        sublabel?: string;
    }>;
    errors?: Record<string, string>;
    oldForm?: CashSessionsOldForm;
};

const defaultOldForm: CashSessionsOldForm = {
    cash_register_id: '',
    opening_float: '0',
    opening_notes: '',
};

export function OpenCashSessionModal({
    open,
    onOpenChange,
    cashRegisterOptions,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const [cashRegisterId, setCashRegisterId] = useState('');
    const [openingFloat, setOpeningFloat] = useState('0');
    const [openingNotes, setOpeningNotes] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const registerId =
                oldForm.cash_register_id ||
                cashRegisterOptions[0]?.value ||
                '';
            setCashRegisterId(registerId);
            setOpeningFloat(oldForm.opening_float || '0');
            setOpeningNotes(oldForm.opening_notes || '');
            setFieldErrors(errors);
        }
    }, [open, cashRegisterOptions, oldForm, errors]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setCashRegisterId('');
            setOpeningFloat('0');
            setOpeningNotes('');
            setFieldErrors({});
        }

        onOpenChange(next);
    };

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    const canSubmit =
        cashRegisterId.length > 0 && cashRegisterOptions.length > 0;

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? 'open-session' : 'closed'}
                action={store.url()}
                method="post"
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title="Abrir sesión de caja"
                            description="Registra el fondo inicial en efectivo para vincular cobros."
                        />
                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Sesión"
                                gridClassName="grid w-full min-w-0 grid-cols-1 gap-3"
                            >
                                <FormSelectField
                                    id="open-session-register"
                                    name="cash_register_id"
                                    label="Caja"
                                    required
                                    value={cashRegisterId}
                                    onValueChange={setCashRegisterId}
                                    options={cashRegisterOptions}
                                    disabled={
                                        processing ||
                                        cashRegisterOptions.length === 0
                                    }
                                    error={message(
                                        'cash_register_id',
                                        formErrors,
                                    )}
                                />
                                <FormTextField
                                    id="open-session-float"
                                    name="opening_float"
                                    label="Fondo inicial (efectivo)"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={openingFloat}
                                    onChange={setOpeningFloat}
                                    disabled={processing}
                                    error={message('opening_float', formErrors)}
                                />
                                <FormTextField
                                    id="open-session-notes"
                                    name="opening_notes"
                                    label="Notas (opcional)"
                                    value={openingNotes}
                                    onChange={setOpeningNotes}
                                    disabled={processing}
                                />
                            </FormSection>
                            {cashRegisterOptions.length === 0 ? (
                                <p className="text-xs text-amber-700">
                                    No hay cajas disponibles (todas tienen sesión
                                    abierta o están inactivas).
                                </p>
                            ) : null}
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
                                disabled={processing || !canSubmit}
                                className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && <Spinner />}
                                Abrir sesión
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
