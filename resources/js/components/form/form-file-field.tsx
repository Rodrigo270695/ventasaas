import { FileUp, X } from 'lucide-react';
import { useRef } from 'react';
import { FormField } from '@/components/form/form-field';
import { Button } from '@/components/ui/button';
import { chokoInputClass } from '@/components/form/field-styles';
import { cn } from '@/lib/utils';

type Props = {
    id: string;
    name: string;
    label: string;
    accept?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    fieldClassName?: string;
    existingFileName?: string | null;
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
    removeExisting: boolean;
    onRemoveExistingChange: (remove: boolean) => void;
};

export function FormFileField({
    id,
    name,
    label,
    accept = '.p12,.pfx,.pem,.crt,.key',
    hint,
    error,
    disabled,
    fieldClassName,
    existingFileName,
    selectedFile,
    onFileChange,
    removeExisting,
    onRemoveExistingChange,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const showExisting =
        existingFileName && !selectedFile && !removeExisting;

    const handlePick = () => {
        inputRef.current?.click();
    };

    const handleChange = (file: File | null) => {
        onFileChange(file);
        if (file) {
            onRemoveExistingChange(false);
        }
    };

    return (
        <FormField
            id={id}
            label={label}
            hint={hint}
            error={error}
            className={fieldClassName}
        >
            <input
                ref={inputRef}
                id={id}
                name={name}
                type="file"
                accept={accept}
                className="sr-only"
                disabled={disabled}
                onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleChange(file);
                }}
            />

            {removeExisting && (
                <input type="hidden" name="remove_certificate" value="1" />
            )}

            <div
                className={cn(
                    'flex flex-col gap-2 rounded-xl border border-dashed border-violet-200/90',
                    'bg-violet-50/30 p-3',
                    error && 'border-red-300',
                )}
            >
                {showExisting && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-violet-100 bg-white/90 px-3 py-2">
                        <span className="min-w-0 truncate text-sm font-medium text-[#4c1d95]">
                            {existingFileName}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 cursor-pointer px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => onRemoveExistingChange(true)}
                            disabled={disabled}
                        >
                            <X className="size-3.5" />
                            Quitar
                        </Button>
                    </div>
                )}

                {selectedFile && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2">
                        <span className="min-w-0 truncate text-sm text-emerald-800">
                            {selectedFile.name}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 cursor-pointer px-2 text-xs text-[#6d28d9] hover:bg-violet-50"
                            onClick={() => {
                                handleChange(null);
                                if (inputRef.current) {
                                    inputRef.current.value = '';
                                }
                            }}
                            disabled={disabled}
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>
                )}

                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePick}
                    disabled={disabled}
                    className={cn(
                        chokoInputClass,
                        'h-10 cursor-pointer justify-center gap-2 border-dashed',
                        'font-medium text-[#6d28d9] hover:bg-violet-50',
                    )}
                >
                    <FileUp className="size-4 shrink-0" />
                    {selectedFile || showExisting
                        ? 'Cambiar archivo'
                        : 'Seleccionar certificado (.p12)'}
                </Button>
            </div>
        </FormField>
    );
}
