import { Head } from '@inertiajs/react';
import { FileStack, Users } from 'lucide-react';
import DocumentRow from '@/components/document-row';
import Heading from '@/components/heading';
import ImportButton from '@/components/import-button';
import NewDocumentDialog from '@/components/new-document-dialog';
import documents from '@/routes/documents';

interface DocumentSummary {
    id: number;
    title: string;
    updated_at_diff: string;
}

interface SharedDocumentSummary extends DocumentSummary {
    permission: 'view' | 'edit';
}

interface DocumentsIndexProps {
    owned: DocumentSummary[];
    shared: SharedDocumentSummary[];
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof FileStack;
    title: string;
    description: string;
}) {
    return (
        <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Icon className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

export default function DocumentsIndex({ owned, shared }: DocumentsIndexProps) {
    return (
        <>
            <Head title="Documents" />

            <div className="space-y-8 p-4">
                <div className="flex items-center justify-between gap-4">
                    <Heading
                        title="Documents"
                        description="Create, edit, and share your documents."
                    />
                    <div className="flex items-center gap-2">
                        <ImportButton />
                        <NewDocumentDialog />
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        My documents
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-border">
                        {owned.length > 0 ? (
                            owned.map((document) => (
                                <DocumentRow
                                    key={document.id}
                                    id={document.id}
                                    title={document.title}
                                    updatedAtDiff={document.updated_at_diff}
                                    canDelete
                                />
                            ))
                        ) : (
                            <EmptyState
                                icon={FileStack}
                                title="No documents yet"
                                description="Create your first document to get started"
                            />
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Shared with me
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-border">
                        {shared.length > 0 ? (
                            shared.map((document) => (
                                <DocumentRow
                                    key={document.id}
                                    id={document.id}
                                    title={document.title}
                                    updatedAtDiff={document.updated_at_diff}
                                    permission={document.permission}
                                />
                            ))
                        ) : (
                            <EmptyState
                                icon={Users}
                                title="Nothing shared with you"
                                description="Documents other people share with you will show up here"
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

DocumentsIndex.layout = {
    breadcrumbs: [{ title: 'Documents', href: documents.index() }],
};
