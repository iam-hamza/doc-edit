<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class DocumentImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_importing_a_markdown_file_converts_it_to_html(): void
    {
        $user = User::factory()->create();

        $markdown = <<<'MD'
            # My Notes

            Some **intro** text.

            - First item
            - Second item
            MD;

        $file = UploadedFile::fake()->createWithContent('notes.md', $markdown);

        $response = $this->actingAs($user)->post(route('documents.import'), [
            'file' => $file,
        ]);

        $response->assertSessionHasNoErrors();

        $document = Document::where('title', 'notes')->firstOrFail();

        $response->assertRedirect(route('documents.edit', $document));
        $this->assertSame($user->id, $document->owner_id);

        $this->assertStringContainsString('<h1>My Notes</h1>', $document->content);
        $this->assertStringContainsString('<strong>intro</strong>', $document->content);
        $this->assertStringContainsString('<ul>', $document->content);
        $this->assertStringContainsString('<li>First item</li>', $document->content);
        $this->assertStringContainsString('<li>Second item</li>', $document->content);
    }

    public function test_importing_a_txt_file_escapes_html_and_wraps_it_in_a_paragraph(): void
    {
        $user = User::factory()->create();

        $file = UploadedFile::fake()->createWithContent('plain.txt', 'Hello <script>alert(1)</script> world');

        $this->actingAs($user)->post(route('documents.import'), [
            'file' => $file,
        ]);

        $document = Document::where('title', 'plain')->firstOrFail();

        $this->assertSame(
            '<p>Hello &lt;script&gt;alert(1)&lt;/script&gt; world</p>',
            $document->content,
        );
    }

    public function test_importing_a_file_with_a_disallowed_extension_fails_validation(): void
    {
        $user = User::factory()->create();

        $file = UploadedFile::fake()->create('resume.pdf', 10);

        $response = $this->actingAs($user)->post(route('documents.import'), [
            'file' => $file,
        ]);

        $response->assertSessionHasErrors('file');
        $this->assertDatabaseCount('documents', 0);
    }
}
