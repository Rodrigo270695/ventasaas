<?php

return [
    'guard' => 'web',

    /*
    |--------------------------------------------------------------------------
    | Catálogo de permisos (árbol del modal de roles)
    |--------------------------------------------------------------------------
    |
    | section: agrupa visualmente en el modal (alineado al menú admin)
    | implemented: true  → módulo disponible hoy
    | implemented: false → reservado; aparece en "Próximamente"
    |
    */
    'groups' => [
        [
            'key' => 'dashboard',
            'section' => 'General',
            'label' => 'Panel',
            'implemented' => true,
            'permissions' => [
                ['name' => 'dashboard.view', 'label' => 'Ver panel de inicio'],
            ],
        ],
        [
            'key' => 'store_settings',
            'section' => 'Configuración',
            'label' => 'Datos de la tienda',
            'implemented' => true,
            'permissions' => [
                ['name' => 'settings.view', 'label' => 'Ver datos de la tienda'],
                ['name' => 'settings.manage', 'label' => 'Editar datos de la tienda'],
            ],
        ],
        [
            'key' => 'store_covers',
            'section' => 'Configuración',
            'label' => 'Fotos de portada',
            'implemented' => true,
            'permissions' => [
                ['name' => 'store_covers.view', 'label' => 'Ver fotos de portada'],
                ['name' => 'store_covers.create', 'label' => 'Subir fotos de portada'],
                ['name' => 'store_covers.update', 'label' => 'Editar fotos de portada'],
                ['name' => 'store_covers.delete', 'label' => 'Eliminar fotos de portada'],
            ],
        ],
        [
            'key' => 'catalog',
            'section' => 'Catálogo',
            'label' => 'Catálogo (acceso general)',
            'implemented' => true,
            'permissions' => [
                ['name' => 'catalog.view', 'label' => 'Ver módulo catálogo'],
                ['name' => 'catalog.manage', 'label' => 'Gestionar catálogo (amplio)'],
            ],
        ],
        [
            'key' => 'categories',
            'section' => 'Catálogo',
            'label' => 'Categorías',
            'implemented' => true,
            'permissions' => [
                ['name' => 'categories.view', 'label' => 'Ver categorías'],
                ['name' => 'categories.create', 'label' => 'Crear categorías'],
                ['name' => 'categories.update', 'label' => 'Editar categorías'],
                ['name' => 'categories.delete', 'label' => 'Eliminar categorías'],
            ],
        ],
        [
            'key' => 'brands',
            'section' => 'Catálogo',
            'label' => 'Marcas',
            'implemented' => true,
            'permissions' => [
                ['name' => 'brands.view', 'label' => 'Ver marcas'],
                ['name' => 'brands.create', 'label' => 'Crear marcas'],
                ['name' => 'brands.update', 'label' => 'Editar marcas'],
                ['name' => 'brands.delete', 'label' => 'Eliminar marcas'],
            ],
        ],
        [
            'key' => 'products',
            'section' => 'Catálogo',
            'label' => 'Productos',
            'implemented' => true,
            'permissions' => [
                ['name' => 'products.view', 'label' => 'Ver productos'],
                ['name' => 'products.create', 'label' => 'Crear productos'],
                ['name' => 'products.update', 'label' => 'Editar productos y variantes'],
                ['name' => 'products.delete', 'label' => 'Eliminar productos y variantes'],
            ],
        ],
        [
            'key' => 'price_lists',
            'section' => 'Catálogo',
            'label' => 'Listas de precios',
            'implemented' => true,
            'permissions' => [
                ['name' => 'price_lists.view', 'label' => 'Ver listas de precios'],
                ['name' => 'price_lists.create', 'label' => 'Crear listas de precios'],
                ['name' => 'price_lists.update', 'label' => 'Editar listas y precios por variante'],
                ['name' => 'price_lists.delete', 'label' => 'Eliminar listas de precios'],
            ],
        ],
        [
            'key' => 'tax_profiles',
            'section' => 'Catálogo',
            'label' => 'Perfiles tributarios',
            'implemented' => true,
            'permissions' => [
                ['name' => 'tax_profiles.view', 'label' => 'Ver perfiles tributarios'],
                ['name' => 'tax_profiles.create', 'label' => 'Crear perfiles tributarios'],
                ['name' => 'tax_profiles.update', 'label' => 'Editar perfiles y asignación por variante'],
                ['name' => 'tax_profiles.delete', 'label' => 'Eliminar perfiles tributarios'],
            ],
        ],
        [
            'key' => 'units',
            'section' => 'Catálogo',
            'label' => 'Unidades de medida',
            'implemented' => true,
            'permissions' => [
                ['name' => 'units.view', 'label' => 'Ver unidades'],
                ['name' => 'units.create', 'label' => 'Crear unidades'],
                ['name' => 'units.update', 'label' => 'Editar unidades'],
                ['name' => 'units.delete', 'label' => 'Eliminar unidades'],
            ],
        ],
        [
            'key' => 'parties',
            'section' => 'Socios',
            'label' => 'Clientes y proveedores',
            'implemented' => true,
            'permissions' => [
                ['name' => 'parties.view', 'label' => 'Ver socios'],
                ['name' => 'parties.create', 'label' => 'Crear socios'],
                ['name' => 'parties.update', 'label' => 'Editar socios y consultar RUC/DNI'],
                ['name' => 'parties.delete', 'label' => 'Eliminar socios'],
            ],
        ],
        [
            'key' => 'party_addresses',
            'section' => 'Socios',
            'label' => 'Direcciones de socios',
            'implemented' => false,
            'permissions' => [
                ['name' => 'party_addresses.view', 'label' => 'Ver direcciones'],
                ['name' => 'party_addresses.manage', 'label' => 'Gestionar direcciones'],
            ],
        ],
        [
            'key' => 'warehouses',
            'section' => 'Inventario',
            'label' => 'Almacenes',
            'implemented' => true,
            'permissions' => [
                ['name' => 'warehouses.view', 'label' => 'Ver almacenes'],
                ['name' => 'warehouses.create', 'label' => 'Crear almacenes'],
                ['name' => 'warehouses.update', 'label' => 'Editar almacenes'],
                ['name' => 'warehouses.delete', 'label' => 'Eliminar almacenes'],
            ],
        ],
        [
            'key' => 'stock_balances',
            'section' => 'Inventario',
            'label' => 'Stock Por almacen',
            'implemented' => true,
            'permissions' => [
                ['name' => 'stock_balances.view', 'label' => 'Ver stock por almacén'],
                ['name' => 'stock_balances.adjust', 'label' => 'Ajustar stock y costo promedio'],
            ],
        ],
        [
            'key' => 'stock_movements',
            'section' => 'Inventario',
            'label' => 'Movimientos (kardex)',
            'implemented' => true,
            'permissions' => [
                ['name' => 'stock_movements.view', 'label' => 'Ver kardex / movimientos'],
                ['name' => 'stock_movements.export', 'label' => 'Exportar movimientos'],
            ],
        ],
        [
            'key' => 'stock_reservations',
            'section' => 'Inventario',
            'label' => 'Reservas de stock',
            'implemented' => false,
            'permissions' => [
                ['name' => 'stock_reservations.view', 'label' => 'Ver reservas'],
                ['name' => 'stock_reservations.manage', 'label' => 'Gestionar reservas'],
            ],
        ],
        [
            'key' => 'users',
            'section' => 'Sistema',
            'label' => 'Usuarios',
            'implemented' => true,
            'permissions' => [
                ['name' => 'users.view', 'label' => 'Ver usuarios'],
                ['name' => 'users.create', 'label' => 'Crear usuarios'],
                ['name' => 'users.update', 'label' => 'Editar usuarios'],
                ['name' => 'users.delete', 'label' => 'Eliminar usuarios'],
                ['name' => 'users.assign-roles', 'label' => 'Asignar roles a usuarios'],
            ],
        ],
        [
            'key' => 'roles',
            'section' => 'Sistema',
            'label' => 'Roles y permisos',
            'implemented' => true,
            'permissions' => [
                ['name' => 'roles.view', 'label' => 'Ver roles'],
                ['name' => 'roles.create', 'label' => 'Crear roles'],
                ['name' => 'roles.update', 'label' => 'Editar roles'],
                ['name' => 'roles.delete', 'label' => 'Eliminar roles'],
                ['name' => 'roles.assign-permissions', 'label' => 'Asignar permisos a roles'],
            ],
        ],
        [
            'key' => 'audit',
            'section' => 'Sistema',
            'label' => 'Auditoría',
            'implemented' => true,
            'permissions' => [
                ['name' => 'audit.view', 'label' => 'Ver auditoría de actividad'],
            ],
        ],
        [
            'key' => 'sales',
            'section' => 'Ventas',
            'label' => 'Ventas',
            'implemented' => true,
            'permissions' => [
                ['name' => 'sales.view', 'label' => 'Ver comprobantes de venta'],
                ['name' => 'sales.create', 'label' => 'Crear comprobantes'],
                ['name' => 'sales.update', 'label' => 'Editar borradores'],
                ['name' => 'sales.delete', 'label' => 'Eliminar borradores'],
                ['name' => 'sales.confirm', 'label' => 'Confirmar y numerar ventas'],
                ['name' => 'sales.internal.view', 'label' => 'Ver tickets internos'],
                ['name' => 'sales.internal.create', 'label' => 'Crear tickets internos'],
                ['name' => 'sales.internal.update', 'label' => 'Editar borradores internos'],
                ['name' => 'sales.internal.delete', 'label' => 'Eliminar borradores internos'],
                ['name' => 'sales.internal.confirm', 'label' => 'Confirmar tickets internos'],
            ],
        ],
        [
            'key' => 'sales_quotations',
            'section' => 'Ventas',
            'label' => 'Cotizaciones',
            'implemented' => true,
            'permissions' => [
                ['name' => 'sales.quotations.view', 'label' => 'Ver cotizaciones'],
                ['name' => 'sales.quotations.create', 'label' => 'Crear cotizaciones'],
                ['name' => 'sales.quotations.update', 'label' => 'Editar cotizaciones'],
                ['name' => 'sales.quotations.send-email', 'label' => 'Enviar cotizaciones por correo'],
            ],
        ],
        [
            'key' => 'purchases',
            'section' => 'Compras',
            'label' => 'Compras (general)',
            'implemented' => true,
            'permissions' => [
                ['name' => 'purchases.view', 'label' => 'Ver compras (órdenes, recepciones, facturas)'],
                ['name' => 'purchases.manage', 'label' => 'Gestionar compras (crear y editar)'],
            ],
        ],
        [
            'key' => 'document_series',
            'section' => 'Documentos',
            'label' => 'Series y numeración',
            'implemented' => true,
            'permissions' => [
                ['name' => 'document_series.view', 'label' => 'Ver series'],
                ['name' => 'document_series.create', 'label' => 'Crear series'],
                ['name' => 'document_series.update', 'label' => 'Editar series'],
                ['name' => 'document_series.delete', 'label' => 'Eliminar series'],
            ],
        ],
        [
            'key' => 'electronic_invoicing',
            'section' => 'Facturación SUNAT',
            'label' => 'Comprobantes electrónicos',
            'implemented' => true,
            'permissions' => [
                ['name' => 'electronic_documents.view', 'label' => 'Ver comprobantes'],
                ['name' => 'electronic_documents.manage', 'label' => 'Emitir y gestionar CPE'],
            ],
        ],
        [
            'key' => 'treasury_payment_methods',
            'section' => 'Tesorería',
            'label' => 'Métodos de pago',
            'implemented' => true,
            'permissions' => [
                ['name' => 'treasury.payment_methods.view', 'label' => 'Ver métodos de pago'],
                ['name' => 'treasury.payment_methods.create', 'label' => 'Crear métodos de pago'],
                ['name' => 'treasury.payment_methods.update', 'label' => 'Editar métodos de pago'],
                ['name' => 'treasury.payment_methods.delete', 'label' => 'Eliminar métodos de pago'],
            ],
        ],
        [
            'key' => 'treasury_collections',
            'section' => 'Tesorería',
            'label' => 'Cobros y cuentas por cobrar',
            'implemented' => true,
            'permissions' => [
                ['name' => 'treasury.collections.view', 'label' => 'Ver cobros y cuentas por cobrar'],
                ['name' => 'treasury.collections.create', 'label' => 'Registrar cobros a clientes'],
                ['name' => 'treasury.collections.update', 'label' => 'Editar cobros (referencia, comprobante)'],
            ],
        ],
        [
            'key' => 'treasury_disbursements',
            'section' => 'Tesorería',
            'label' => 'Pagos a proveedores',
            'implemented' => true,
            'permissions' => [
                ['name' => 'treasury.disbursements.view', 'label' => 'Ver pagos y cuentas por pagar'],
                ['name' => 'treasury.disbursements.create', 'label' => 'Registrar pagos a proveedores'],
                ['name' => 'treasury.disbursements.update', 'label' => 'Editar pagos (referencia, comprobante)'],
            ],
        ],
        [
            'key' => 'treasury_cash_registers',
            'section' => 'Tesorería',
            'label' => 'Cajas',
            'implemented' => true,
            'permissions' => [
                ['name' => 'treasury.cash_registers.view', 'label' => 'Ver cajas'],
                ['name' => 'treasury.cash_registers.create', 'label' => 'Crear cajas'],
                ['name' => 'treasury.cash_registers.update', 'label' => 'Editar cajas'],
                ['name' => 'treasury.cash_registers.delete', 'label' => 'Eliminar cajas'],
            ],
        ],
        [
            'key' => 'treasury_cash_sessions',
            'section' => 'Tesorería',
            'label' => 'Sesiones de caja',
            'implemented' => true,
            'permissions' => [
                ['name' => 'treasury.cash_sessions.view', 'label' => 'Ver sesiones'],
                ['name' => 'treasury.cash_sessions.open', 'label' => 'Abrir sesión'],
                ['name' => 'treasury.cash_sessions.close', 'label' => 'Cerrar sesión'],
            ],
        ],
    ],
];
