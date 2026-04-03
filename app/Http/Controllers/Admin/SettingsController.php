<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    private const EDITABLE_KEYS = [
        'whatsapp_number',
        'seo_site_name',
        'seo_home_title',
        'seo_home_description',
        'seo_menu_title',
        'seo_menu_description',
        'seo_og_image',
        'favicon_url',
        'brand_logo_url',
        'hero_tagline',
        'hero_heading',
        'hero_subheading',
        'hero_cta_text',
        'hero_image_url',
        'theme_primary_color',
        'blocked_weekdays',
        'delivery_start_hour',
        'delivery_end_hour',
    ];

    public function index(): JsonResponse
    {
        $settings = [];
        foreach (self::EDITABLE_KEYS as $key) {
            $settings[$key] = Setting::get($key);
        }

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'whatsapp_number'      => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^[0-9]*$/'],
            'seo_site_name'        => ['sometimes', 'nullable', 'string', 'max:100'],
            'seo_home_title'       => ['sometimes', 'nullable', 'string', 'max:120'],
            'seo_home_description' => ['sometimes', 'nullable', 'string', 'max:300'],
            'seo_menu_title'       => ['sometimes', 'nullable', 'string', 'max:120'],
            'seo_menu_description' => ['sometimes', 'nullable', 'string', 'max:300'],
            'seo_og_image'         => ['sometimes', 'nullable', 'string', 'max:500'],
            'favicon_url'          => ['sometimes', 'nullable', 'string', 'max:500'],
            'brand_logo_url'       => ['sometimes', 'nullable', 'string', 'max:500'],
            'hero_tagline'         => ['sometimes', 'nullable', 'string', 'max:200'],
            'hero_heading'         => ['sometimes', 'nullable', 'string', 'max:200'],
            'hero_subheading'      => ['sometimes', 'nullable', 'string', 'max:500'],
            'hero_cta_text'        => ['sometimes', 'nullable', 'string', 'max:80'],
            'hero_image_url'       => ['sometimes', 'nullable', 'string', 'max:500'],
            'theme_primary_color'  => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'blocked_weekdays'     => ['sometimes', 'nullable', 'json'],
            'delivery_start_hour'  => ['sometimes', 'nullable', 'integer', 'min:0', 'max:23'],
            'delivery_end_hour'    => ['sometimes', 'nullable', 'integer', 'min:0', 'max:23'],
        ]);

        foreach ($data as $key => $value) {
            if (in_array($key, self::EDITABLE_KEYS)) {
                Setting::set($key, $value);
            }
        }

        return $this->index();
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'max:5120'],
            'key'   => ['required', 'string', 'in:brand_logo_url,seo_og_image,hero_image_url,favicon_url'],
        ]);

        $key = $request->input('key');

        if ($key === 'favicon_url') {
            $request->validate([
                'image' => ['required', 'file', 'max:1024', 'mimes:ico,png,svg,webp,jpg,jpeg'],
            ]);
        } else {
            $request->validate([
                'image' => ['required', 'image', 'max:5120'],
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

        $path = $request->file('image')->store('settings', 'public');
        $url  = asset('storage/' . $path);
        Setting::set($key, $url);

        return response()->json(['url' => $url]);
    }
}
