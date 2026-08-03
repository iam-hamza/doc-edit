import { Link, router } from '@inertiajs/react';
import { FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import documents from '@/routes/documents';

type DocumentRowProps = {
    id: number;
    title: string;
    updatedAtDiff: string;
    permission?: 'view' | 'edit';
    canDelete?: boolean;
};

export default function DocumentRow({
    id,
    title,
    updatedAtDiff,
    permission,
    canDelete = false,
}: DocumentRowProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(documents.destroy.url(id), {
            preserveScroll: true,
            onError: () => setIsDeleting(false),
        });
    };

    return (
        <div className="flex items-center justify-between gap-4 border-b p-4 last:border-b-0">
            <Link
                href={documents.edit(id)}
                className="flex min-w-0 flex-1 items-center gap-4"
            >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2.5">
                        <p className="truncate font-medium tracking-tight">
                            {title}
                        </p>
                        {permission && (
                            <Badge
                                variant={
                                    permission === 'edit'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className="capitalize"
                            >
                                {permission}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Updated {updatedAtDiff}
                    </p>
                </div>
            </Link>

            {canDelete && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Delete document</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{title}&quot;?
                            This cannot be undone.
                        </DialogDescription>
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
