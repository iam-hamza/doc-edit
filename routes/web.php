<?php

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\ShareController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::resource('documents', DocumentController::class)
        ->only(['index', 'store', 'edit', 'update', 'destroy']);

    Route::post('documents/import', [ImportController::class, 'store'])
        ->name('documents.import');

    Route::post('documents/{document}/share', [ShareController::class, 'store'])
        ->name('documents.share');
});

require __DIR__.'/settings.php';
