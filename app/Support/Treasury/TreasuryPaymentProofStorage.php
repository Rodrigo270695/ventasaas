<?php

namespace App\Support\Treasury;

use App\Models\TreasuryPayment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TreasuryPaymentProofStorage
{
    public function store(TreasuryPayment $payment, UploadedFile $file): void
    {
        if ($payment->proof_file_path) {
            Storage::disk('local')->delete($payment->proof_file_path);
        }

        $path = $file->store("treasury-payments/{$payment->id}", 'local');

        $payment->update([
            'proof_file_path' => $path,
            'proof_file_name' => $file->getClientOriginalName(),
        ]);
    }
}
