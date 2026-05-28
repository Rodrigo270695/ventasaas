import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    Candy,
    Package,
    ShoppingCart,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    Tooltip,
    XAxis,
    YAxis,
    Line,
    LineChart,
    Area,
    AreaChart,
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChartContainer } from '@/components/charts/chart-container';
import { brandLogoSrc } from '@/lib/brand';
import { dashboard } from '@/routes';

type DashboardProps = {
    kpis: {
        sales_today: number;
        orders_today: number;
        active_products: number;
        active_customers: number;
        sales_period: number;
        sales_prev_period: number;
        sales_variation: number;
        avg_ticket: number;
        documents_period: number;
        quotes_period: number;
        conversion_rate: number;
        collections_today: number;
        collections_period: number;
        collections_prev_period: number;
        collections_variation: number;
        collections_count_period: number;
        receivable_balance: number;
    };
    salesTrend: Array<{ date: string; label: string; amount: number }>;
    collectionsTrend: Array<{ date: string; label: string; amount: number }>;
    categoryShare: Array<{ category: string; amount: number }>;
    topProducts: Array<{ name: string; qty: number }>;
    lowStockAlerts: Array<{
        variant_id: string;
        sku: string | null;
        product: string;
        stock: number;
        minimum: number;
        level: 'critical' | 'warning';
    }>;
    monthlyPerformance: Array<{
        month: string;
        amount: number;
    }>;
    salesByDocumentType: Array<{
        type: string;
        amount: number;
    }>;
    filters: {
        period: 7 | 30 | 90;
        warehouse_id: string | null;
    };
    warehouseOptions: Array<{
        value: string;
        label: string;
    }>;
};

const brand = {
    pink: '#ff0f6f',
    cyan: '#26b9de',
    purple: '#7a1fa2',
    yellow: '#f5cc33',
    lime: '#a8e65e',
    orange: '#f7941d',
};

const palette = [brand.pink, brand.cyan, brand.yellow, brand.purple, brand.lime, brand.orange];

function money(value: number): string {
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Dashboard({
    kpis,
    salesTrend,
    collectionsTrend,
    categoryShare,
    topProducts,
    lowStockAlerts,
    monthlyPerformance,
    salesByDocumentType,
    filters,
    warehouseOptions,
}: DashboardProps) {
    const quickLinks = [
        { label: 'Ventas / Comprobantes', href: '/admin/ventas/comprobantes' },
        { label: 'Ventas / Venta rápida', href: '/admin/ventas/tickets-internos' },
        { label: 'Tesorería / Cobros', href: '/admin/tesoreria/cobros' },
        { label: 'Ventas / Cotizaciones', href: '/admin/ventas/cotizaciones' },
        { label: 'Compras / Facturas', href: '/admin/compras/facturas' },
        { label: 'Inventario / Saldos', href: '/admin/inventario/saldos' },
        { label: 'Tesorería / Cuentas por cobrar', href: '/admin/tesoreria/cuentas-por-cobrar' },
        { label: 'SUNAT / CPE', href: '/admin/documentos/comprobantes-electronicos' },
    ];

    const statCards = [
        {
            title: 'Ventas hoy',
            value: money(kpis.sales_today),
            hint: 'Comprobantes + venta rápida',
            icon: TrendingUp,
            accent: 'from-[#ff0f6f]/15 to-white',
        },
        {
            title: 'Pedidos de hoy',
            value: String(kpis.orders_today),
            hint: 'Cotizaciones emitidas',
            icon: ShoppingCart,
            accent: 'from-[#26b9de]/15 to-white',
        },
        {
            title: 'Clientes activos',
            value: kpis.active_customers.toLocaleString('es-PE'),
            hint: 'Socios tipo cliente',
            icon: Users,
            accent: 'from-[#a8e65e]/20 to-white',
        },
        {
            title: 'Productos activos',
            value: kpis.active_products.toLocaleString('es-PE'),
            hint: 'Catálogo vigente',
            icon: Package,
            accent: 'from-[#f5cc33]/22 to-white',
        },
    ] as const;
    const salesVariationPositive = kpis.sales_variation >= 0;
    const collectionsVariationPositive = kpis.collections_variation >= 0;

    const handleFilterChange = (next: { period?: number; warehouse_id?: string | null }) => {
        router.get(
            '/dashboard',
            {
                period: next.period ?? filters.period,
                warehouse_id: next.warehouse_id ?? filters.warehouse_id ?? '',
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Panel" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#4c1d95]">
                            Dashboard Choko House
                        </h1>
                        <p className="mt-1 text-sm text-[#7c6f8a]">
                            Ventas, cobros, inventario y alertas clave en tiempo real.
                        </p>
                    </div>
                    <img
                        src={brandLogoSrc()}
                        alt="Choko House"
                        className="h-16 w-auto object-contain"
                    />
                </div>

                <div
                    className="grid gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm md:grid-cols-2"
                    data-tour="dashboard-filters"
                >
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="font-semibold text-[#5b2d82]">Periodo de análisis</span>
                        <Select
                            value={String(filters.period)}
                            onValueChange={(value) => handleFilterChange({ period: Number(value) })}
                        >
                            <SelectTrigger className="w-full rounded-lg border-violet-200 text-[#3b2d4a] focus-visible:border-violet-400 focus-visible:ring-violet-200/70">
                                <SelectValue placeholder="Selecciona periodo" />
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectItem value="7">Últimos 7 días</SelectItem>
                                <SelectItem value="30">Últimos 30 días</SelectItem>
                                <SelectItem value="90">Últimos 90 días</SelectItem>
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="font-semibold text-[#5b2d82]">Almacén</span>
                        <Select
                            value={filters.warehouse_id ?? '__all__'}
                            onValueChange={(value) =>
                                handleFilterChange({
                                    warehouse_id: value === '__all__' ? null : value,
                                })
                            }
                        >
                            <SelectTrigger className="w-full rounded-lg border-violet-200 text-[#3b2d4a] focus-visible:border-violet-400 focus-visible:ring-violet-200/70">
                                <SelectValue placeholder="Selecciona almacén" />
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectItem value="__all__">Todos los almacenes</SelectItem>
                                {warehouseOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                </div>

                <div
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    data-tour="dashboard-kpis"
                >
                    {statCards.map((card) => (
                        <div
                            key={card.title}
                            className={`flex flex-col gap-3 rounded-2xl border border-violet-100 bg-linear-to-br p-5 shadow-sm ${card.accent}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-wide text-[#a78bfa] uppercase">
                                    {card.title}
                                </span>
                                <span className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-[#7c3aed]">
                                    <card.icon className="size-[18px]" />
                                </span>
                            </div>
                            <p className="text-2xl font-extrabold text-[#3b2d4a]">
                                {card.value}
                            </p>
                            <p className="text-xs font-medium text-[#9d8fb0]">
                                {card.hint}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50/80 to-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                                Cobrado hoy
                            </p>
                            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                <Banknote className="size-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-[#3b2d4a]">
                            {money(kpis.collections_today)}
                        </p>
                        <p className="mt-1 text-sm text-[#7c6f8a]">
                            Pagos registrados en tesorería
                        </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-[#7c6f8a] uppercase">
                            Cobrado en el periodo
                        </p>
                        <p className="mt-2 text-2xl font-extrabold text-[#3b2d4a]">
                            {money(kpis.collections_period)}
                        </p>
                        <p
                            className={`mt-1 text-sm font-semibold ${collectionsVariationPositive ? 'text-emerald-700' : 'text-rose-700'}`}
                        >
                            {collectionsVariationPositive ? '+' : ''}
                            {kpis.collections_variation.toFixed(2)}% vs periodo anterior ·{' '}
                            {kpis.collections_count_period.toLocaleString('es-PE')} cobros
                        </p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50/70 to-white p-4 shadow-sm sm:col-span-2 xl:col-span-1">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold tracking-wide text-amber-900 uppercase">
                                Por cobrar
                            </p>
                            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                                <Wallet className="size-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-[#3b2d4a]">
                            {money(kpis.receivable_balance)}
                        </p>
                        <p className="mt-1 text-sm text-[#7c6f8a]">
                            Saldo pendiente en ventas confirmadas
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-[#7c6f8a] uppercase">Ventas del periodo</p>
                        <p className="mt-2 text-2xl font-extrabold text-[#3b2d4a]">{money(kpis.sales_period)}</p>
                        <p className={`mt-1 text-sm font-semibold ${salesVariationPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {salesVariationPositive ? '+' : ''}
                            {kpis.sales_variation.toFixed(2)}% vs periodo anterior
                        </p>
                    </div>
                    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-[#7c6f8a] uppercase">Ticket promedio</p>
                        <p className="mt-2 text-2xl font-extrabold text-[#3b2d4a]">{money(kpis.avg_ticket)}</p>
                        <p className="mt-1 text-sm text-[#7c6f8a]">
                            {kpis.documents_period.toLocaleString('es-PE')} ventas confirmadas en {filters.period} días
                        </p>
                    </div>
                    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-[#7c6f8a] uppercase">Conversión</p>
                        <p className="mt-2 text-2xl font-extrabold text-[#3b2d4a]">{kpis.conversion_rate.toFixed(2)}%</p>
                        <p className="mt-1 text-sm text-[#7c6f8a]">
                            {kpis.documents_period.toLocaleString('es-PE')} ventas / {kpis.quotes_period.toLocaleString('es-PE')} cotizaciones
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2" data-tour="dashboard-charts">
                    <div className="min-w-0">
                        <div className="h-full rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-[#5b2d82]">Tendencia de ventas (7 días)</h2>
                            </div>
                            <ChartContainer height={260}>
                                <LineChart data={salesTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#efe7ff" />
                                    <XAxis dataKey="label" stroke="#7c6f8a" />
                                    <YAxis stroke="#7c6f8a" />
                                    <Tooltip
                                        formatter={(value: number) => money(Number(value))}
                                        labelFormatter={(label) => `Día: ${label}`}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke={brand.purple}
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: brand.pink }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </div>
                    <div className="min-w-0">
                        <div className="h-full rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-sm font-bold text-[#047857]">
                                Tendencia de cobros (7 días)
                            </h2>
                            <ChartContainer height={260}>
                                <LineChart data={collectionsTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                                    <XAxis dataKey="label" stroke="#7c6f8a" />
                                    <YAxis stroke="#7c6f8a" />
                                    <Tooltip
                                        formatter={(value: number) => money(Number(value))}
                                        labelFormatter={(label) => `Día: ${label}`}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#059669"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: brand.lime }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <div className="min-w-0">
                        <div className="h-full rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-sm font-bold text-[#5b2d82]">Participación por categoría ({filters.period} días)</h2>
                            <ChartContainer height={220}>
                                <PieChart>
                                    <Pie
                                        data={categoryShare}
                                        dataKey="amount"
                                        nameKey="category"
                                        innerRadius={45}
                                        outerRadius={78}
                                        paddingAngle={2}
                                    >
                                        {categoryShare.map((entry, index) => (
                                            <Cell key={entry.category} fill={palette[index % palette.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => money(Number(value))} />
                                    <Legend />
                                </PieChart>
                            </ChartContainer>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <div className="min-w-0 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-2">
                            <Candy className="size-4 text-[#f7941d]" />
                            <h2 className="text-sm font-bold text-[#5b2d82]">Top productos ({filters.period} días)</h2>
                        </div>
                        <ChartContainer height={260}>
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#efe7ff" />
                                <XAxis type="number" stroke="#7c6f8a" />
                                <YAxis type="category" dataKey="name" width={120} stroke="#7c6f8a" />
                                <Tooltip />
                                <Bar dataKey="qty" fill={brand.cyan} radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                        <h2 className="mb-3 text-sm font-bold text-[#5b2d82]">Performance mensual (6 meses)</h2>
                        <ChartContainer height={260}>
                            <AreaChart data={monthlyPerformance}>
                                <defs>
                                    <linearGradient id="monthlyArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={brand.pink} stopOpacity={0.35} />
                                        <stop offset="100%" stopColor={brand.cyan} stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#efe7ff" />
                                <XAxis dataKey="month" stroke="#7c6f8a" />
                                <YAxis stroke="#7c6f8a" />
                                <Tooltip formatter={(value: number) => money(Number(value))} />
                                <Area type="monotone" dataKey="amount" stroke={brand.purple} fill="url(#monthlyArea)" strokeWidth={3} />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                        <h2 className="mb-3 text-sm font-bold text-[#5b2d82]">Venta por tipo de comprobante</h2>
                        <ChartContainer height={260}>
                            <BarChart data={salesByDocumentType}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#efe7ff" />
                                <XAxis dataKey="type" stroke="#7c6f8a" />
                                <YAxis stroke="#7c6f8a" />
                                <Tooltip formatter={(value: number) => money(Number(value))} />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                    {salesByDocumentType.map((entry, index) => (
                                        <Cell key={entry.type} fill={palette[index % palette.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm xl:col-span-2">
                        <div className="mb-3 flex items-center gap-2">
                            <AlertTriangle className="size-4 text-amber-700" />
                            <h2 className="text-sm font-bold text-amber-800">Alertas de stock mínimo</h2>
                        </div>
                        <div className="space-y-2">
                            {lowStockAlerts.length === 0 ? (
                                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    Todo en orden. No hay alertas de stock mínimo.
                                </p>
                            ) : (
                                lowStockAlerts.map((item) => (
                                    <div key={item.variant_id} className="rounded-xl border border-amber-200 bg-white px-3 py-2">
                                        <p className="font-medium text-[#3b2d4a]">{item.product}</p>
                                        <p className="text-xs text-[#7c6f8a]">
                                            {item.sku ?? 'SKU —'} · Stock:{' '}
                                            <span className={item.level === 'critical' ? 'font-semibold text-rose-700' : 'font-semibold text-amber-700'}>
                                                {item.stock.toFixed(2)}
                                            </span>{' '}
                                            · Min: {item.minimum.toFixed(2)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                        <h2 className="mb-3 text-sm font-bold text-[#5b2d82]">Accesos rápidos</h2>
                        <div className="grid gap-2">
                            {quickLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-lg border border-violet-100 px-3 py-2 text-sm font-medium text-[#5b2d82] transition hover:bg-violet-50"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Inicio',
            href: dashboard(),
        },
    ],
};
