<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockedDate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlockedDateController extends Controller
{
    public function index(): JsonResponse
    {
        $dates = BlockedDate::orderBy('date')->get(['id', 'date', 'reason']);

        return response()->json(['data' => $dates]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dates'    => ['required', 'array', 'min:1'],
            'dates.*'  => ['required', 'string', 'date_format:Y-m-d', 'distinct'],
            'reason'   => ['nullable', 'string', 'max:255'],
        ]);

        foreach ($data['dates'] as $dateStr) {
            BlockedDate::firstOrCreate(
                ['date' => $dateStr],
                ['reason' => $data['reason'] ?? null]
            );
        }

        return $this->index();
    }

    public function destroy(BlockedDate $blockedDate): JsonResponse
    {
        $blockedDate->delete();

        return response()->json(null, 204);
    }
}
