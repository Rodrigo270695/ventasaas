<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StoreCoverStorage
{
    public const DISK = 'public';

    private const DIRECTORY = 'covers';

    public function store(UploadedFile $file, ?string $previousPath = null): string
    {
        $this->delete($previousPath);

        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = Str::uuid()->toString().'.'.$extension;

        return $file->storeAs(self::DIRECTORY, $filename, self::DISK);
    }

    public function delete(?string $path): void
    {
        if (blank($path)) {
            return;
        }

        if (Storage::disk(self::DISK)->exists($path)) {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    public function url(?string $path): ?string
    {
        if (blank($path) || ! Storage::disk(self::DISK)->exists($path)) {
            return null;
        }

        return '/storage/'.ltrim(str_replace('\\', '/', $path), '/');
    }
}
