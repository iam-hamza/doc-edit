import { router } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import ImportController from '@/actions/App/Http/Controllers/ImportController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';

export default function ImportButton() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';

        if (!file) {
            return;
        }

        setProcessing(true);
        setError(undefined);

        router.post(
            ImportController.store.url(),
            { file },
            {
                forceFormData: true,
                onError: (errors) => setError(errors.file),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <input
                ref={inputRef}
                type="file"
                accept=".txt,.md"
                className="hidden"
                onChange={handleChange}
            />
            <Button
                type="button"
                variant="outline"
                disabled={processing}
                onClick={() => inputRef.current?.click()}
            >
                <Upload />
                {processing ? 'Importing...' : 'Import'}
            </Button>
            <InputError message={error} />
        </div>
    );
}
