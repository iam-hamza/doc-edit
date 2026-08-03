<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentPolicyTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $viewSharee;

    private User $editSharee;

    private User $unrelatedUser;

    private Document $document;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->viewSharee = User::factory()->create();
        $this->editSharee = User::factory()->create();
        $this->unrelatedUser = User::factory()->create();

        $this->document = $this->owner->documents()->create([
            'title' => 'Shared Document',
            'content' => '<p>Content</p>',
        ]);

        $this->document->shares()->create([
            'user_id' => $this->viewSharee->id,
            'permission' => 'view',
        ]);

        $this->document->shares()->create([
            'user_id' => $this->editSharee->id,
            'permission' => 'edit',
        ]);
    }

    public function test_owner_can_view_update_and_share(): void
    {
        $this->assertTrue($this->owner->can('view', $this->document));
        $this->assertTrue($this->owner->can('update', $this->document));
        $this->assertTrue($this->owner->can('share', $this->document));
    }

    public function test_view_sharee_can_only_view(): void
    {
        $this->assertTrue($this->viewSharee->can('view', $this->document));
        $this->assertFalse($this->viewSharee->can('update', $this->document));
        $this->assertFalse($this->viewSharee->can('share', $this->document));
    }

    public function test_edit_sharee_can_view_and_update_but_not_share(): void
    {
        $this->assertTrue($this->editSharee->can('view', $this->document));
        $this->assertTrue($this->editSharee->can('update', $this->document));
        $this->assertFalse($this->editSharee->can('share', $this->document));
    }

    public function test_unrelated_user_can_do_nothing(): void
    {
        $this->assertFalse($this->unrelatedUser->can('view', $this->document));
        $this->assertFalse($this->unrelatedUser->can('update', $this->document));
        $this->assertFalse($this->unrelatedUser->can('share', $this->document));
    }
}
