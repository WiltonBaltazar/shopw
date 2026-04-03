<!DOCTYPE html>
<html lang="pt-MZ">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />

    {{-- Default title & description (overridden per-page by react-helmet-async) --}}
    <title>{{ \App\Models\Setting::get('seo_home_title', 'Cheesemania — Cheesecakes Homemade em Maputo') }}</title>
    <meta name="description" content="{{ \App\Models\Setting::get('seo_home_description', 'Cheesecakes Homemade feitos com amor em Maputo, Moçambique. Encomende online e receba na sua porta.') }}" />

    {{-- Default Open Graph (overridden per-page by react-helmet-async) --}}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="{{ \App\Models\Setting::get('seo_site_name', 'Cheesemania') }}" />
    <meta property="og:locale" content="pt_MZ" />
    <meta property="og:title" content="{{ \App\Models\Setting::get('seo_home_title', 'Cheesemania — Cheesecakes Homemade em Maputo') }}" />
    <meta property="og:description" content="{{ \App\Models\Setting::get('seo_home_description', 'Cheesecakes Homemade feitos com amor em Maputo, Moçambique.') }}" />
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
    $phone = '+' . \App\Models\Setting::get('whatsapp_number', '258840000000');
    $siteUrl = config('app.url');
    $localBusiness = json_encode([
        '@context'           => 'https://schema.org',
        '@type'              => ['Bakery', 'FoodEstablishment'],
        'name'               => \App\Models\Setting::get('seo_site_name', 'Cheesemania'),
        'description'        => 'Cheesecakes Homemade feitos à mão em Maputo, Moçambique. Entrega ao domicílio em Maputo e Matola.',
        'url'                => $siteUrl,
        'telephone'          => $phone,
        'address'            => [
            '@type'           => 'PostalAddress',
            'addressLocality' => 'Maputo',
            'addressRegion'   => 'Maputo',
            'addressCountry'  => 'MZ',
        ],
        'geo'                => [
            '@type'     => 'GeoCoordinates',
            'latitude'  => -25.9692,
            'longitude' => 32.5732,
        ],
        'areaServed'         => [
            ['@type' => 'City', 'name' => 'Maputo'],
            ['@type' => 'City', 'name' => 'Matola'],
        ],
        'servesCuisine'      => ['Cheesecake', 'Pastelaria Homemade'],
        'priceRange'         => '$$',
        'paymentAccepted'    => 'M-Pesa, Cash',
        'currenciesAccepted' => 'MZN',
        'hasDeliveryMethod'  => 'http://purl.org/goodrelations/v1#UPS',
        'potentialAction'    => [
            '@type'  => 'OrderAction',
            'target' => $siteUrl . '/menu',
        ],
        'sameAs'             => ['https://instagram.com/cheesemaniaa'],
    ]);
    @endphp
    <script type="application/ld+json">{!! $localBusiness !!}</script>

    {{-- hreflang --}}
    <link rel="alternate" hreflang="pt-MZ" href="{{ $siteUrl }}" />
    <link rel="alternate" hreflang="x-default" href="{{ $siteUrl }}" />

    {{-- FAQ structured data (local Q&A for homepage) --}}
    @php
    $faq = json_encode([
        '@context'   => 'https://schema.org',
        '@type'      => 'FAQPage',
        'mainEntity' => [
            [
                '@type'          => 'Question',
                'name'           => 'Fazem entrega de cheesecake em Maputo?',
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => 'Sim, entregamos cheesecakes Homemade em toda a cidade de Maputo e Matola. As encomendas devem ser feitas com pelo menos 24 horas de antecedência.'],
            ],
            [
                '@type'          => 'Question',
                'name'           => 'Como encomendar cheesecake em Maputo?',
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => 'Pode encomendar online em ' . $siteUrl . '/menu, escolher o seu cheesecake favorito e finalizar a encomenda. Aceitamos pagamento via M-Pesa.'],
            ],
            [
                '@type'          => 'Question',
                'name'           => 'Têm cheesecakes sem lactose em Maputo?',
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => 'Sim, temos cheesecakes sem lactose e opções fitness disponíveis. Todos os nossos produtos são feitos à mão em Maputo.'],
            ],
            [
                '@type'          => 'Question',
                'name'           => 'Aceitam pagamento via M-Pesa?',
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => 'Sim, aceitamos pagamento via M-Pesa e dinheiro na entrega.'],
            ],
        ],
    ]);
    @endphp
    <script type="application/ld+json">{!! $faq !!}</script>

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
        <p>Cheesemania — Cheesecakes Homemade feitos com amor em Maputo, Moçambique.
        Encomende online em <a href="{{ config('app.url') }}">{{ config('app.url') }}</a>.</p>
    </noscript>
</body>
</html>
