<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateMpesaCallback
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = config('mpesa.callback_secret');

        if ($secret && $request->query('secret') !== $secret) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
