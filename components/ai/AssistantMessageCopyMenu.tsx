"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getChatCopyPayload, type CopyFormat } from "@/lib/ai-chat-copy";
import { toast } from "sonner";
import { Check, Copy, Mail, MessageCircle, MoreHorizontal } from "lucide-react";

const COPY_OPTIONS: Array<{
    format: CopyFormat;
    label: string;
    successMessage: string;
    icon: typeof MessageCircle;
}> = [
    {
        format: "whatsapp",
        label: "Copiar formato WhatsApp",
        successMessage: "Copiado en formato WhatsApp",
        icon: MessageCircle,
    },
    {
        format: "email",
        label: "Copiar formato email",
        successMessage: "Copiado en formato email",
        icon: Mail,
    },
    {
        format: "markdown",
        label: "Copiar formato Markdown",
        successMessage: "Copiado en formato Markdown",
        icon: Copy,
    },
];

export function AssistantMessageCopyMenu({ content }: { content: string }) {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = async (format: CopyFormat, successMessage: string) => {
        try {
            const payload = getChatCopyPayload(content, format);

            if (payload.html && typeof ClipboardItem !== "undefined") {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        "text/plain": new Blob([payload.text], { type: "text/plain" }),
                        "text/html": new Blob([payload.html], { type: "text/html" }),
                    }),
                ]);
            } else {
                await navigator.clipboard.writeText(payload.text);
            }

            setIsCopied(true);
            toast.success(successMessage);
            window.setTimeout(() => setIsCopied(false), 2000);
        } catch {
            toast.error("Error al copiar");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                    title="Opciones de copiado"
                >
                    {isCopied ? <Check className="h-3 w-3" /> : <MoreHorizontal className="h-3 w-3" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {COPY_OPTIONS.map(({ format, icon: Icon, label, successMessage }) => (
                    <DropdownMenuItem
                        key={format}
                        onClick={() => copyToClipboard(format, successMessage)}
                    >
                        <Icon className="mr-2 h-4 w-4" />
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
