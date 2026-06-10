import { Mark, mergeAttributes } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { memo, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
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
      class: 'bg-black text-black select-none cursor-pointer print:bg-black print:text-black rounded-sm px-0.5',
    }), 0];
  },
});

const BLOCK = '\u2588';
const blocksFor = (text: string): string => {
  const len = text.replace(/\s+/g, '').length;
  return BLOCK.repeat(Math.min(Math.max(len, 2), 60));
};

const maskRedactedHTML = (html: string): string => {
  if (typeof document === 'undefined') return html;
  if (html.indexOf('data-redacted') === -1) return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  const marks = div.querySelectorAll('mark[data-redacted]');
  marks.forEach((m) => { m.textContent = blocksFor(m.textContent || ''); });
  return div.innerHTML;
};

interface RichTextEditorProps {
  id?: string;
  content: string;
  onChange: (html: string) => void;
  previewMode: boolean;
  className?: string;
}

function RichTextEditor({ id, content, onChange, previewMode, className = '' }: RichTextEditorProps) {
  const redactMode = useResumeStore((s) => s.redactMode);
  const setIsDirty = useResumeStore((s) => s.setIsDirty);

  const [hasSelection, setHasSelection] = useState(false);
  const lastEmitted = useRef<string>(DOMPurify.sanitize(content || ''));

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: false,
      bulletList: false,
      orderedList: false,
      codeBlock: false,
      blockquote: false,
    }),
    RedactMark,
  ], []);

  const editor = useEditor({
    extensions,
    content: DOMPurify.sanitize(content || ''),
    editable: !redactMode,
    immediatelyRender: true,
    editorProps: {
      attributes: {
        id: id || '',
        class: 'focus:outline-none w-full h-full min-h-[1em]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = DOMPurify.sanitize(editor.getHTML());
      lastEmitted.current = html;
      setIsDirty(true);
      onChange(html);
    },
    onSelectionUpdate: ({ editor }) => {
      setHasSelection(!editor.state.selection.empty);
    },
    onBlur: () => setHasSelection(false),
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = DOMPurify.sanitize(content || '');
    if (incoming === lastEmitted.current) return; 
    if (incoming === editor.getHTML()) return;   
    const { from, to } = editor.state.selection;
    editor.commands.setContent(incoming, { emitUpdate: false } as any);
    const size = editor.state.doc.content.size;
    editor.commands.setTextSelection({ from: Math.min(from, size), to: Math.min(to, size) });
    lastEmitted.current = incoming;
  }, [content, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!redactMode);
  }, [redactMode, editor]);

  if (!editor) return null;

  const applyRedaction = () => {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selected = editor.state.doc.textBetween(from, to, ' ');
    if (!selected.trim()) return;
    const wasEditable = editor.isEditable;
    if (!wasEditable) editor.setEditable(true);
    editor.chain().focus().setTextSelection({ from, to }).setMark('redact').run();
    if (!wasEditable) editor.setEditable(false);
    const html = DOMPurify.sanitize(editor.getHTML());
    lastEmitted.current = html;
    setIsDirty(true);
    onChange(html);
    setHasSelection(false);
  };

  const handleRestoreClick = (e: MouseEvent) => {
    if (!redactMode) return; // restore is a redact-mode action
    const target = (e.target as HTMLElement)?.closest?.('mark[data-redacted]') as HTMLElement | null;
    if (!target) return;
    const start = editor.view.posAtDOM(target, 0);
    const end = start + (target.textContent?.length ?? 0);
    if (start < 0 || end <= start) return;
    const wasEditable = editor.isEditable;
    if (!wasEditable) editor.setEditable(true);
    editor.chain().focus().setTextSelection({ from: start, to: end }).unsetMark('redact').run();
    if (!wasEditable) editor.setEditable(false);
    const html = DOMPurify.sanitize(editor.getHTML());
    lastEmitted.current = html;
    setIsDirty(true);
    onChange(html);
    setHasSelection(false);
  };

  if (previewMode) {
    const masked = DOMPurify.sanitize(maskRedactedHTML(DOMPurify.sanitize(content || '')));
    return (
      <div className="relative w-full">
        <div className={className} dangerouslySetInnerHTML={{ __html: masked }} />
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      onClickCapture={handleRestoreClick}
      onMouseDown={() => {
        if (editor.isEmpty && !editor.isFocused) editor.commands.focus();
      }}
    >
      {redactMode && hasSelection && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-100 print:hidden">
          <button
            onMouseDown={(e) => { e.preventDefault(); applyRedaction(); }}
            className="bg-black hover:bg-zinc-800 text-white px-3 py-1 rounded shadow-xl text-xs font-bold tracking-widest border border-zinc-700"
            title="Mask the selected text (click the black bar later to restore it)"
          >
            ⬛ MASK SELECTION
          </button>
        </div>
      )}
      <EditorContent editor={editor} className={className} />
    </div>
  );
}

export default memo(RichTextEditor, (prev, next) =>
  prev.id === next.id &&
  prev.content === next.content &&
  prev.previewMode === next.previewMode &&
  prev.className === next.className,
);