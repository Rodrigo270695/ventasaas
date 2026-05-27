<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OnboardingTourController extends Controller
{
    public function completeLayoutTour(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user && ! $user->layout_tour_completed_at) {
            $user->update([
                'layout_tour_completed_at' => now(),
            ]);
        }

        return back();
    }

    public function completePageTour(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tour_id' => ['required', 'string', 'max:120'],
        ]);

        $user = $request->user();

        if (! $user) {
            return back();
        }

        $completed = $user->completed_page_tours ?? [];

        if (! in_array($validated['tour_id'], $completed, true)) {
            $completed[] = $validated['tour_id'];
            $user->update(['completed_page_tours' => array_values($completed)]);
        }

        return back();
    }
}
