<?php

return [
    'api_key'               => env('MPESA_API_KEY'),
    'public_key'            => env('MPESA_PUBLIC_KEY'),
    'base_url'              => env('MPESA_BASE_URL', 'http://api.sandbox.vm.co.mz:18352'),
    'service_provider_code' => env('MPESA_SERVICE_PROVIDER_CODE', '171717'),
    'verify_ssl'            => env('MPESA_VERIFY_SSL', env('APP_ENV') === 'production'),
    'timeout'               => env('MPESA_TIMEOUT', 30),
    'connect_timeout'       => env('MPESA_CONNECT_TIMEOUT', 10),

    // Secret token appended to the callback URL as ?secret=xxx.
    // Set MPESA_CALLBACK_SECRET in .env and register the full URL with M-Pesa.
    // Leave empty to skip verification (not recommended for production).
    'callback_secret' => env('MPESA_CALLBACK_SECRET'),
];
