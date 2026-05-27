import type { ImgHTMLAttributes } from 'react';
import { brandLogoSrc } from '@/lib/brand';

export default function AppLogoIcon({
    className,
    alt = 'Choko House',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={brandLogoSrc()}
            alt={alt}
            className={className}
            {...props}
        />
    );
}
