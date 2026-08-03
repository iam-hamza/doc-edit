import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import Toolbar from '@/components/editor/Toolbar';

type DocumentEditorProps = {
    content: string;
    editable?: boolean;
    onChange?: (html: string) => void;
};

export default function DocumentEditor({
    content,
    editable = true,
    onChange,
}: DocumentEditorProps) {
    const editor = useEditor({
        // StarterKit ships its own Underline; disable it so our explicit
        // extension is the only one registered (avoids a duplicate-extension warning).
        extensions: [StarterKit.configure({ underline: false }), Underline],
        content,
        editable,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && editor.isEditable !== editable) {
            editor.setEditable(editable);
        }
    }, [editable, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="rounded-md border border-input">
            {editable && <Toolbar editor={editor} />}
            <EditorContent
                editor={editor}
                className="doc-editor-content min-h-64 px-3 py-2 focus:outline-none"
            />
        </div>
    );
}
