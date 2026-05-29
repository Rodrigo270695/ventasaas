import ChokoAuthLayout from '@/layouts/auth/choko-auth-layout';
import { NoIndexHead } from '@/components/seo/no-index-head';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <ChokoAuthLayout title={title} description={description}>
            <NoIndexHead />
            {children}
        </ChokoAuthLayout>
    );
}
