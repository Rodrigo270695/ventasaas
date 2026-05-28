<?php

use App\Http\Controllers\Admin\Catalogo\BrandController;
use App\Http\Controllers\Admin\Catalogo\ProductCategoryController;
use App\Http\Controllers\Admin\Catalogo\PriceListController;
use App\Http\Controllers\Admin\Catalogo\ProductController;
use App\Http\Controllers\Admin\Catalogo\ProductPriceController;
use App\Http\Controllers\Admin\Catalogo\ProductTaxProfileController;
use App\Http\Controllers\Admin\Catalogo\ProductVariantController;
use App\Http\Controllers\Admin\Catalogo\VariantPackagingConversionController;
use App\Http\Controllers\Admin\Catalogo\TaxProfileController;
use App\Http\Controllers\Admin\Catalogo\UnitController;
use App\Http\Controllers\Admin\Configuracion\StoreSettingsController;
use App\Http\Controllers\Admin\Documentos\DocumentSeriesController;
use App\Http\Controllers\Admin\Documentos\ElectronicDocumentController;
use App\Http\Controllers\Admin\Inventario\StockAdjustmentController;
use App\Http\Controllers\Admin\Inventario\StockBalanceController;
use App\Http\Controllers\Admin\Inventario\StockBreakdownController;
use App\Http\Controllers\Admin\Inventario\StockTransferController;
use App\Http\Controllers\Admin\Inventario\StockMovementController;
use App\Http\Controllers\Admin\Inventario\WarehouseController;
use App\Http\Controllers\Admin\Socios\PartyController;
use App\Http\Controllers\Admin\Socios\PartyDocumentLookupController;
use App\Http\Controllers\Admin\Ventas\SalesDocumentController;
use App\Http\Controllers\Admin\Ventas\SalesQuotationController;
use App\Http\Controllers\Admin\Sistema\RoleController;
use App\Http\Controllers\Admin\Sistema\AuditController;
use App\Http\Controllers\Admin\Sistema\UserController;
use App\Http\Controllers\Admin\Tesoreria\AccountsPayableController;
use App\Http\Controllers\Admin\Tesoreria\AccountsReceivableController;
use App\Http\Controllers\Admin\Compras\PurchaseDocumentController;
use App\Http\Controllers\Admin\Compras\PurchaseQuickVariantController;
use App\Http\Controllers\Admin\Tesoreria\DisbursementPaymentController;
use App\Http\Controllers\Admin\Tesoreria\CashRegisterController;
use App\Http\Controllers\Admin\Tesoreria\CashRegisterSessionController;
use App\Http\Controllers\Admin\Tesoreria\CollectionPaymentController;
use App\Http\Controllers\Admin\Tesoreria\PaymentMethodController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::prefix('configuracion')->name('configuracion.')->group(function () {
            Route::get('tienda', [StoreSettingsController::class, 'index'])
                ->name('tienda.index');
            Route::post('tienda', [StoreSettingsController::class, 'store'])
                ->name('tienda.store');
            Route::put('tienda/{cfg_store_setting}', [StoreSettingsController::class, 'update'])
                ->name('tienda.update');
        });

        Route::prefix('catalogo')->name('catalogo.')->group(function () {
            Route::resource('marcas', BrandController::class)->except(['show', 'create', 'edit']);
            Route::resource('categorias', ProductCategoryController::class)->except(['show', 'create', 'edit']);
            Route::resource('productos', ProductController::class)->except(['create', 'edit']);
            Route::get('productos/{producto}/stock-resumen', [ProductController::class, 'stockSummary'])
                ->name('productos.stock-resumen');
            Route::post('productos/{producto}/variantes', [ProductVariantController::class, 'store'])
                ->name('productos.variantes.store');
            Route::put('productos/{producto}/variantes/{variante}', [ProductVariantController::class, 'update'])
                ->name('productos.variantes.update');
            Route::delete('productos/{producto}/variantes/{variante}', [ProductVariantController::class, 'destroy'])
                ->name('productos.variantes.destroy');
            Route::post('productos/{producto}/precios', [ProductPriceController::class, 'store'])
                ->name('productos.precios.store');
            Route::put('productos/{producto}/precios/{precio}', [ProductPriceController::class, 'update'])
                ->name('productos.precios.update');
            Route::delete('productos/{producto}/precios/{precio}', [ProductPriceController::class, 'destroy'])
                ->name('productos.precios.destroy');
            Route::post('productos/{producto}/perfiles-tributarios', [ProductTaxProfileController::class, 'store'])
                ->name('productos.perfiles-tributarios.store');
            Route::put('productos/{producto}/perfiles-tributarios/{perfil}', [ProductTaxProfileController::class, 'update'])
                ->name('productos.perfiles-tributarios.update');
            Route::delete('productos/{producto}/perfiles-tributarios/{perfil}', [ProductTaxProfileController::class, 'destroy'])
                ->name('productos.perfiles-tributarios.destroy');
            Route::post('productos/{producto}/conversiones-empaque', [VariantPackagingConversionController::class, 'store'])
                ->name('productos.conversiones-empaque.store');
            Route::delete('productos/{producto}/conversiones-empaque/{conversion}', [VariantPackagingConversionController::class, 'destroy'])
                ->name('productos.conversiones-empaque.destroy');
            Route::resource('listas-precios', PriceListController::class)
                ->parameters(['listas_precio' => 'lista_precio'])
                ->except(['show', 'create', 'edit']);
            Route::resource('perfiles-tributarios', TaxProfileController::class)
                ->parameters(['perfiles_tributario' => 'perfiles_tributario'])
                ->except(['show', 'create', 'edit']);
            Route::resource('unidades', UnitController::class)->except(['show', 'create', 'edit']);
            Route::post('productos/{producto}/stock', [StockAdjustmentController::class, 'storeForProduct'])
                ->name('productos.stock.store');
        });

        Route::get('socios/consulta-documento', PartyDocumentLookupController::class)
            ->name('socios.consulta-documento');

        Route::resource('socios', PartyController::class)
            ->parameters(['socio' => 'socio'])
            ->except(['show', 'create', 'edit']);

        Route::prefix('documentos')->name('documentos.')->group(function () {
            Route::resource('series', DocumentSeriesController::class)
                ->parameters(['series' => 'serie'])
                ->except(['show', 'create', 'edit']);
            Route::get('comprobantes-electronicos', [ElectronicDocumentController::class, 'index'])
                ->name('comprobantes-electronicos.index');
            Route::get('comprobantes-electronicos/{comprobanteElectronico}', [ElectronicDocumentController::class, 'show'])
                ->name('comprobantes-electronicos.show');
            Route::post('comprobantes-electronicos/{comprobanteElectronico}/reemitir', [ElectronicDocumentController::class, 'reemit'])
                ->name('comprobantes-electronicos.reemit');
        });

        Route::prefix('ventas')->name('ventas.')->group(function () {
            Route::get('cotizaciones', [SalesQuotationController::class, 'index'])
                ->name('cotizaciones.index');
            Route::get('cotizaciones/nuevo', [SalesQuotationController::class, 'create'])
                ->name('cotizaciones.create');
            Route::post('cotizaciones', [SalesQuotationController::class, 'store'])
                ->name('cotizaciones.store');
            Route::get('cotizaciones/{cotizacion}/edit', [SalesQuotationController::class, 'edit'])
                ->name('cotizaciones.edit');
            Route::put('cotizaciones/{cotizacion}', [SalesQuotationController::class, 'update'])
                ->name('cotizaciones.update');
            Route::post('cotizaciones/{cotizacion}/enviar-correo', [SalesQuotationController::class, 'sendEmail'])
                ->name('cotizaciones.send-email');
            Route::post('cotizaciones/{cotizacion}/aceptar', [SalesQuotationController::class, 'markAccepted'])
                ->name('cotizaciones.accept');
            Route::post('cotizaciones/{cotizacion}/rechazar', [SalesQuotationController::class, 'markRejected'])
                ->name('cotizaciones.reject');
            Route::post('cotizaciones/{cotizacion}/anular', [SalesQuotationController::class, 'cancel'])
                ->name('cotizaciones.cancel');
            Route::post('cotizaciones/{cotizacion}/duplicar', [SalesQuotationController::class, 'duplicate'])
                ->name('cotizaciones.duplicate');
            Route::post('cotizaciones/{cotizacion}/convertir-comprobante', [SalesQuotationController::class, 'convertToInvoice'])
                ->name('cotizaciones.convert-to-invoice');
            Route::get('cotizaciones/{cotizacion}/imprimir', [SalesQuotationController::class, 'print'])
                ->name('cotizaciones.print');

            Route::get('comprobantes/nuevo', [SalesDocumentController::class, 'create'])
                ->name('comprobantes.create');
            Route::post('comprobantes/{comprobante}/confirmar', [SalesDocumentController::class, 'confirm'])
                ->name('comprobantes.confirm');
            Route::get('comprobantes/{comprobante}/ticket', [SalesDocumentController::class, 'ticket'])
                ->name('comprobantes.ticket');
            Route::resource('comprobantes', SalesDocumentController::class)
                ->parameters(['comprobantes' => 'comprobante'])
                ->except(['show', 'create']);

            Route::get('tickets-internos', [SalesDocumentController::class, 'indexInternal'])
                ->name('tickets-internos.index');
            Route::get('tickets-internos/nuevo', [SalesDocumentController::class, 'createInternal'])
                ->name('tickets-internos.create');
            Route::post('tickets-internos/{comprobante}/confirmar', [SalesDocumentController::class, 'confirm'])
                ->name('tickets-internos.confirm');
            Route::get('tickets-internos/{comprobante}/ticket', [SalesDocumentController::class, 'ticket'])
                ->name('tickets-internos.ticket');
            Route::post('tickets-internos', [SalesDocumentController::class, 'store'])
                ->name('tickets-internos.store');
            Route::get('tickets-internos/{comprobante}/edit', [SalesDocumentController::class, 'editInternal'])
                ->name('tickets-internos.edit');
            Route::put('tickets-internos/{comprobante}', [SalesDocumentController::class, 'update'])
                ->name('tickets-internos.update');
            Route::delete('tickets-internos/{comprobante}', [SalesDocumentController::class, 'destroy'])
                ->name('tickets-internos.destroy');
        });

        Route::prefix('compras')->name('compras.')->group(function () {
            Route::get('ordenes', [\App\Http\Controllers\Admin\Compras\PurchaseOrderController::class, 'index'])
                ->name('ordenes.index');
            Route::get('ordenes/nuevo', [\App\Http\Controllers\Admin\Compras\PurchaseOrderController::class, 'create'])
                ->name('ordenes.create');
            Route::post('ordenes', [\App\Http\Controllers\Admin\Compras\PurchaseOrderController::class, 'store'])
                ->name('ordenes.store');
            Route::get('ordenes/{orden}/edit', [\App\Http\Controllers\Admin\Compras\PurchaseOrderController::class, 'edit'])
                ->name('ordenes.edit');
            Route::put('ordenes/{orden}', [\App\Http\Controllers\Admin\Compras\PurchaseOrderController::class, 'update'])
                ->name('ordenes.update');
            Route::post('ordenes/{orden}/aprobar', [\App\Http\Controllers\Admin\Compras\PurchaseOrderController::class, 'approve'])
                ->name('ordenes.approve');
            Route::post('ordenes/{orden}/anular', [\App\Http\Controllers\Admin\Compras\PurchaseOrderController::class, 'cancel'])
                ->name('ordenes.cancel');
            Route::post('ordenes/{orden}/enviar-correo', [\App\Http\Controllers\Admin\Compras\PurchaseOrderController::class, 'sendSupplierEmail'])
                ->name('ordenes.send-email');
            Route::get('recepciones', [\App\Http\Controllers\Admin\Compras\GoodsReceiptController::class, 'index'])
                ->name('recepciones.index');
            Route::get('recepciones/nuevo', [\App\Http\Controllers\Admin\Compras\GoodsReceiptController::class, 'create'])
                ->name('recepciones.create');
            Route::post('recepciones', [\App\Http\Controllers\Admin\Compras\GoodsReceiptController::class, 'store'])
                ->name('recepciones.store');
            Route::get('facturas', [PurchaseDocumentController::class, 'index'])
                ->name('facturas.index');
            Route::get('facturas/nuevo', [PurchaseDocumentController::class, 'create'])
                ->name('facturas.create');
            Route::post('facturas', [PurchaseDocumentController::class, 'store'])
                ->name('facturas.store');
            Route::get('facturas/{factura}/edit', [PurchaseDocumentController::class, 'edit'])
                ->name('facturas.edit');
            Route::put('facturas/{factura}', [PurchaseDocumentController::class, 'update'])
                ->name('facturas.update');
            Route::get('facturas/{factura}/archivo', [PurchaseDocumentController::class, 'invoice'])
                ->name('facturas.invoice');
            Route::post('variantes-rapidas', [PurchaseQuickVariantController::class, 'store'])
                ->name('variantes-rapidas.store');
        });

        Route::prefix('inventario')->name('inventario.')->group(function () {
            Route::get('saldos', [StockBalanceController::class, 'index'])->name('saldos.index');
            Route::post('saldos/ajustes', [StockAdjustmentController::class, 'store'])
                ->name('saldos.ajustes.store');
            Route::post('saldos/traslados', [StockTransferController::class, 'store'])
                ->name('saldos.traslados.store');
            Route::post('saldos/desgloses', [StockBreakdownController::class, 'store'])
                ->name('saldos.desgloses.store');
            Route::get('movimientos', [StockMovementController::class, 'index'])
                ->name('movimientos.index');
            Route::resource('almacenes', WarehouseController::class)
                ->parameters(['almacenes' => 'almacen'])
                ->except(['show', 'create', 'edit']);
        });

        Route::prefix('tesoreria')->name('tesoreria.')->group(function () {
            Route::get('cobros', [CollectionPaymentController::class, 'index'])
                ->name('cobros.index');
            Route::post('cobros', [CollectionPaymentController::class, 'store'])
                ->name('cobros.store');
            Route::get('cuentas-por-cobrar', [AccountsReceivableController::class, 'index'])
                ->name('cuentas-por-cobrar.index');
            Route::get('cuentas-por-pagar', [AccountsPayableController::class, 'index'])
                ->name('cuentas-por-pagar.index');
            Route::get('pagos-proveedor', [DisbursementPaymentController::class, 'index'])
                ->name('pagos-proveedor.index');
            Route::post('pagos-proveedor', [DisbursementPaymentController::class, 'store'])
                ->name('pagos-proveedor.store');
            Route::patch('pagos-proveedor/{pago}', [DisbursementPaymentController::class, 'update'])
                ->name('pagos-proveedor.update');
            Route::get('pagos-proveedor/{pago}/comprobante', [DisbursementPaymentController::class, 'proof'])
                ->name('pagos-proveedor.proof');
            Route::resource('metodos-pago', PaymentMethodController::class)
                ->parameters(['metodos-pago' => 'metodos_pago'])
                ->except(['show', 'create', 'edit']);
            Route::resource('cajas', CashRegisterController::class)
                ->parameters(['cajas' => 'caja'])
                ->except(['show', 'create', 'edit']);
            Route::get('sesiones', [CashRegisterSessionController::class, 'index'])
                ->name('sesiones.index');
            Route::post('sesiones', [CashRegisterSessionController::class, 'store'])
                ->name('sesiones.store');
            Route::put('sesiones/{sesion}/cerrar', [CashRegisterSessionController::class, 'close'])
                ->name('sesiones.close');
        });

        Route::prefix('sistema')->name('sistema.')->group(function () {
            Route::get('auditoria', [AuditController::class, 'index'])
                ->name('auditoria.index');
            Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions'])
                ->name('roles.permissions.update');
            Route::resource('roles', RoleController::class)->except(['show', 'create', 'edit']);
            Route::put('usuarios/{usuario}/roles', [UserController::class, 'syncRoles'])
                ->name('usuarios.roles.update');
            Route::resource('usuarios', UserController::class)->except(['show', 'create', 'edit']);
        });
    });
