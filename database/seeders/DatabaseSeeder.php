<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $alice = User::factory()->create([
            'name' => 'Alice',
            'email' => 'alice@test.com',
            'password' => Hash::make('password'),
        ]);

        $bob = User::factory()->create([
            'name' => 'Bob',
            'email' => 'bob@test.com',
            'password' => Hash::make('password'),
        ]);

        User::factory()->create([
            'name' => 'Carol',
            'email' => 'carol@test.com',
            'password' => Hash::make('password'),
        ]);

        $roadmap = $alice->documents()->create([
            'title' => 'Project Roadmap',
            'content' => <<<'HTML'
                <h1>Project Roadmap</h1>
                <p>Here's where things stand for the <strong>Q3</strong> release.</p>
                <h2>Priorities</h2>
                <ul>
                    <li>Finish the onboarding flow</li>
                    <li>Ship the sharing permissions system</li>
                    <li>Write up the migration guide</li>
                </ul>
                <p>Let's keep the scope <strong>tight</strong> and avoid last-minute additions.</p>
                HTML,
        ]);

        $alice->documents()->create([
            'title' => 'Meeting Notes - Weekly Sync',
            'content' => <<<'HTML'
                <h1>Weekly Sync</h1>
                <p>Attendees: Alice, Bob, Carol.</p>
                <h2>Discussion</h2>
                <p>The team agreed the <strong>autosave</strong> behavior needs more testing before launch.</p>
                <ul>
                    <li>Bob to review the sharing permission edge cases</li>
                    <li>Carol to draft the import UI copy</li>
                    <li>Alice to finalize the document list layout</li>
                </ul>
                HTML,
        ]);

        $alice->documents()->create([
            'title' => 'Reading List',
            'content' => <<<'HTML'
                <h1>Reading List</h1>
                <p>A running list of articles worth revisiting, roughly <strong>ranked</strong> by usefulness.</p>
                <ul>
                    <li>Designing Data-Intensive Applications - ch. 5</li>
                    <li>A History of Rich Text Editors on the Web</li>
                    <li>Notes on CRDTs vs. Operational Transforms</li>
                </ul>
                HTML,
        ]);

        $roadmap->shares()->create([
            'user_id' => $bob->id,
            'permission' => 'edit',
        ]);
    }
}
