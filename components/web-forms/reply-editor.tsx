"use client";

import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect, useRef, type MouseEvent } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REPLY_FONT_SIZES, textToReplyDoc } from "@/lib/web-forms/reply-doc";
import { looksLikeMarkdown, markdownToReplyDoc } from "@/lib/web-forms/reply-markdown";
import { cn } from "@/lib/utils";

// Solo lo que el correo sabe mostrar (reply-doc.ts): párrafos, listas,
// negrita, cursiva y tamaño. Lo pegado con títulos o citas queda como
// párrafos.
const EXTENSIONS = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    link: false,
    strike: false,
    underline: false,
  }),
  TextStyle,
  FontSize,
];

export const editorText = (editor: Editor) => editor.getText({ blockSeparator: "\n" });

export const resetEditor = (editor: Editor, text: string) => {
  editor.commands.setContent(textToReplyDoc(text) as JSONContent);
  editor.commands.focus("end");
};

// La respuesta que escribe el agente (fillWebFormReply), en Markdown.
export const setEditorMarkdown = (editor: Editor, markdown: string) => {
  editor.commands.setContent(markdownToReplyDoc(markdown) as JSONContent, { emitUpdate: true });
};

// Lo pegado desde un correo o desde "Copiar como email" del agente: los
// párrafos y listas tienen margen al verse, así que van separados por una
// línea vacía, como en el editor. Lo copiado del mismo editor queda igual.
const SPACED = new Set(["P", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "TABLE"]);

const spacePastedBlocks = (html: string) => {
  if (html.includes("data-pm-slice") || typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  let container: Element = doc.body;
  while (container.children.length === 1 && container.firstElementChild?.tagName === "DIV") {
    container = container.firstElementChild;
  }
  const blocks = [...container.children];
  blocks.forEach((block, index) => {
    const next = blocks[index + 1];
    if (next && SPACED.has(block.tagName) && SPACED.has(next.tagName)) block.after(doc.createElement("p"));
  });
  return container.innerHTML;
};

const TOOL =
  "inline-flex size-11 items-center justify-center rounded-md text-ops-text-muted transition-colors hover:bg-ops-surface-muted aria-pressed:bg-ops-bamboo-soft aria-pressed:text-ops-bamboo-strong sm:size-8";

// Los botones no le sacan el foco al editor: la selección queda donde estaba.
const keepFocus = (event: MouseEvent) => event.preventDefault();

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
      size: REPLY_FONT_SIZES.find((size) => size.css === (current.getAttributes("textStyle").fontSize ?? null))?.id ?? "normal",
    }),
  });

  const setSize = (id: string) => {
    const css = REPLY_FONT_SIZES.find((size) => size.id === id)?.css ?? null;
    const chain = editor.chain().focus();
    (css ? chain.setFontSize(css) : chain.unsetFontSize()).run();
  };

  return (
    <div className="flex items-center gap-1 border-b border-ops-border px-1.5 py-1" role="toolbar" aria-label="Formato del mensaje">
      <button type="button" className={TOOL} onMouseDown={keepFocus} aria-pressed={state.bold} aria-label="Negrita (Ctrl+B)" title="Negrita (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-4" aria-hidden />
      </button>
      <button type="button" className={TOOL} onMouseDown={keepFocus} aria-pressed={state.italic} aria-label="Cursiva (Ctrl+I)" title="Cursiva (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-4" aria-hidden />
      </button>
      <button type="button" className={TOOL} onMouseDown={keepFocus} aria-pressed={state.bulletList} aria-label="Lista con viñetas" title="Lista con viñetas" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="size-4" aria-hidden />
      </button>
      <button type="button" className={TOOL} onMouseDown={keepFocus} aria-pressed={state.orderedList} aria-label="Lista numerada" title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="size-4" aria-hidden />
      </button>
      <span className="mx-1 h-5 w-px bg-ops-border" aria-hidden />
      <Select value={state.size} onValueChange={setSize}>
        <SelectTrigger size="sm" className="h-11 min-w-28 border-0 shadow-none sm:h-8" aria-label="Tamaño del texto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REPLY_FONT_SIZES.map((size) => (
            <SelectItem key={size.id} value={size.id}>
              <span style={size.css ? { fontSize: size.css } : undefined}>{size.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// El campo Mensaje de la respuesta. El composer lee el documento al mandar
// (editor.getJSON()) y el texto en cada cambio, para habilitar Enviar.
export function ReplyEditor({
  initialText,
  labelId,
  onReady,
  onTextChange,
}: {
  initialText: string;
  labelId: string;
  onReady: (editor: Editor) => void;
  onTextChange: (text: string) => void;
}) {
  const editorRef = useRef<Editor | null>(null);
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: textToReplyDoc(initialText) as JSONContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-labelledby": labelId,
        "aria-multiline": "true",
        role: "textbox",
        class:
          "min-h-40 max-h-[45vh] overflow-y-auto px-3 py-2 text-[15px] leading-relaxed text-ops-text outline-none [&_p]:m-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
      },
      transformPastedHTML: spacePastedBlocks,
      // Texto sin HTML que trae Markdown ("Copiar como Markdown"): con formato.
      handlePaste: (_view, event) => {
        const data = event.clipboardData;
        const text = data?.getData("text/plain") ?? "";
        if (!editorRef.current || data?.getData("text/html") || !looksLikeMarkdown(text)) return false;
        editorRef.current.commands.insertContent(markdownToReplyDoc(text).content as JSONContent[]);
        return true;
      },
    },
    onUpdate: ({ editor: current }) => onTextChange(editorText(current)),
  });

  useEffect(() => {
    editorRef.current = editor;
    if (editor) onReady(editor);
  }, [editor, onReady]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30"
      )}
    >
      {editor ? <Toolbar editor={editor} /> : <div className="h-[45px] border-b border-ops-border sm:h-[41px]" aria-hidden />}
      {editor ? <EditorContent editor={editor} /> : <div className="min-h-40" aria-hidden />}
    </div>
  );
}
