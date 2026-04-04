<?php

namespace App\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;

trait ConvertsToWebp
{
    /**
     * Convert an uploaded image to WebP and store it on the public disk.
     * Returns the relative path (e.g. "products/1/abc123.webp").
     */
    protected function storeAsWebp(UploadedFile $file, string $directory): string
    {
        $manager = ImageManager::gd();
        $encoded = $manager->read($file->getRealPath())->toWebp(85);
        $filename = pathinfo($file->hashName(), PATHINFO_FILENAME) . '.webp';
        $path = "{$directory}/{$filename}";
        Storage::disk('public')->put($path, $encoded);

        return $path;
    }
}
