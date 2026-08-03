import { router } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import ShareController from '@/actions/App/Http/Controllers/ShareController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type ShareDialogProps = {
    documentId: number;
};

type ShareErrors = {
    email?: string;
    permission?: string;
};

export default function ShareDialog({ documentId }: ShareDialogProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<'view' | 'edit'>('view');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<ShareErrors>({});

    const reset = () => {
        setEmail('');
        setPermission('view');
        setErrors({});
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        setProcessing(true);
        setErrors({});

        router.post(
            ShareController.store.url(documentId),
            { email, permission },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                onError: (formErrors) => setErrors(formErrors as ShareErrors),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next) {
                    reset();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <UserPlus />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Share document</DialogTitle>
                        <DialogDescription>
                            Invite another user to view or edit this document.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="share-email">Email</Label>
                            <Input
                                id="share-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                placeholder="teammate@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="share-permission">Permission</Label>
                            <Select
                                value={permission}
                                onValueChange={(value) =>
                                    setPermission(value as 'view' | 'edit')
                                }
                            >
                                <SelectTrigger
                                    id="share-permission"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">View</SelectItem>
                                    <SelectItem value="edit">Edit</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.permission} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Sharing...' : 'Share'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
