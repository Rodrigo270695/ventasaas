import { Head } from '@inertiajs/react';

export function NoIndexHead() {
    return (
        <Head>
            <meta
                head-key="robots"
                name="robots"
                content="noindex, nofollow"
            />
        </Head>
    );
}
