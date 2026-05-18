export type CopyFormat = "whatsapp" | "email" | "markdown";

const normalizeText = (content: string) =>
    content
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .trim();

export const cleanChatContent = (content: string) => {
    const codeBlockRegex = /^```(?:markdown)?\s*([\s\S]*?)\s*```$/i;
    const match = content.match(codeBlockRegex);
    return normalizeText(match ? match[1] : content);
};

const replaceMarkdownLinks = (content: string) =>
    content
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, url: string) =>
            alt ? `${alt}: ${url}` : url
        )
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2");

const formatForWhatsApp = (content: string) =>
    replaceMarkdownLinks(content)
        .replace(/^#{1,6}\s+(.*)$/gm, "*$1*")
        .replace(/\*\*(.*?)\*\*/g, "*$1*")
        .replace(/__(.*?)__/g, "*$1*")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/^>\s?/gm, "")
        .replace(/^[-*+]\s+/gm, "- ");

const formatForEmail = (content: string) =>
    replaceMarkdownLinks(content)
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/^>\s?/gm, "")
        .replace(/^[-*+]\s+/gm, "- ");

const escapeHtml = (content: string) =>
    content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const formatInlineEmailHtml = (content: string) =>
    escapeHtml(content)
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, url: string) =>
            alt ? `${alt}: <a href="${url}">${url}</a>` : `<a href="${url}">${url}</a>`
        )
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.*?)__/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");

const formatEmailBlockHtml = (block: string) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

    if (lines.length === 0) {
        return "";
    }

    if (lines.every((line) => /^[-*+]\s+/.test(line))) {
        const items = lines
            .map((line) => line.replace(/^[-*+]\s+/, ""))
            .map((line) => `<li>${formatInlineEmailHtml(line)}</li>`)
            .join("");
        return `<ul>${items}</ul>`;
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        const items = lines
            .map((line) => line.replace(/^\d+\.\s+/, ""))
            .map((line) => `<li>${formatInlineEmailHtml(line)}</li>`)
            .join("");
        return `<ol>${items}</ol>`;
    }

    const html = lines.map((line) => {
        const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
        if (headingMatch) {
            return `<strong>${formatInlineEmailHtml(headingMatch[1])}</strong>`;
        }
        return formatInlineEmailHtml(line.replace(/^>\s?/, ""));
    }).join("<br />");

    return `<p>${html}</p>`;
};

const formatForEmailHtml = (content: string) =>
    content
        .split(/\n\s*\n/)
        .map((block) => formatEmailBlockHtml(block))
        .filter(Boolean)
        .join("");

export const getChatCopyPayload = (content: string, format: CopyFormat) => {
    const text = formatChatCopy(content, format);

    if (format !== "email") {
        return { text };
    }

    return {
        text,
        html: formatForEmailHtml(cleanChatContent(content)),
    };
};

export const formatChatCopy = (content: string, format: CopyFormat) => {
    const cleaned = cleanChatContent(content);

    if (format === "markdown") {
        return cleaned;
    }

    if (format === "whatsapp") {
        return formatForWhatsApp(cleaned);
    }

    return formatForEmail(cleaned);
};
