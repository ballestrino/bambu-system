'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Bot, Send, MessageCircle, Plus, X, LogOut } from "lucide-react";
import { submitChat } from "@/actions/ai-chat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { saveChat } from "@/actions/save-chat";
import { AIButton } from "@/components/budgets/create-budget/AiButton";
import DeleteDialog from "@/components/ui/delete-dialog";
import ReactMarkdown from 'react-markdown';

interface AIChatProps {
    contextData: any;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function AIChat({ contextData }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isChatSaved, setIsChatSaved] = useState(true);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setIsChatSaved(false);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare messages for API (exclude local-only props if any)
            const apiMessages = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));

            const response = await submitChat(apiMessages, contextData);

            if (response.message) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: response.message.content || "No pude generar una respuesta."
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else if (response.error) {
                console.error(response.error);
                // Optionally show error toast
            }
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSave = async () => {
        if (messages.length === 0) return;

        const toastId = toast.loading("Guardando chat...");
        try {
            // budget.id might be available in contextData depending on where we are
            // For 'create', it might be missing. For 'edit', it should be there.
            const budgetId = contextData?.slug || contextData?.id ? (contextData.id || undefined) : undefined;
            // Note: contextData in 'create' is form data, likely no ID. In 'view', it's the budget object with ID.
            // If we rely on slug to find ID in server, we might need to adjust. 
            // But existing budget object passed to 'BudgetDetails' should have ID.

            const result = await saveChat(messages, budgetId);

            if (result.success) {
                toast.success("Chat guardado correctamente", { id: toastId });
                setIsChatSaved(true);
            } else {
                toast.error("Error al guardar el chat", { id: toastId });
            }
        } catch (error) {
            toast.error("Error inesperado", { id: toastId });
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <div className="fixed bottom-10 left-0 right-0 mx-auto w-fit z-50">
                    <AIButton className="rounded-full px-6 py-3 h-auto text-lg hover:scale-105 transition-transform" />
                </div>
            </SheetTrigger>
            <SheetContent className="w-full sm:w-[600px] sm:max-w-[600px] flex flex-col h-full bg-background/95 backdrop-blur-supports-[backdrop-filter]:bg-background/60 [&>button]:hidden">
                <SheetHeader className="flex flex-row items-center justify-between">
                    <div className='flex items-center gap-2 flex-row'>
                        <Button variant="ghost" size="icon" title="Cerrar chat" onClick={() => { setOpen(false) }}>
                            <LogOut className="h-5 rotate-180 w-5" />
                        </Button>
                        <SheetTitle>Asistente de presupuestos</SheetTitle></div>
                    {messages.length > 0 && !isChatSaved ? (
                        <DeleteDialog
                            title="¿Iniciar nuevo chat?"
                            description="Si inicias un nuevo chat, la conversación actual se perderá. ¿Deseas continuar?"
                            deleteButtonText="Continuar"
                            deleteButtonVariant="destructive"
                            onConfirm={async () => {
                                setMessages([]);
                                setIsChatSaved(true);
                                toast.success("Nuevo chat iniciado");
                            }}
                            trigger={
                                <Button variant="ghost" size="icon" title="Nuevo Chat">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            }
                        />
                    ) : (
                        <Button variant="ghost" disabled={messages.length === 0} size="icon" onClick={() => {
                            setMessages([]);
                            setIsChatSaved(true);
                            toast.success("Nuevo chat iniciado");
                        }} title="Nuevo Chat">
                            <Plus className="h-5 w-5" />
                        </Button>
                    )}
                </SheetHeader>

                <div className="flex-1 flex flex-col mt-4 overflow-hidden text-sm">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-50">
                                <MessageCircle className="h-12 w-12" />
                                <p className="text-center">¡Hola! Soy tu asistente.<br />Pídeme que redacte un correo o un WhatsApp para este presupuesto.</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex w-full items-start gap-2 animate-in fade-in slide-in-from-bottom-2",
                                    m.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {m.role === 'assistant' && (
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                        <Bot className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "rounded-2xl px-3 py-3 max-w-[90%] text-base",
                                        m.role === 'user'
                                            ? "bg-primary text-primary-foreground ml-auto rounded-br-none"
                                            : "bg-gray-200/60 text-foreground rounded-tl-none"
                                    )}
                                >
                                    {m.role === 'assistant' ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word leading-relaxed">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
                                                    ul: ({ children }: any) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                                                    ol: ({ children }: any) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                                                    li: ({ children }: any) => <li>{children}</li>,
                                                    strong: ({ children }: any) => <span className="font-bold text-primary">{children}</span>,
                                                }}
                                            >
                                                {m.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-muted-foreground p-2 text-xs ml-12">
                                <Bot className="h-4 w-4 animate-bounce" />
                                Escribiendo...
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 pb-4 px-2 md:px-4">
                    <form onSubmit={handleSubmit} className="flex gap-2 relative items-center bg-muted/30 border border-input rounded-3xl px-2 py-2 focus-within:ring-2 focus-within:ring-ring/20 transition-all hover:bg-muted/50">
                        <Input
                            placeholder="Escribe un mensaje a la IA..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent px-4 h-10"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                            className="h-10 w-10 rounded-full shrink-0 transition-transform active:scale-95"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
