<?php

namespace App\Services\ElectronicBilling;

use App\Models\ElectronicDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ElectronicDocumentStorage
{
    public const DISK = 'electronic_documents';

    public function storeXml(ElectronicDocument $electronic, string $xml): string
    {
        $path = $this->basePath($electronic).'/signed.xml';
        Storage::disk(self::DISK)->put($path, $xml);

        return $path;
    }

    public function storeCdrZip(ElectronicDocument $electronic, string $zipBinary): string
    {
        $path = $this->basePath($electronic).'/cdr.zip';
        Storage::disk(self::DISK)->put($path, $zipBinary);

        return $path;
    }

    private function basePath(ElectronicDocument $electronic): string
    {
        return 'cpe/'.Str::slug($electronic->id);
    }
}
