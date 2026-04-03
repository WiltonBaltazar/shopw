<?php

use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', function () {
    $baseUrl = rtrim(config('app.url'), '/');
    $products = \App\Models\Product::where('is_active', true)->get(['slug', 'updated_at']);

    $urls = [];

    // Static pages
    $urls[] = ['loc' => $baseUrl . '/', 'changefreq' => 'weekly', 'priority' => '1.0'];
    $urls[] = ['loc' => $baseUrl . '/menu', 'changefreq' => 'daily', 'priority' => '0.9'];

    // Product pages
    foreach ($products as $product) {
        $urls[] = [
            'loc'        => $baseUrl . '/produto/' . $product->slug,
            'lastmod'    => $product->updated_at->format('Y-m-d'),
            'changefreq' => 'weekly',
            'priority'   => '0.8',
        ];
    }

    $xml = '<?xml version="1.0" encoding="UTF-8"?>';
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    foreach ($urls as $url) {
        $xml .= '<url>';
        foreach ($url as $tag => $value) {
            $xml .= "<{$tag}>" . htmlspecialchars($value) . "</{$tag}>";
        }
        $xml .= '</url>';
    }
    $xml .= '</urlset>';

    return response($xml, 200)->header('Content-Type', 'application/xml');
});

// Catch-all: serve the React SPA for every non-API, non-asset request
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|storage|_debugbar|sitemap).*$');
