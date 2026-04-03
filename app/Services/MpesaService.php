<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class MpesaService
{
    private const RESPONSE_CODE_SUCCESS = 'INS-0';
    private const RESPONSE_CODE_TIMEOUT = 'INS-9';
    private const RESPONSE_CODE_DUPLICATE = 'INS-10';

    private const SUCCESS_STATUSES = [
        'COMPLETED', 'COMPLETE', 'SUCCESS', 'SUCCEEDED', 'PROCESSED', 'INS-0',
    ];

    private const FAILED_STATUSES = [
        'FAILED', 'FAIL', 'CANCELLED', 'CANCELED', 'REVERSED', 'DECLINED', 'INS-996',
    ];

    private string $apiKey = '';
    private string $publicKeyStr = '';
    private string $baseUrl = '';
    private string $serviceProviderCode = '';
    private bool $verifySsl = true;
    private int $timeoutSeconds = 30;
    private int $connectTimeoutSeconds = 10;

    public function __construct()
    {
        $this->apiKey = (string) config('mpesa.api_key', '');
        $this->publicKeyStr = (string) config('mpesa.public_key', '');
        $this->baseUrl = (string) config('mpesa.base_url', '');
        $this->serviceProviderCode = (string) config('mpesa.service_provider_code', '');
        $this->verifySsl = (bool) config('mpesa.verify_ssl', true);
        $this->timeoutSeconds = max(5, (int) config('mpesa.timeout', 30));
        $this->connectTimeoutSeconds = max(3, (int) config('mpesa.connect_timeout', 10));
    }

    /**
     * Initiate a C2B Payment (Customer to Business)
     */
    public function initiatePayment(string $phoneNumber, float $amount, string $reference): array
    {
        $endpoint = '/ipg/v1x/c2bPayment/singleStage/';
        $url = rtrim($this->baseUrl, '/') . $endpoint;
        set_time_limit(max(60, $this->timeoutSeconds + 10));
        $bearerToken = $this->generateAuthorizationToken();

        if (!$bearerToken) {
            return [
                'success' => false,
                'message' => 'Serviço de pagamento indisponível no momento. Tente novamente em alguns minutos.',
            ];
        }

        $formattedAmount = (string) (int) $amount;
        $formattedPhone = $this->formatPhoneNumber($phoneNumber);
        $mpesaReference = preg_replace('/[^A-Za-z0-9]/', '', $reference);

        // input_TransactionReference must be unique per attempt to prevent INS-10 duplicate
        // errors on retries and second instalments. Append a 6-char timestamp suffix.
        // input_ThirdPartyReference stays as the clean order reference so callbacks can
        // find the order via Order::where('reference', ...).
        $uniqueTxRef = substr($mpesaReference, 0, 14) . substr((string) time(), -6);

        $payload = [
            'input_TransactionReference' => $uniqueTxRef,
            'input_CustomerMSISDN'       => $formattedPhone,
            'input_Amount'               => $formattedAmount,
            'input_ThirdPartyReference'  => $mpesaReference,
            'input_ServiceProviderCode'  => $this->serviceProviderCode,
        ];

        try {
            Log::info('Mpesa C2B request initiated.', [
                'reference_hash' => hash('sha256', $reference),
                'amount'         => $formattedAmount,
            ]);

            $result = $this->curlRequest('POST', $url, $bearerToken, $payload);

            Log::info('Mpesa C2B response received.', [
                'http_status'   => $result['status'],
                'response_code' => $result['body']['output_ResponseCode'] ?? null,
            ]);

            $data         = $result['body'];
            $responseCode = (string) ($data['output_ResponseCode'] ?? '');
            $transactionId = $this->normalizeTransactionId($data['output_TransactionID'] ?? null);

            if ($result['ok']) {
                if ($this->isSuccessfulResponseCode($responseCode)) {
                    return [
                        'success'        => true,
                        'data'           => $data,
                        'transaction_id' => $transactionId,
                        'response_code'  => $responseCode,
                    ];
                }

                return [
                    'success'        => false,
                    'message'        => $this->userMessageForResponse($responseCode, $data['output_ResponseDesc'] ?? null, 'payment'),
                    'response_code'  => $responseCode,
                    'data'           => $data,
                    'transaction_id' => $transactionId,
                ];
            }

            return [
                'success'        => false,
                'message'        => $this->userMessageForResponse($responseCode ?: null, $data['output_ResponseDesc'] ?? null, 'payment'),
                'response_code'  => $responseCode ?: null,
                'data'           => $data ?: null,
                'transaction_id' => $transactionId,
            ];
        } catch (\Exception $e) {
            Log::error('Mpesa Connection Error: ' . $e->getMessage());
            return [
                'success'           => false,
                'message'           => $this->humanizeTransportError($e->getMessage(), 'payment') ?? $this->defaultUserMessage('payment'),
                'technical_message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Query the status of a specific transaction
     */
    public function queryTransactionStatus(string $queryReference, string $thirdPartyReference): array
    {
        $queryParams = http_build_query([
            'input_ThirdPartyReference' => $thirdPartyReference,
            'input_QueryReference'      => $queryReference,
            'input_ServiceProviderCode' => $this->serviceProviderCode,
        ]);
        $url = rtrim($this->baseUrl, '/') . '/ipg/v1x/queryTransactionStatus/?' . $queryParams;
        $bearerToken = $this->generateAuthorizationToken();

        if (!$bearerToken) {
            return [
                'success' => false,
                'message' => 'Serviço de pagamento indisponível no momento. Tente novamente em alguns minutos.',
            ];
        }

        try {
            Log::info('Mpesa transaction status query initiated.', [
                'query_reference_hash' => hash('sha256', $queryReference),
            ]);

            $result = $this->curlRequest('GET', $url, $bearerToken);

            Log::info('Mpesa transaction status response received.', [
                'http_status'   => $result['status'],
                'response_code' => $result['body']['output_ResponseCode'] ?? null,
            ]);

            $data             = $result['body'];
            $responseCode     = (string) ($data['output_ResponseCode'] ?? '');
            $transactionStatus = $this->normalizeProviderStatus($data['output_ResponseTransactionStatus'] ?? null);

            if ($result['ok']) {
                if ($this->isSuccessfulResponseCode($responseCode)) {
                    return [
                        'success'       => true,
                        'data'          => $data,
                        'status'        => $transactionStatus,
                        'response_code' => $responseCode,
                    ];
                }

                return [
                    'success'       => false,
                    'message'       => $this->userMessageForResponse($responseCode, $data['output_ResponseDesc'] ?? null, 'query'),
                    'response_code' => $responseCode !== '' ? $responseCode : null,
                    'status'        => $transactionStatus !== '' ? $transactionStatus : null,
                    'data'          => $data,
                ];
            }

            return [
                'success'       => false,
                'message'       => $this->userMessageForResponse($responseCode ?: null, $data['output_ResponseDesc'] ?? null, 'query'),
                'response_code' => $responseCode ?: null,
                'status'        => $transactionStatus !== '' ? $transactionStatus : null,
                'data'          => $data ?: null,
            ];
        } catch (\Exception $e) {
            Log::error('Mpesa Query Error: ' . $e->getMessage());
            return [
                'success'           => false,
                'message'           => $this->humanizeTransportError($e->getMessage(), 'query') ?? $this->defaultUserMessage('query'),
                'technical_message' => $e->getMessage(),
            ];
        }
    }

    /** Returns null for "N/A" or empty transaction IDs M-Pesa sends on failure */
    public function normalizeTransactionId(?string $id): ?string
    {
        if ($id === null || trim($id) === '' || strtoupper(trim($id)) === 'N/A') {
            return null;
        }
        return $id;
    }

    public function normalizeProviderStatus(?string $status): string
    {
        return strtoupper(trim((string) $status));
    }

    public function isSuccessfulResponseCode(?string $responseCode): bool
    {
        return $this->normalizeProviderStatus($responseCode) === self::RESPONSE_CODE_SUCCESS;
    }

    public function isTimeoutResponseCode(?string $responseCode): bool
    {
        return $this->normalizeProviderStatus($responseCode) === self::RESPONSE_CODE_TIMEOUT;
    }

    public function isDuplicateResponseCode(?string $responseCode): bool
    {
        return $this->normalizeProviderStatus($responseCode) === self::RESPONSE_CODE_DUPLICATE;
    }

    public function isSuccessfulTransactionStatus(?string $status): bool
    {
        return in_array($this->normalizeProviderStatus($status), self::SUCCESS_STATUSES, true);
    }

    public function isFailedTransactionStatus(?string $status): bool
    {
        return in_array($this->normalizeProviderStatus($status), self::FAILED_STATUSES, true);
    }

    /**
     * Direct curl transport — bypasses Guzzle which cannot handle M-Pesa's TLS quirks.
     * Returns ['status' => int, 'body' => array, 'ok' => bool].
     *
     * The sandbox at api.sandbox.vm.co.mz:18352 is HTTPS-only; plain HTTP gets an
     * immediate TLS alert. curl's auto-negotiate also fails — pinning TLS 1.2 fixes it.
     */
    private function curlRequest(string $method, string $url, string $bearerToken, array $data = []): array
    {
        // Port 18352 is HTTPS-only — rejects plain HTTP with a TLS handshake alert.
        $url = str_replace('http://', 'https://', $url);

        $ch = curl_init($url);

        $verifySsl = $this->shouldVerifySsl();
        $opts = [
            CURLOPT_CUSTOMREQUEST  => strtoupper($method),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeoutSeconds,
            CURLOPT_CONNECTTIMEOUT => $this->connectTimeoutSeconds,
            CURLOPT_SSL_VERIFYPEER => $verifySsl ? 1 : 0,
            CURLOPT_SSL_VERIFYHOST => $verifySsl ? 2 : 0,
            // Auto-negotiate fails on this server; TLS 1.2 works reliably.
            CURLOPT_SSLVERSION     => CURL_SSLVERSION_TLSv1_2,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $bearerToken,
                'Content-Type: application/json',
                'Accept: application/json',
                'Origin: *',
            ],
        ];

        if (strtoupper($method) === 'POST' && !empty($data)) {
            $opts[CURLOPT_POSTFIELDS] = json_encode($data);
        }

        curl_setopt_array($ch, $opts);

        $body       = curl_exec($ch);
        $httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errno      = curl_errno($ch);
        $error      = curl_error($ch);
        curl_close($ch);

        if ($errno !== CURLE_OK) {
            throw new \RuntimeException("cURL error {$errno}: {$error} for {$url}");
        }

        $decoded = is_string($body) && $body !== '' ? (json_decode($body, true) ?? []) : [];
        $ok      = $httpStatus >= 200 && $httpStatus < 300;

        return ['status' => $httpStatus, 'body' => $decoded, 'ok' => $ok];
    }

    private function shouldVerifySsl(): bool
    {
        if (!$this->verifySsl) return false;
        if (str_contains(strtolower($this->baseUrl), 'sandbox.vm.co.mz')) return false;
        return true;
    }

    /**
     * Encrypts the API Key using the Public Key to create the Bearer token
     */
    private function generateAuthorizationToken(): ?string
    {
        try {
            $cleanKey = trim(str_replace(
                ['-----BEGIN PUBLIC KEY-----', '-----END PUBLIC KEY-----', "\n", "\r", " "],
                '',
                $this->publicKeyStr
            ));

            $formattedKey = "-----BEGIN PUBLIC KEY-----\n" .
                wordwrap($cleanKey, 64, "\n", true) .
                "\n-----END PUBLIC KEY-----";

            $publicKeyResource = openssl_get_publickey($formattedKey);
            if (!$publicKeyResource) {
                Log::error('Mpesa Token Error: Invalid Public Key format.');
                return null;
            }

            $encrypted = '';
            $success = openssl_public_encrypt($this->apiKey, $encrypted, $publicKeyResource, OPENSSL_PKCS1_PADDING);

            if ($success) {
                return base64_encode($encrypted);
            }

            Log::error('Mpesa Token Error: OpenSSL encryption failed: ' . openssl_error_string());
            return null;
        } catch (\Exception $e) {
            Log::error('Mpesa Token Gen Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Ensure phone number is in 258xxxxxxxxx format
     */
    private function formatPhoneNumber(string $number): string
    {
        $number = preg_replace('/[^0-9]/', '', $number);

        if (strlen($number) === 9) {
            return '258' . $number;
        }

        return $number;
    }

    private function defaultUserMessage(string $context): string
    {
        return match ($context) {
            'query'    => 'Não foi possível confirmar o estado do pagamento neste momento.',
            'reversal' => 'Não foi possível processar a reversão neste momento.',
            default    => 'Não foi possível processar o pagamento M-Pesa agora. Tente novamente em alguns minutos.',
        };
    }

    private function looksTechnicalError(string $message): bool
    {
        return (bool) preg_match('/curl|openssl|ssl|certificate|exception|stack trace|gateway error|http \d{3}/i', $message);
    }

    private function humanizeTransportError(string $technicalMessage, string $context = 'payment'): ?string
    {
        $message = strtolower($technicalMessage);

        if (str_contains($message, 'ssl certificate') || str_contains($message, 'self-signed') || str_contains($message, 'openssl verify')) {
            return 'Não foi possível validar a ligação segura com o serviço de pagamento. Tente novamente em instantes.';
        }

        if (str_contains($message, 'curl error 28') || str_contains($message, 'timed out') || str_contains($message, 'request timeout')) {
            return $context === 'query'
                ? 'A confirmação do pagamento está a demorar mais que o esperado. Tente novamente em alguns minutos.'
                : 'A ligação ao M-Pesa está lenta neste momento. Tente novamente em alguns minutos.';
        }

        if (str_contains($message, 'could not resolve host') || str_contains($message, 'connection refused') || str_contains($message, 'failed to connect')) {
            return 'Não foi possível ligar ao serviço M-Pesa neste momento. Tente novamente em alguns minutos.';
        }

        return null;
    }

    private function userMessageForResponse(?string $responseCode, ?string $providerMessage, string $context = 'payment'): string
    {
        $code = $this->normalizeProviderStatus($responseCode);

        $mappedByCode = match ($code) {
            'INS-2'    => 'Não foi possível autenticar o serviço de pagamento. Tente novamente em alguns minutos.',
            'INS-9'    => 'A confirmação do pagamento está a demorar. Se já inseriu o PIN, aguarde alguns minutos.',
            'INS-10'   => 'Já existe um pedido de pagamento em processamento para este número. Confirme no telemóvel e aguarde.',
            'INS-15'   => 'O valor do pagamento é inválido. Tente novamente.',
            'INS-2051' => 'Número M-Pesa inválido. Verifique o número e tente novamente.',
            'INS-2006' => 'Saldo insuficiente na conta M-Pesa.',
            'INS-996'  => 'A transação foi cancelada pelo operador.',
            default    => null,
        };

        if ($mappedByCode !== null) return $mappedByCode;

        if (is_string($providerMessage) && trim($providerMessage) !== '') {
            $fromTransport = $this->humanizeTransportError($providerMessage, $context);
            if ($fromTransport !== null) return $fromTransport;
            if (!$this->looksTechnicalError($providerMessage)) return trim($providerMessage);
        }

        return $this->defaultUserMessage($context);
    }
}
