import { Mark, mergeAttributes } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect, useMemo, useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import DOMPurify from 'dompurify';

const RedactMark = Mark.create({
  name: 'redact',
  parseHTML() {
    return [{ tag: 'mark[data-redacted]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes, {
      'data-redacted': 'true',
      class: 'bg-black text-transparent select-none print:bg-black print:text-transparent rounded-sm px-1'
    }), 0];
  },
});

interface RichTextEditorProps {
  id?: string;
  content: string;
  onChange: (html: string) => void;
  className?: string;
}

export default function RichTextEditor({ id, content, onChange, className = '' }: RichTextEditorProps) {
  const { setIsDirty, redactMode } = useResumeStore();
  
  const [hasSelection, setHasSelection] = useState(false);

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: false,
      bulletList: false,
      orderedList: false,
      codeBlock: false,
      blockquote: false,
    }),
    Underline,
    RedactMark,
  ], []);

  const editor = useEditor({
    extensions,
    content: DOMPurify.sanitize(content || ''),
    editable: !redactMode, 
    editorProps: {
      attributes: {
        id: id || '', 
        class: 'focus:outline-none w-full h-full min-h-[1em]',
      },
    },
    onUpdate: ({ editor }) => {
      setIsDirty(true);
      onChange(DOMPurify.sanitize(editor.getHTML()));
    },
    onSelectionUpdate: ({ editor }) => {
      setHasSelection(!editor.state.selection.empty);
    }
  });
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHTML = editor.getHTML();
      const incomingCleanHTML = DOMPurify.sanitize(content);
      
      if (currentHTML !== incomingCleanHTML) {
        const { from, to } = editor.state.selection;
        editor.commands.setContent(incomingCleanHTML);
        editor.commands.setTextSelection({ from, to });
      }
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!redactMode);
    }
  }, [redactMode, editor]);

  if (!editor) return null;

  return (
    <div className="relative">
    
      {redactMode && hasSelection && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // Crucial: prevents the text selection from clearing
              editor.chain().focus().toggleMark('redact').run();
              setIsDirty(true);
              onChange(DOMPurify.sanitize(editor.getHTML()));
            }}
            className="bg-black hover:bg-zinc-800 text-white px-3 py-1 rounded shadow-xl text-xs font-bold tracking-widest border border-zinc-700"
          >
            ⬛ REDACT
          </button>
        </div>
      )}
      
      <EditorContent editor={editor} className={className} />
    </div>
  );
}