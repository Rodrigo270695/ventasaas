import { useCallback } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export function useCloseMobileSidebar(): () => void {
    const { setOpenMobile } = useSidebar();
    const isMobile = useIsMobile();

    return useCallback(() => {
        if (isMobile) {
            setOpenMobile(false);
        }
    }, [isMobile, setOpenMobile]);
}
