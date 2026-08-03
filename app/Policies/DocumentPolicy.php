<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Determine whether the user can view the document.
     */
    public function view(User $user, Document $document): bool
    {
        if ($document->owner_id === $user->id) {
            return true;
        }

        return $document->shares()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine whether the user can update the document.
     */
    public function update(User $user, Document $document): bool
    {
        if ($document->owner_id === $user->id) {
            return true;
        }

        return $document->shares()->where('user_id', $user->id)->where('permission', 'edit')->exists();
    }

    /**
     * Determine whether the user can share the document with others.
     */
    public function share(User $user, Document $document): bool
    {
        return $document->owner_id === $user->id;
    }
}
