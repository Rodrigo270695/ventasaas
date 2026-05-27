<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StoreCertificateStorage
{
    public const DISK = 'certificates';

    private const DIRECTORY = 'store';

    public function store(UploadedFile $file, ?string $previousPath = null): string
    {
        $this->delete($previousPath);

        $extension = strtolower($file->getClientOriginalExtension() ?: 'pem');
        $filename = 'cert_'.Str::uuid()->toString().'.'.$extension;

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

    public function exists(?string $path): bool
    {
        return filled($path) && Storage::disk(self::DISK)->exists($path);
    }

    public function displayName(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        return basename($path);
    }

    public function absolutePath(?string $path): ?string
    {
        if (blank($path) || ! $this->exists($path)) {
            return null;
        }

        return Storage::disk(self::DISK)->path($path);
    }

    public function contents(?string $path): ?string
    {
        if (! $this->exists($path)) {
            return null;
        }

        return Storage::disk(self::DISK)->get($path);
    }
}
