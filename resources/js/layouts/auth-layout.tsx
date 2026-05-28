import ChokoAuthLayout from '@/layouts/auth/choko-auth-layout';
import ChokoLoginLayout from '@/layouts/auth/choko-login-layout';

type Props = {
    children: React.ReactNode;
    title?: string;
    description?: string;
    variant?: 'default' | 'login';
};

export default function AuthLayout({
    title = '',
    description = '',
    variant = 'default',
    children,
}: Props) {
    if (variant === 'login') {
        return (
            <ChokoLoginLayout title={title} description={description}>
                {children}
            </ChokoLoginLayout>
        );
    }

    return (
        <ChokoAuthLayout title={title} description={description}>
            {children}
        </ChokoAuthLayout>
    );
}
