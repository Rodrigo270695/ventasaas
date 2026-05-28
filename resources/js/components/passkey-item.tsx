import { KeyRound, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    settingsDangerButtonClass,
    settingsOutlineButtonClass,
} from '@/components/settings/settings-button-styles';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { Passkey } from '@/types/auth';

type Props = {
    passkey: Passkey;
    onDelete: (id: number, onError: () => void) => void;
};

export default function PasskeyItem({ passkey, onDelete }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        onDelete(passkey.id, () => setIsDeleting(false));
    };

    return (
        <div className="flex items-center justify-between gap-4 border-b border-violet-100 p-4 last:border-b-0">
            <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#fce7f3] to-[#f3e8ff] text-[#7c3aed]">
                    <KeyRound className="size-5" />
                </div>
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#4c1d95]">
                            {passkey.name}
                        </p>
                        {passkey.authenticator ? (
                            <span className="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#7c3aed] uppercase ring-1 ring-violet-100">
                                {passkey.authenticator}
                            </span>
                        ) : null}
                    </div>
                    <p className="text-sm text-[#7c6f8a]">
                        Agregada {passkey.created_at_diff}
                        {passkey.last_used_at_diff ? (
                            <>
                                <span className="mx-1 text-[#c4b5fd]">·</span>
                                Último uso {passkey.last_used_at_diff}
                            </>
                        ) : null}
                    </p>
                </div>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                    >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Eliminar</span>
                    </button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl border-violet-100">
                    <DialogTitle className="text-[#4c1d95]">
                        Eliminar llave de acceso
                    </DialogTitle>
                    <DialogDescription className="text-[#7c6f8a]">
                        ¿Seguro que quieres eliminar &quot;{passkey.name}&quot;?
                        Ya no podrás usarla para iniciar sesión.
                    </DialogDescription>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <button
                                type="button"
                                className={settingsOutlineButtonClass}
                            >
                                Cancelar
                            </button>
                        </DialogClose>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={settingsDangerButtonClass}
                        >
                            {isDeleting && <Spinner />}
                            {isDeleting ? 'Eliminando…' : 'Eliminar'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
