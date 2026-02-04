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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Bot, Send, MessageCircle, Plus, X, LogOut, Save, History, Search, MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { submitChat } from "@/actions/ai-chat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { saveChat, getChats, renameChat, deleteChat } from "@/actions/save-chat";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AIButton } from "@/components/budgets/create-budget/AiButton";
import DeleteDialog from "@/components/ui/delete-dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const cleanContent = (content: string) => {
    const codeBlockRegex = /^```(?:markdown)?\s*([\s\S]*?)\s*```$/i;
    const match = content.match(codeBlockRegex);
    return match ? match[1] : content;
};

interface AIChatProps {
    contextData: any;
    trigger?: React.ReactNode;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface SavedChat {
    id: string;
    createdAt: Date;
    messages: { role: string; content: string }[];
    name?: string;
}

export function AIChat({ contextData, trigger }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isChatSaved, setIsChatSaved] = useState(true);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // History State
    const [historyOpen, setHistoryOpen] = useState(false);
    const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
    const [filteredChats, setFilteredChats] = useState<SavedChat[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Menu Actions State
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameChatId, setRenameChatId] = useState<string | null>(null);
    const [renameName, setRenameName] = useState('');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteChatId, setDeleteChatId] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryOpen(true);
        const budgetId = contextData?.slug || contextData?.id ? (contextData.id || undefined) : undefined;
        const result = await getChats(budgetId);
        if (result.success && result.chats) {
            const mappedChats = result.chats.map((c: any) => ({
                id: c.id,
                createdAt: new Date(c.createdAt),
                messages: c.messages,
                name: c.name
            }));
            setSavedChats(mappedChats);
            setFilteredChats(mappedChats);
        } else {
            toast.error("Error al cargar el historial");
        }
        setIsLoadingHistory(false);
    };

    useEffect(() => {
        if (!searchQuery) {
            setFilteredChats(savedChats);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            setFilteredChats(savedChats.filter(chat =>
                (chat.name?.toLowerCase().includes(lowerQuery)) ||
                format(chat.createdAt, "d MMM yyyy", { locale: es }).toLowerCase().includes(lowerQuery)
            ));
        }
    }, [searchQuery, savedChats]);

    const loadChat = (chat: SavedChat) => {
        setMessages(chat.messages as Message[]);
        setIsChatSaved(true);
        setHistoryOpen(false);
        toast.success("Chat cargado");
    };

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

    const handleRenameClick = (chat: SavedChat) => {
        setRenameChatId(chat.id);
        setRenameName(chat.name || "");
        setRenameDialogOpen(true);
    };

    const handleDeleteClick = (chat: SavedChat) => {
        setDeleteChatId(chat.id);
        setDeleteDialogOpen(true);
    };

    const handleRenameSubmit = async () => {
        if (!renameChatId) return;
        const result = await renameChat(renameChatId, renameName);
        if (result.success) {
            toast.success("Chat renombrado");
            setRenameDialogOpen(false);
            loadHistory();
        } else {
            toast.error("Error al renombrar");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteChatId) return;
        const result = await deleteChat(deleteChatId);
        if (result.success) {
            toast.success("Chat eliminado");
            setDeleteDialogOpen(false);
            loadHistory();
        } else {
            toast.error("Error al eliminar");
        }
    };

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

            const rawName = contextData.name || "Nuevo presupuesto";
            const chatName = rawName.length > 25 ? rawName.substring(0, 25) + "..." : rawName;

            const result = await saveChat(messages, budgetId, chatName);

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
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    {trigger ? trigger : (
                        <div className="fixed bottom-10 left-0 right-0 mx-auto w-fit z-50">
                            <AIButton className="rounded-full px-6 py-3 h-auto text-lg hover:scale-105 transition-transform" />
                        </div>
                    )}
                </SheetTrigger>
                <SheetContent className="w-full sm:w-[600px] sm:max-w-[600px] flex flex-col h-full bg-background/95 backdrop-blur-supports-[backdrop-filter]:bg-background/60 [&>button]:hidden">
                    <SheetHeader className="flex flex-row items-center justify-between">
                        <div className='flex items-center gap-2 flex-row'>
                            <Button variant="ghost" size="icon" title="Cerrar chat" onClick={() => { setOpen(false) }}>
                                <LogOut className="h-5 rotate-180 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Historial" onClick={loadHistory}>
                                <History className="h-5 w-5" />
                            </Button>
                            <SheetTitle>Asistente de presupuestos</SheetTitle></div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant={messages.length > 0 ? "default" : "ghost"}
                                size="icon"
                                title="Guardar chat"
                                onClick={handleSave}
                                disabled={messages.length === 0}
                            >
                                <Save className="h-5 w-5" />
                            </Button>
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
                        </div>
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
                                                : "bg-muted text-foreground rounded-tl-none"
                                        )}
                                    >
                                        {m.role === 'assistant' ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word leading-relaxed">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
                                                        ul: ({ children }: any) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                                                        ol: ({ children }: any) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                                                        li: ({ children }: any) => <li>{children}</li>,
                                                        strong: ({ children }: any) => <span className="font-bold text-primary">{children}</span>,
                                                        h1: ({ children }: any) => <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>,
                                                        h2: ({ children }: any) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
                                                        h3: ({ children }: any) => <h3 className="text-base font-bold mb-1 mt-2">{children}</h3>,
                                                    }}
                                                >
                                                    {cleanContent(m.content)}
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

            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="sm:max-w-[425px] h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" /> Historial de Chats
                        </DialogTitle>
                        <DialogDescription className="hidden">Historial de conversaciones guardadas</DialogDescription>
                    </DialogHeader>

                    <div className="p-4 border-b bg-muted/30">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar chat..."
                                className="pl-9 bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoadingHistory ? (
                            <div className="flex justify-center p-8 text-muted-foreground">
                                <span className="animate-pulse">Cargando...</span>
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground flex flex-col items-center gap-2">
                                <History className="h-10 w-10 opacity-20" />
                                <p>No se encontraron chats.</p>
                            </div>
                        ) : (
                            filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => loadChat(chat)}
                                    role="button"
                                    className="w-full text-left p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all flex flex-col gap-1 group relative pr-12 cursor-pointer"
                                >
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRenameClick(chat);
                                                }}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Renombrar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    loadChat(chat);
                                                }}>
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    Abrir chat
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(chat);
                                                    }}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="font-medium group-hover:text-primary transition-colors truncate w-full">
                                        {chat.name || "Sin nombre"}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex justify-between items-center w-full">
                                        <span>{format(chat.createdAt, "d MMM yyyy, HH:mm", { locale: es })}</span>
                                        <span className="bg-muted px-2 py-0.5 rounded-full text-[10px]">{chat.messages.length} msjs</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Renombrar Chat</DialogTitle>
                        <DialogDescription>
                            Cambia el nombre de este chat para identificarlo mejor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                            placeholder="Nombre del chat"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRenameSubmit}>Guardar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar chat?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Se perderán todos los mensajes de este chat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>Eliminar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
