<!DOCTYPE html>
<html lang="{{ config('app.locale', 'en') }}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />

    {{-- Default title & description (overridden per-page by react-helmet-async) --}}
    <title>{{ \App\Models\Setting::get('seo_home_title', config('app.name')) }}</title>
    <meta name="description" content="{{ \App\Models\Setting::get('seo_home_description', '') }}" />

    {{-- Default Open Graph (overridden per-page by react-helmet-async) --}}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="{{ \App\Models\Setting::get('seo_site_name', config('app.name')) }}" />
    <meta property="og:locale" content="{{ config('app.locale', 'en') }}" />
    <meta property="og:title" content="{{ \App\Models\Setting::get('seo_home_title', config('app.name')) }}" />
    <meta property="og:description" content="{{ \App\Models\Setting::get('seo_home_description', '') }}" />
    @if(\App\Models\Setting::get('seo_og_image'))
    <meta property="og:image" content="{{ \App\Models\Setting::get('seo_og_image') }}" />
    @endif

    @if(\App\Models\Setting::get('favicon_url'))
    <link rel="icon" href="{{ \App\Models\Setting::get('favicon_url') }}" />
    <link rel="shortcut icon" href="{{ \App\Models\Setting::get('favicon_url') }}" />
    <link rel="apple-touch-icon" href="{{ \App\Models\Setting::get('favicon_url') }}" />
    @endif

    {{-- LocalBusiness structured data --}}
    @php
    $s            = \App\Models\Setting::class;
    $siteName     = $s::get('seo_site_name', config('app.name'));
    $description  = $s::get('seo_home_description', '');
    $siteUrl      = config('app.url');
    $businessType = $s::get('store_business_type', 'LocalBusiness');
    $storePhone   = $s::get('store_phone', '');
    $whatsapp     = $s::get('whatsapp_number', '');
    $phone        = $storePhone ?: ($whatsapp ? '+' . $whatsapp : '');
    $address      = $s::get('store_address', '');
    $city         = $s::get('store_city', '');
    $country      = $s::get('store_country', '');
    $currency     = $s::get('store_currency', 'USD');
    $instagram    = $s::get('social_instagram');

    $localBusinessData = [
        '@context'        => 'https://schema.org',
        '@type'           => $businessType,
        'name'            => $siteName,
        'url'             => $siteUrl,
        'potentialAction' => [
            '@type'  => 'OrderAction',
            'target' => $siteUrl . '/menu',
        ],
    ];

    if ($description) $localBusinessData['description'] = $description;
    if ($phone) $localBusinessData['telephone'] = $phone;
    if ($currency) $localBusinessData['currenciesAccepted'] = $currency;
    if ($instagram) $localBusinessData['sameAs'] = [$instagram];

    if ($city || $country || $address) {
        $postalAddress = ['@type' => 'PostalAddress'];
        if ($address) $postalAddress['streetAddress'] = $address;
        if ($city) $postalAddress['addressLocality'] = $city;
        if ($country) $postalAddress['addressCountry'] = $country;
        $localBusinessData['address'] = $postalAddress;
    }

    $localBusiness = json_encode($localBusinessData);
    @endphp
    <script type="application/ld+json">{!! $localBusiness !!}</script>

    {{-- hreflang --}}
    <link rel="alternate" hreflang="{{ config('app.locale', 'en') }}" href="{{ $siteUrl }}" />
    <link rel="alternate" hreflang="x-default" href="{{ $siteUrl }}" />

    {{-- FAQ structured data (from database) --}}
    @php
    $faqItems = \App\Models\Faq::active()->orderBy('sort_order')->orderBy('id')->get(['question', 'answer']);
    @endphp
    @if($faqItems->isNotEmpty())
    @php
    $faq = json_encode([
        '@context'   => 'https://schema.org',
        '@type'      => 'FAQPage',
        'mainEntity' => $faqItems->map(fn($f) => [
            '@type'          => 'Question',
            'name'           => $f->question,
            'acceptedAnswer' => ['@type' => 'Answer', 'text' => $f->answer],
        ])->values()->all(),
    ]);
    @endphp
    <script type="application/ld+json">{!! $faq !!}</script>
    @endif

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body>
    <div id="root"></div>
    <noscript>
        <p>{{ config('app.name') }} — <a href="{{ config('app.url') }}">{{ config('app.url') }}</a></p>
    </noscript>
</body>
</html>
