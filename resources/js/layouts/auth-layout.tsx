import ChokoAuthLayout from '@/layouts/auth/choko-auth-layout';

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
            {children}
        </ChokoAuthLayout>
    );
}
