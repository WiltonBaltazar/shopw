<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'min:7', 'max:30'],
        ]);

        $phone = $this->normalizePhone($data['phone']);

        $customer = Customer::firstOrCreate(['phone' => $phone]);
        $customer->update(['last_login_at' => now()]);

        // Keep one active token per customer for this no-password flow.
        $customer->tokens()->delete();
        $token = $customer->createToken('customer-web')->plainTextToken;

        return response()->json([
            'data' => [
                'phone' => $customer->phone,
                'token' => $token,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $customer = $request->user();
        if (! $customer instanceof Customer) {
            return response()->json(['message' => 'Não autenticado.'], 401);
        }

        return response()->json([
            'data' => [
                'phone' => $customer->phone,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $customer = $request->user();
        if ($customer instanceof Customer && $customer->currentAccessToken()) {
            $customer->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Sessão terminada.']);
    }

    private function normalizePhone(string $raw): string
    {
        $digits = preg_replace('/\D/', '', $raw) ?? '';

        if (strlen($digits) === 12 && str_starts_with($digits, '258')) {
            return $digits;
        }

        if (strlen($digits) === 10 && str_starts_with($digits, '0')) {
            return '258' . substr($digits, 1);
        }

        if (strlen($digits) === 9) {
            return '258' . $digits;
        }

        return $digits;
    }
}

