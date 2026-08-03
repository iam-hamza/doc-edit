<?php

namespace App\Http\Requests;

use App\Models\Document;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ShareDocumentRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'email',
                'exists:users,email',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    /** @var Document $document */
                    $document = $this->route('document');
                    $user = User::where('email', $value)->first();

                    if ($user && $user->id === $document->owner_id) {
                        $fail('You cannot share a document with its own owner.');
                    }
                },
            ],
            'permission' => ['required', Rule::in(['view', 'edit'])],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.exists' => 'No user found with that email.',
        ];
    }
}
