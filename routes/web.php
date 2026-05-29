<?php

use App\Http\Controllers\Compras\PurchaseOrderSupplierConfirmController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Seo\RobotsController;
use App\Http\Controllers\Seo\SitemapController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

// Vitrina pública: catálogo / venta al cliente (sin login)
Route::get('/', WelcomeController::class)->name('home');

Route::get('robots.txt', RobotsController::class)->name('robots');
Route::get('sitemap.xml', SitemapController::class)->name('sitemap');

Route::get(
    'compras/orden/confirmar/{token}',
    PurchaseOrderSupplierConfirmController::class,
)->name('purchase-order.supplier.confirm');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
