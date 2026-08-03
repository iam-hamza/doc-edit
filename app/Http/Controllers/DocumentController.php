<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    /**
     * Display the current user's owned and shared documents.
     */
    public function index(): Response
    {
        $user = auth()->user();

        $owned = $user->documents()->latest('updated_at')->get()->map(fn (Document $document) => [
            'id' => $document->id,
            'title' => $document->title,
            'updated_at_diff' => $document->updated_at->diffForHumans(),
        ]);

        $shared = $user->sharedDocuments()
            ->with('document')
            ->get()
            ->sortByDesc(fn ($share) => $share->document->updated_at)
            ->values()
            ->map(fn ($share) => [
                'id' => $share->document->id,
                'title' => $share->document->title,
                'updated_at_diff' => $share->document->updated_at->diffForHumans(),
                'permission' => $share->permission,
            ]);

        return Inertia::render('documents/index', [
            'owned' => $owned,
            'shared' => $shared,
        ]);
    }

    /**
     * Create a new document owned by the current user.
     */
    public function store(StoreDocumentRequest $request): RedirectResponse
    {
        $document = auth()->user()->documents()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document created.')]);

        return to_route('documents.edit', $document);
    }

    /**
     * Show the document editor.
     */
    public function edit(Document $document): Response
    {
        Gate::authorize('view', $document);

        $user = auth()->user();

        return Inertia::render('documents/edit', [
            'document' => $document,
            'can' => [
                'update' => $user->can('update', $document),
            ],
            'isOwner' => $document->owner_id === $user->id,
        ]);
    }

    /**
     * Update the document's title and content.
     */
    public function update(UpdateDocumentRequest $request, Document $document): RedirectResponse
    {
        Gate::authorize('update', $document);

        $document->update($request->validated());

        if (! $request->boolean('silent')) {
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Document saved.')]);
        }

        return back();
    }

    /**
     * Delete the document. Ownership is required, not merely edit access.
     */
    public function destroy(Document $document): RedirectResponse
    {
        abort_unless($document->owner_id === auth()->id(), 403);

        $document->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document deleted.')]);

        return to_route('documents.index');
    }
}
