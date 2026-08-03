<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentSharingTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Document $document;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();

        $this->document = $this->owner->documents()->create([
            'title' => 'Roadmap',
            'content' => '<p>Content</p>',
        ]);
    }

    public function test_owner_can_share_document_with_another_user(): void
    {
        $recipient = User::factory()->create();

        $response = $this->actingAs($this->owner)->post(route('documents.share', $this->document), [
            'email' => $recipient->email,
            'permission' => 'edit',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('document_shares', [
            'document_id' => $this->document->id,
            'user_id' => $recipient->id,
            'permission' => 'edit',
        ]);
    }

    public function test_sharing_with_a_nonexistent_email_fails_validation(): void
    {
        $response = $this->actingAs($this->owner)->post(route('documents.share', $this->document), [
            'email' => 'nobody@example.com',
            'permission' => 'view',
        ]);

        $response->assertSessionHasErrors(['email' => 'No user found with that email.']);

        $this->assertDatabaseCount('document_shares', 0);
    }

    public function test_owner_cannot_share_document_with_themselves(): void
    {
        $response = $this->actingAs($this->owner)->post(route('documents.share', $this->document), [
            'email' => $this->owner->email,
            'permission' => 'edit',
        ]);

        $response->assertSessionHasErrors('email');

        $this->assertDatabaseCount('document_shares', 0);
    }

    public function test_resharing_updates_the_existing_share_instead_of_duplicating(): void
    {
        $recipient = User::factory()->create();

        $this->document->shares()->create([
            'user_id' => $recipient->id,
            'permission' => 'view',
        ]);

        $response = $this->actingAs($this->owner)->post(route('documents.share', $this->document), [
            'email' => $recipient->email,
            'permission' => 'edit',
        ]);

        $response->assertSessionHasNoErrors();

        $this->assertDatabaseCount('document_shares', 1);
        $this->assertDatabaseHas('document_shares', [
            'document_id' => $this->document->id,
            'user_id' => $recipient->id,
            'permission' => 'edit',
        ]);
    }
}
