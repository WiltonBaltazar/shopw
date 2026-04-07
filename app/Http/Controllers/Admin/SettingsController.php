<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\ConvertsToWebp;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    use ConvertsToWebp;

    private const EDITABLE_KEYS = [
        'whatsapp_number',
        'pay_on_delivery_enabled',
        'seo_site_name',
        'seo_home_title',
        'seo_home_description',
        'seo_menu_title',
        'seo_menu_description',
        'seo_og_image',
        'favicon_url',
        'brand_logo_url',
        'footer_logo_url',
        'hero_tagline',
        'hero_heading',
        'hero_subheading',
        'hero_cta_text',
        'hero_image_url',
        'theme_primary_color',
        'blocked_weekdays',
        'delivery_start_hour',
        'delivery_end_hour',
        'social_instagram',
        'social_tiktok',
        'social_facebook',
        'social_twitter',
        'social_youtube',
        'social_linkedin',
        'social_whatsapp',
        'store_currency',
        'store_phone',
        'store_address',
        'store_city',
        'store_country',
        'store_business_type',
    ];

    public function index(): JsonResponse
    {
        $settings = [];
        foreach (self::EDITABLE_KEYS as $key) {
            $value = Setting::get($key);
            if ($key === 'pay_on_delivery_enabled') {
                $settings[$key] = $this->toBool($value, false);
                continue;
            }
            $settings[$key] = $value;
        }

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'whatsapp_number'      => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^[0-9]*$/'],
            'pay_on_delivery_enabled' => ['sometimes', 'boolean'],
            'seo_site_name'        => ['sometimes', 'nullable', 'string', 'max:100'],
            'seo_home_title'       => ['sometimes', 'nullable', 'string', 'max:120'],
            'seo_home_description' => ['sometimes', 'nullable', 'string', 'max:300'],
            'seo_menu_title'       => ['sometimes', 'nullable', 'string', 'max:120'],
            'seo_menu_description' => ['sometimes', 'nullable', 'string', 'max:300'],
            'seo_og_image'         => ['sometimes', 'nullable', 'string', 'max:500'],
            'favicon_url'          => ['sometimes', 'nullable', 'string', 'max:500'],
            'brand_logo_url'       => ['sometimes', 'nullable', 'string', 'max:500'],
            'footer_logo_url'      => ['sometimes', 'nullable', 'string', 'max:500'],
            'hero_tagline'         => ['sometimes', 'nullable', 'string', 'max:200'],
            'hero_heading'         => ['sometimes', 'nullable', 'string', 'max:200'],
            'hero_subheading'      => ['sometimes', 'nullable', 'string', 'max:500'],
            'hero_cta_text'        => ['sometimes', 'nullable', 'string', 'max:80'],
            'hero_image_url'       => ['sometimes', 'nullable', 'string', 'max:500'],
            'theme_primary_color'  => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'blocked_weekdays'     => ['sometimes', 'nullable', 'json'],
            'delivery_start_hour'  => ['sometimes', 'nullable', 'integer', 'min:0', 'max:23'],
            'delivery_end_hour'    => ['sometimes', 'nullable', 'integer', 'min:0', 'max:23'],
            'social_instagram'     => ['sometimes', 'nullable', 'string', 'max:500'],
            'social_tiktok'        => ['sometimes', 'nullable', 'string', 'max:500'],
            'social_facebook'      => ['sometimes', 'nullable', 'string', 'max:500'],
            'social_twitter'       => ['sometimes', 'nullable', 'string', 'max:500'],
            'social_youtube'       => ['sometimes', 'nullable', 'string', 'max:500'],
            'social_linkedin'      => ['sometimes', 'nullable', 'string', 'max:500'],
            'social_whatsapp'      => ['sometimes', 'nullable', 'string', 'max:500'],
            'store_currency'       => ['sometimes', 'nullable', 'string', 'max:10'],
            'store_phone'          => ['sometimes', 'nullable', 'string', 'max:30'],
            'store_address'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'store_city'           => ['sometimes', 'nullable', 'string', 'max:100'],
            'store_country'        => ['sometimes', 'nullable', 'string', 'max:100'],
            'store_business_type'  => ['sometimes', 'nullable', 'string', 'max:60'],
        ]);

        foreach ($data as $key => $value) {
            if (in_array($key, self::EDITABLE_KEYS)) {
                if ($key === 'pay_on_delivery_enabled') {
                    Setting::set($key, $value ? '1' : '0');
                    continue;
                }
                Setting::set($key, $value);
            }
        }

        return $this->index();
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'max:5120'],
            'key'   => ['required', 'string', 'in:brand_logo_url,footer_logo_url,seo_og_image,hero_image_url,favicon_url'],
        ]);

        $key = $request->input('key');

        if ($key === 'favicon_url') {
            $request->validate([
                'image' => ['required', 'file', 'max:1024', 'mimes:ico,png,svg,webp,jpg,jpeg'],
            ]);
        } else {
            $request->validate([
                'image' => ['required', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:5120'],
            ]);
        }

        // Delete old file if it was one we uploaded (path starts with settings/)
        $old = Setting::get($key);
        if ($old) {
            $parsed = parse_url($old, PHP_URL_PATH);
            $relative = ltrim(str_replace('/storage/', '', $parsed ?? ''), '/');
            if (str_starts_with($relative, 'settings/')) {
                Storage::disk('public')->delete($relative);
            }
        }

        $path = $key === 'favicon_url'
            ? $request->file('image')->store('settings', 'public')
            : $this->storeAsWebp($request->file('image'), 'settings');
        $url  = asset('storage/' . $path);
        Setting::set($key, $url);

        return response()->json(['url' => $url]);
    }

    private function toBool(mixed $value, bool $default = false): bool
    {
        if ($value === null || $value === '') {
            return $default;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        $normalized = strtolower(trim((string) $value));
        if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
            return true;
        }
        if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
            return false;
        }

        return $default;
    }
}
