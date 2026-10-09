import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { withHardLineBreaks } from "@/lib/agent/markdown-breaks";
import { cleanChatContent } from "@/lib/ai-chat-copy";

// Markdown de las respuestas: sin HTML crudo (react-markdown no lo renderiza)
// y con tablas desplazables para que no desborden a 390px.
const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
  // start: un "2." después de otro bloque sigue numerando desde 2.
  ol: ({ start, children }) => (
    <ol start={start} className="mb-2 ml-4 list-decimal space-y-1">
      {children}
    </ol>
  ),
  h1: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1 mt-2 font-semibold">{children}</h4>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 pl-3 text-muted-foreground">{children}</blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{children}</code>,
  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-md bg-muted p-2 text-xs">{children}</pre>,
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto">
      <table className="w-full text-xs tabular-nums">{children}</table>
    </div>
  ),
  // style trae la alineación de la columna (|---:|) que marca GFM.
  th: ({ style, children }) => (
    <th style={style} className="border-b px-2 py-1 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ style, children }) => (
    <td style={style} className="border-b px-2 py-1 align-top">
      {children}
    </td>
  ),
  // "//dominio" no tiene protocolo pero es externo: no va por next/link.
  a: ({ href, children }) =>
    href?.startsWith("/") && !href.startsWith("//") ? (
      <Link href={href} className="text-primary underline underline-offset-4">
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
        {children}
      </a>
    ),
};

export function AgentMarkdown({ content }: { content: string }) {
  return (
    <div className="break-words text-[14.5px] leading-[1.6] text-pretty">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {withHardLineBreaks(cleanChatContent(content))}
      </ReactMarkdown>
    </div>
  );
}
