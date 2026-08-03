<?php

namespace App\Http\Controllers;

use App\Http\Requests\ShareDocumentRequest;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ShareController extends Controller
{
    /**
     * Share the document with another user, or update their permission if
     * a share already exists.
     */
    public function store(ShareDocumentRequest $request, Document $document): RedirectResponse
    {
        Gate::authorize('share', $document);

        $user = User::where('email', $request->validated('email'))->firstOrFail();

        $document->shares()->updateOrCreate(
            ['user_id' => $user->id],
            ['permission' => $request->validated('permission')],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document shared.')]);

        return back();
    }
}
