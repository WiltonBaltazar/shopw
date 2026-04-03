<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Cheesemania API is running',
        'version' => '1.0.0',
    ]);
});

// Public coupon routes
Route::post('/coupons/apply', [\App\Http\Controllers\CouponController::class, 'apply']);
Route::get('/coupons/auto-apply', [\App\Http\Controllers\CouponController::class, 'autoApply']);

// Auth routes (Sanctum)
Route::prefix('admin')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Admin\AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [\App\Http\Controllers\Admin\AuthController::class, 'logout']);
        Route::get('/me', [\App\Http\Controllers\Admin\AuthController::class, 'me']);
    });
});

// Public routes
Route::get('/settings', function () {
    $s = \App\Models\Setting::class;
    return response()->json(['data' => [
        'whatsapp_number'      => $s::get('whatsapp_number', '258840000000'),
        'seo_site_name'        => $s::get('seo_site_name', 'Cheesemania'),
        'seo_home_title'       => $s::get('seo_home_title', 'Cheesemania — Cheesecakes Artesanais em Maputo'),
        'seo_home_description' => $s::get('seo_home_description', 'Cheesecakes artesanais feitos com amor em Maputo, Moçambique. Encomende online e receba na sua porta. Opções sem lactose e fitness disponíveis.'),
        'seo_menu_title'       => $s::get('seo_menu_title', 'Menu de Cheesecakes — Cheesemania Maputo'),
        'seo_menu_description' => $s::get('seo_menu_description', 'Explore o nosso menu de cheesecakes artesanais em Maputo. Sem lactose, fitness e sabores clássicos. Entrega ao domicílio em Maputo e Matola.'),
        'seo_og_image'         => $s::get('seo_og_image', ''),
        'brand_logo_url'       => $s::get('brand_logo_url', null),
        'hero_tagline'         => $s::get('hero_tagline', 'Artesanal · Maputo'),
        'hero_heading'         => $s::get('hero_heading', "More Cheese,\nMore Joy"),
        'hero_subheading'      => $s::get('hero_subheading', 'Cheesecakes artesanais feitos com amor, prontos para a sua celebração especial.'),
        'hero_cta_text'        => $s::get('hero_cta_text', 'Ver o Menu'),
        'hero_image_url'       => $s::get('hero_image_url', null),
        'theme_primary_color'  => $s::get('theme_primary_color', '#685D94'),
    ]]);
});
Route::get('/blocked-dates', function () {
    return response()->json(['data' => \App\Models\BlockedDate::orderBy('date')->pluck('date')]);
});
Route::get('/blocked-weekdays', function () {
    $raw = \App\Models\Setting::get('blocked_weekdays', '[]');
    $decoded = json_decode($raw, true);
    return response()->json(['data' => is_array($decoded) ? $decoded : []]);
});
Route::get('/delivery-hours', function () {
    $s = \App\Models\Setting::class;
    return response()->json(['data' => [
        'start' => (int) $s::get('delivery_start_hour', 10),
        'end'   => (int) $s::get('delivery_end_hour', 19),
    ]]);
});
Route::get('/delivery-regions', function () {
    $regions = \App\Models\DeliveryRegion::where('is_active', true)->orderBy('sort_order')->orderBy('id')->get(['id', 'name', 'price']);
    return response()->json(['data' => $regions]);
});
Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
Route::get('/products/{slug}', [\App\Http\Controllers\ProductController::class, 'show']);
Route::get('/blog-posts', [\App\Http\Controllers\BlogPostController::class, 'index']);
Route::get('/blog-posts/{slug}', [\App\Http\Controllers\BlogPostController::class, 'show']);
Route::get('/testimonials', function () {
    $testimonials = \App\Models\Testimonial::active()
        ->orderBy('sort_order')
        ->orderBy('id')
        ->get(['id', 'author_name', 'author_detail', 'quote', 'rating']);
    return response()->json(['data' => $testimonials]);
});
Route::get('/products/{slug}/reviews', [\App\Http\Controllers\ReviewController::class, 'index']);
Route::post('/products/{slug}/reviews', [\App\Http\Controllers\ReviewController::class, 'store']);
Route::post('/products/{slug}/reviews/check-eligibility', [\App\Http\Controllers\ReviewController::class, 'checkEligibility']);
Route::get('/event-products', [\App\Http\Controllers\ProductController::class, 'eventIndex']);
Route::post('/orders', [\App\Http\Controllers\OrderController::class, 'store']);
Route::post('/event-orders', [\App\Http\Controllers\OrderController::class, 'storeEvent']);
Route::get('/orders/{reference}', [\App\Http\Controllers\OrderController::class, 'show']);
Route::get('/orders/{reference}/payment-info', [\App\Http\Controllers\OrderController::class, 'paymentInfo']);
Route::post('/orders/{reference}/pay', [\App\Http\Controllers\OrderController::class, 'retryPayment']);
Route::post('/my-orders', [\App\Http\Controllers\CustomerOrderController::class, 'index']);
Route::post('/my-favorites/list', [\App\Http\Controllers\CustomerFavoriteController::class, 'index']);
Route::post('/my-favorites', [\App\Http\Controllers\CustomerFavoriteController::class, 'store']);
Route::delete('/my-favorites/{id}', [\App\Http\Controllers\CustomerFavoriteController::class, 'destroy']);
Route::post('/mpesa/callback', [\App\Http\Controllers\MpesaController::class, 'callback']);
Route::get('/mpesa/verify/{reference}', [\App\Http\Controllers\MpesaController::class, 'verify']);

// Admin protected routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/categories', [\App\Http\Controllers\Admin\CategoryController::class, 'index']);
    Route::post('/categories', [\App\Http\Controllers\Admin\CategoryController::class, 'store']);
    Route::patch('/categories/reorder', [\App\Http\Controllers\Admin\CategoryController::class, 'reorder']);
    Route::patch('/categories/{category}', [\App\Http\Controllers\Admin\CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [\App\Http\Controllers\Admin\CategoryController::class, 'destroy']);

    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index']);
    Route::get('/dashboard/revenue-chart', [\App\Http\Controllers\Admin\DashboardController::class, 'revenueChart']);

    Route::apiResource('products', \App\Http\Controllers\Admin\ProductController::class);
    Route::post('/products/{product}/images', [\App\Http\Controllers\Admin\ProductController::class, 'uploadImages']);
    Route::delete('/products/{product}/images/{image}', [\App\Http\Controllers\Admin\ProductController::class, 'deleteImage']);
    Route::patch('/products/{product}/images/reorder', [\App\Http\Controllers\Admin\ProductController::class, 'reorderImages']);

    Route::post('/products/{product}/convert-type', [\App\Http\Controllers\Admin\ProductController::class, 'convertType']);
    Route::post('/products/{product}/variants/generate', [\App\Http\Controllers\Admin\ProductController::class, 'generateVariants']);
    Route::patch('/products/{product}/variants/bulk', [\App\Http\Controllers\Admin\ProductController::class, 'bulkUpdateVariants']);
    Route::post('/products/{product}/variants', [\App\Http\Controllers\Admin\ProductController::class, 'storeVariant']);
    Route::patch('/products/{product}/variants/{variant}', [\App\Http\Controllers\Admin\ProductController::class, 'updateVariant']);
    Route::delete('/products/{product}/variants/{variant}', [\App\Http\Controllers\Admin\ProductController::class, 'destroyVariant']);

    Route::post('/products/{product}/attributes', [\App\Http\Controllers\Admin\ProductController::class, 'storeAttribute']);
    Route::post('/products/{product}/attributes/{attribute}/values', [\App\Http\Controllers\Admin\ProductController::class, 'storeAttributeValue']);
    Route::delete('/products/{product}/attributes/{attribute}/values/{value}', [\App\Http\Controllers\Admin\ProductController::class, 'destroyAttributeValue']);

    Route::post('/products/{product}/addons', [\App\Http\Controllers\Admin\ProductController::class, 'storeAddon']);
    Route::patch('/products/{product}/addons/{addon}', [\App\Http\Controllers\Admin\ProductController::class, 'updateAddon']);
    Route::delete('/products/{product}/addons/{addon}', [\App\Http\Controllers\Admin\ProductController::class, 'destroyAddon']);

    Route::post('/orders', [\App\Http\Controllers\Admin\OrderController::class, 'store']);
    Route::get('/orders', [\App\Http\Controllers\Admin\OrderController::class, 'index']);
    Route::get('/orders/calendar', [\App\Http\Controllers\Admin\OrderController::class, 'calendar']);
    Route::get('/orders/latest-id', [\App\Http\Controllers\Admin\OrderController::class, 'latestOrderId']);
    Route::get('/orders/export', [\App\Http\Controllers\Admin\OrderController::class, 'export']);
    Route::patch('/orders/bulk-status', [\App\Http\Controllers\Admin\OrderController::class, 'bulkUpdateStatus']);
    Route::get('/orders/{order}', [\App\Http\Controllers\Admin\OrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [\App\Http\Controllers\Admin\OrderController::class, 'updateStatus']);
    Route::patch('/orders/{order}/notes', [\App\Http\Controllers\Admin\OrderController::class, 'updateNotes']);
    Route::patch('/orders/{order}/payment-due', [\App\Http\Controllers\Admin\OrderController::class, 'setPaymentDue']);
    Route::post('/orders/{order}/reset-payment', [\App\Http\Controllers\Admin\OrderController::class, 'resetPayment']);

    Route::get('/reviews', [\App\Http\Controllers\Admin\ReviewController::class, 'index']);
    Route::patch('/reviews/{review}', [\App\Http\Controllers\Admin\ReviewController::class, 'update']);

    Route::get('/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index']);
    Route::patch('/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update']);
    Route::post('/settings/upload-image', [\App\Http\Controllers\Admin\SettingsController::class, 'uploadImage']);

    Route::get('/blocked-dates', [\App\Http\Controllers\Admin\BlockedDateController::class, 'index']);
    Route::post('/blocked-dates', [\App\Http\Controllers\Admin\BlockedDateController::class, 'store']);
    Route::delete('/blocked-dates/{blockedDate}', [\App\Http\Controllers\Admin\BlockedDateController::class, 'destroy']);

    Route::get('/delivery-regions', [\App\Http\Controllers\Admin\DeliveryRegionController::class, 'index']);
    Route::post('/delivery-regions', [\App\Http\Controllers\Admin\DeliveryRegionController::class, 'store']);
    Route::patch('/delivery-regions/{deliveryRegion}', [\App\Http\Controllers\Admin\DeliveryRegionController::class, 'update']);
    Route::delete('/delivery-regions/{deliveryRegion}', [\App\Http\Controllers\Admin\DeliveryRegionController::class, 'destroy']);

    Route::get('/coupons', [\App\Http\Controllers\Admin\CouponController::class, 'index']);
    Route::post('/coupons', [\App\Http\Controllers\Admin\CouponController::class, 'store']);
    Route::get('/coupons/{coupon}', [\App\Http\Controllers\Admin\CouponController::class, 'show']);
    Route::put('/coupons/{coupon}', [\App\Http\Controllers\Admin\CouponController::class, 'update']);
    Route::patch('/coupons/{coupon}/toggle', [\App\Http\Controllers\Admin\CouponController::class, 'toggle']);
    Route::delete('/coupons/{coupon}', [\App\Http\Controllers\Admin\CouponController::class, 'destroy']);

    Route::get('/testimonials', [\App\Http\Controllers\Admin\TestimonialController::class, 'index']);
    Route::post('/testimonials', [\App\Http\Controllers\Admin\TestimonialController::class, 'store']);
    Route::patch('/testimonials/{testimonial}', [\App\Http\Controllers\Admin\TestimonialController::class, 'update']);
    Route::delete('/testimonials/{testimonial}', [\App\Http\Controllers\Admin\TestimonialController::class, 'destroy']);

    Route::get('/attributes', [\App\Http\Controllers\Admin\GlobalAttributeController::class, 'index']);
    Route::post('/attributes', [\App\Http\Controllers\Admin\GlobalAttributeController::class, 'store']);
    Route::patch('/attributes/{globalAttribute}', [\App\Http\Controllers\Admin\GlobalAttributeController::class, 'update']);
    Route::delete('/attributes/{globalAttribute}', [\App\Http\Controllers\Admin\GlobalAttributeController::class, 'destroy']);
    Route::post('/attributes/{globalAttribute}/values', [\App\Http\Controllers\Admin\GlobalAttributeController::class, 'storeValue']);
    Route::delete('/attributes/{globalAttribute}/values/{value}', [\App\Http\Controllers\Admin\GlobalAttributeController::class, 'destroyValue']);

    Route::get('/reports', [\App\Http\Controllers\Admin\ReportsController::class, 'index']);
    Route::get('/reports/export', [\App\Http\Controllers\Admin\ReportsController::class, 'exportXlsx']);

    Route::get('/blog-posts', [\App\Http\Controllers\Admin\BlogPostController::class, 'index']);
    Route::post('/blog-posts', [\App\Http\Controllers\Admin\BlogPostController::class, 'store']);
    Route::post('/blog-posts/{blogPost}', [\App\Http\Controllers\Admin\BlogPostController::class, 'update']);
    Route::delete('/blog-posts/{blogPost}', [\App\Http\Controllers\Admin\BlogPostController::class, 'destroy']);
});
