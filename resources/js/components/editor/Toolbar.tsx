import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import {
    Bold,
    Heading2,
    Heading3,
    Italic,
    List,
    ListOrdered,
    Underline as UnderlineIcon,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';

type ToolbarProps = {
    editor: Editor;
};

export default function Toolbar({ editor }: ToolbarProps) {
    // Tiptap v3 no longer re-renders on every transaction by default, so active
    // state has to be derived through useEditorState to stay in sync with the cursor.
    const state = useEditorState({
        editor,
        selector: ({ editor }) => ({
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            underline: editor.isActive('underline'),
            heading2: editor.isActive('heading', { level: 2 }),
            heading3: editor.isActive('heading', { level: 3 }),
            bulletList: editor.isActive('bulletList'),
            orderedList: editor.isActive('orderedList'),
        }),
    });

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-input p-1.5">
            <Toggle
                size="sm"
                pressed={state.bold}
                onPressedChange={() =>
                    editor.chain().focus().toggleBold().run()
                }
                aria-label="Bold"
            >
                <Bold />
            </Toggle>
            <Toggle
                size="sm"
                pressed={state.italic}
                onPressedChange={() =>
                    editor.chain().focus().toggleItalic().run()
                }
                aria-label="Italic"
            >
                <Italic />
            </Toggle>
            <Toggle
                size="sm"
                pressed={state.underline}
                onPressedChange={() =>
                    editor.chain().focus().toggleUnderline().run()
                }
                aria-label="Underline"
            >
                <UnderlineIcon />
            </Toggle>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Toggle
                size="sm"
                pressed={state.heading2}
                onPressedChange={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                aria-label="Heading 2"
            >
                <Heading2 />
            </Toggle>
            <Toggle
                size="sm"
                pressed={state.heading3}
                onPressedChange={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                aria-label="Heading 3"
            >
                <Heading3 />
            </Toggle>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Toggle
                size="sm"
                pressed={state.bulletList}
                onPressedChange={() =>
                    editor.chain().focus().toggleBulletList().run()
                }
                aria-label="Bullet list"
            >
                <List />
            </Toggle>
            <Toggle
                size="sm"
                pressed={state.orderedList}
                onPressedChange={() =>
                    editor.chain().focus().toggleOrderedList().run()
                }
                aria-label="Numbered list"
            >
                <ListOrdered />
            </Toggle>
        </div>
    );
}
