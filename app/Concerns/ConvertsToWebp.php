<?php

namespace App\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

trait ConvertsToWebp
{
    /**
     * Convert an uploaded image to WebP and store it on the public disk.
     * Returns the relative path (e.g. "products/1/abc123.webp").
     */
    protected function storeAsWebp(UploadedFile $file, string $directory): string
    {
        $manager = new ImageManager(new GdDriver());
        $encoded = $manager->decode($file->getRealPath())->encode(new WebpEncoder(85));
        $filename = pathinfo($file->hashName(), PATHINFO_FILENAME) . '.webp';
        $path = "{$directory}/{$filename}";
        Storage::disk('public')->put($path, $encoded);

        return $path;
    }
}
