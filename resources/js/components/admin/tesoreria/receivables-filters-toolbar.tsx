import { ListTableFiltersToolbar } from '@/components/admin/list-table-filters-toolbar';
import { DateRangeFiltersToolbar } from '@/components/admin/date-range-filters-toolbar';
import {
    chokoSelectContentClass,
    chokoSelectItemClass,
    chokoSelectTriggerClass,
} from '@/components/form/field-styles';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ReceivableAgingFilter } from '@/types/admin/treasury';

type Props = {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onRangeCommit: () => void;
    aging: ReceivableAgingFilter | '';
    onAgingChange: (value: ReceivableAgingFilter | '') => void;
    paymentStatus: string;
    onPaymentStatusChange: (value: string) => void;
};

const AGING_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'overdue', label: 'Vencidos' },
    { value: 'current', label: 'Al día' },
] as const;

const PAYMENT_OPTIONS = [
    { value: '', label: 'Cualquier saldo' },
    { value: 'unpaid', label: 'Sin cobrar' },
    { value: 'partial', label: 'Cobro parcial' },
] as const;

const selectTriggerClass = cn(
    chokoSelectTriggerClass,
    '!w-[9.25rem] shrink-0',
);

const paymentSelectClass = cn(
    chokoSelectTriggerClass,
    '!w-[10.75rem] shrink-0',
);

export function ReceivablesFiltersToolbar({
    from,
    to,
    onFromChange,
    onToChange,
    onRangeCommit,
    aging,
    onAgingChange,
    paymentStatus,
    onPaymentStatusChange,
}: Props) {
    return (
        <div className="flex w-full justify-end sm:w-auto">
            <ListTableFiltersToolbar className="flex-wrap gap-2 sm:flex-wrap">
                <div className="flex items-center gap-2">
                    <Label
                        htmlFor="receivables-aging"
                        className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6b5b7a]"
                    >
                        Vencimiento
                    </Label>
                    <Select
                        value={aging || '__all__'}
                        onValueChange={(v) =>
                            onAgingChange(
                                v === '__all__'
                                    ? ''
                                    : (v as ReceivableAgingFilter),
                            )
                        }
                    >
                        <SelectTrigger
                            id="receivables-aging"
                            className={selectTriggerClass}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={chokoSelectContentClass}>
                            {AGING_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value || '__all__'}
                                    value={opt.value || '__all__'}
                                    className={chokoSelectItemClass}
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Label
                        htmlFor="receivables-payment"
                        className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6b5b7a]"
                    >
                        Cobro
                    </Label>
                    <Select
                        value={paymentStatus || '__all__'}
                        onValueChange={(v) =>
                            onPaymentStatusChange(
                                v === '__all__' ? '' : v,
                            )
                        }
                    >
                        <SelectTrigger
                            id="receivables-payment"
                            className={paymentSelectClass}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={chokoSelectContentClass}>
                            {PAYMENT_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value || '__all__'}
                                    value={opt.value || '__all__'}
                                    className={chokoSelectItemClass}
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DateRangeFiltersToolbar
                    idPrefix="receivables"
                    from={from}
                    to={to}
                    onFromChange={onFromChange}
                    onToChange={onToChange}
                    onRangeCommit={onRangeCommit}
                />
            </ListTableFiltersToolbar>
        </div>
    );
}
