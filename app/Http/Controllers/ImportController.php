<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportDocumentRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use League\CommonMark\CommonMarkConverter;

class ImportController extends Controller
{
    /**
     * Import a .txt or .md file as a new document owned by the current user.
     */
    public function store(ImportDocumentRequest $request): RedirectResponse
    {
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $title = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            abort(422, 'Unable to read the uploaded file.');
        }

        $content = $extension === 'md'
            ? (new CommonMarkConverter)->convert($contents)->getContent()
            : '<p>'.e($contents).'</p>';

        $document = auth()->user()->documents()->create([
            'title' => $title,
            'content' => $content,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document imported.')]);

        return to_route('documents.edit', $document);
    }
}
