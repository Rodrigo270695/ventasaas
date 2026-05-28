<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\WelcomeController;

// Vitrina pública: catálogo / venta al cliente (sin login)
Route::get('/', WelcomeController::class)->name('home');

Route::get(
    'compras/orden/confirmar/{token}',
    \App\Http\Controllers\Compras\PurchaseOrderSupplierConfirmController::class,
)->name('purchase-order.supplier.confirm');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
