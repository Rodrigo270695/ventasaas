import { DateRangeFiltersToolbar } from '@/components/admin/date-range-filters-toolbar';

type Props = {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onRangeCommit: () => void;
};

export function CollectionsFiltersToolbar(props: Props) {
    return (
        <div className="flex w-full justify-end sm:w-auto">
            <DateRangeFiltersToolbar idPrefix="collections" {...props} />
        </div>
    );
}
