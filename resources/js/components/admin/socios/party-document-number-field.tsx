import { chokoInputClass } from '@/components/form/field-styles';
import { Input } from '@/components/ui/input';
import {
    partyDocumentFixedLength,
    sanitizePartyDocumentNumber,
} from '@/lib/party-document-type-options';
import { cn } from '@/lib/utils';

type Props = {
    id: string;
    name: string;
    documentType: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    'aria-invalid'?: boolean;
};

export function PartyDocumentNumberField({
    id,
    name,
    documentType,
    value,
    onChange,
    placeholder,
    disabled,
    required,
    'aria-invalid': ariaInvalid,
}: Props) {
    const fixedLength = partyDocumentFixedLength(documentType);
    const showCounter = fixedLength !== null;
    const length = value.length;

    const counterClass =
        length === 0
            ? 'text-[#9d8fb0]'
            : length === fixedLength
              ? 'text-blue-600'
              : 'text-red-500';

    return (
        <div className="relative">
            <Input
                id={id}
                name={name}
                required={required}
                value={value}
                onChange={(e) =>
                    onChange(sanitizePartyDocumentNumber(documentType, e.target.value))
                }
                placeholder={placeholder}
                maxLength={fixedLength ?? 15}
                inputMode={showCounter ? 'numeric' : 'text'}
                pattern={showCounter ? '[0-9]*' : undefined}
                autoComplete="off"
                disabled={disabled}
                aria-invalid={ariaInvalid}
                className={cn(chokoInputClass, 'w-full', showCounter && 'pr-14')}
            />
            {showCounter && fixedLength !== null ? (
                <span
                    className={cn(
                        'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold tabular-nums',
                        counterClass,
                    )}
                    aria-hidden
                >
                    {length}/{fixedLength}
                </span>
            ) : null}
        </div>
    );
}
