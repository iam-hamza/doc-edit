import { Head, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import DocumentEditor from '@/components/editor/DocumentEditor';
import ShareDialog from '@/components/share-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAutosave } from '@/hooks/use-autosave';
import documents from '@/routes/documents';

interface DocumentProp {
    id: number;
    title: string;
    content: string | null;
    updated_at: string;
}

interface DocumentEditProps {
    document: DocumentProp;
    can: {
        update: boolean;
    };
    isOwner: boolean;
}

export default function DocumentEdit({
    document,
    can,
    isOwner,
}: DocumentEditProps) {
    const [title, setTitle] = useState(document.title);
    const [content, setContent] = useState(document.content ?? '');
    const [processing, setProcessing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useAutosave(documents.update.url(document.id), title, content, can.update);

    const submit = (e: FormEvent) => {
        e.preventDefault();

        setProcessing(true);
        router.put(
            documents.update.url(document.id),
            { title, content },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(documents.destroy.url(document.id));
    };

    return (
        <>
            <Head title={document.title} />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    {!can.update && (
                        <Badge variant="secondary" className="capitalize">
                            View only
                        </Badge>
                    )}

                    {isOwner && (
                        <div className="ml-auto flex items-center gap-2">
                            <ShareDialog documentId={document.id} />

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>Delete document</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete &quot;
                                        {document.title}&quot;? This cannot be
                                        undone.
                                    </DialogDescription>
                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button variant="secondary">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting
                                                ? 'Deleting...'
                                                : 'Delete'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="document-title">Title</Label>
                        <Input
                            id="document-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={!can.update}
                            className="text-lg font-medium"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Content</Label>
                        <DocumentEditor
                            content={document.content ?? ''}
                            editable={can.update}
                            onChange={setContent}
                        />
                    </div>

                    {can.update && (
                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
}

DocumentEdit.layout = (page: DocumentEditProps) => ({
    breadcrumbs: [
        { title: 'Documents', href: documents.index() },
        { title: page.document.title, href: documents.edit(page.document.id) },
    ],
});
