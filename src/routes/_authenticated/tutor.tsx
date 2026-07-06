import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listThreads, createThread, deleteThread, renameThread,
  listMessages, sendChatMessage,
} from "@/lib/ai-tutor.functions";
import { listDocuments } from "@/lib/documents.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Bot, Plus, Send, Trash2, Search, User, Loader2, Sparkles, FileStack, MessageSquare,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — StudyPlanner" }] }),
  component: TutorPage,
});

const QUICK_PROMPTS = [
  "Explain OOP with real-world examples",
  "Important questions for DBMS (BSc CSIT)",
  "Solve: Find the derivative of x²sin(x)",
  "Create a 7-day revision plan for NEB Physics",
  "Summarize DBMS normalization (1NF to BCNF)",
  "Give me 10 MCQs on Computer Networks",
];

function TutorPage() {
  const qc = useQueryClient();
  const fnList = useServerFn(listThreads);
  const fnCreate = useServerFn(createThread);
  const fnDelete = useServerFn(deleteThread);
  const fnRename = useServerFn(renameThread);
  const fnMessages = useServerFn(listMessages);
  const fnSend = useServerFn(sendChatMessage);
  const fnDocs = useServerFn(listDocuments);

  const threads = useQuery({ queryKey: ["chat-threads"], queryFn: () => fnList() });
  const documents = useQuery({ queryKey: ["documents"], queryFn: () => fnDocs() });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [docContext, setDocContext] = useState<string>("none"); // "none" | "all" | docId
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pick first thread by default
  useEffect(() => {
    if (!activeId && threads.data && threads.data.length) setActiveId(threads.data[0].id);
  }, [threads.data, activeId]);

  const messages = useQuery({
    queryKey: ["chat-messages", activeId],
    queryFn: () => fnMessages({ data: { threadId: activeId! } }),
    enabled: !!activeId,
  });

  const createMut = useMutation({
    mutationFn: () => fnCreate({ data: {} }),
    onSuccess: (r) => {
      setActiveId(r.id);
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => fnDelete({ data: { id } }),
    onSuccess: (_r, id) => {
      if (activeId === id) setActiveId(null);
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });

  const sendMut = useMutation({
    mutationFn: (payload: { content: string; threadId: string }) =>
      fnSend({
        data: {
          threadId: payload.threadId,
          content: payload.content,
          documentId: docContext !== "none" && docContext !== "all" ? docContext : null,
          useAllDocuments: docContext === "all",
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages", activeId] });
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredThreads = useMemo(() => {
    const list = threads.data ?? [];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((t) => t.title.toLowerCase().includes(s));
  }, [threads.data, search]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.data, sendMut.isPending]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeId]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    let threadId = activeId;
    if (!threadId) {
      const r = await fnCreate({ data: {} });
      threadId = r.id;
      setActiveId(threadId);
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    }
    setInput("");
    // Optimistic: refetch will show user msg after send resolves; add manual optimistic
    qc.setQueryData(["chat-messages", threadId], (prev: any) => {
      const arr = Array.isArray(prev) ? prev : [];
      return [
        ...arr,
        {
          id: `optimistic-${Date.now()}`,
          role: "user",
          content,
          sources: null,
          created_at: new Date().toISOString(),
        },
      ];
    });
    sendMut.mutate({ content, threadId });
  };

  const readyDocs = (documents.data ?? []).filter((d) => d.status === "ready");
  const active = threads.data?.find((t) => t.id === activeId);

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-screen">
      {/* Thread sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r bg-background">
        <div className="p-3 border-b space-y-2">
          <Button onClick={() => createMut.mutate()} className="w-full gap-2" disabled={createMut.isPending}>
            <Plus className="size-4" /> New chat
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              className="pl-8 h-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {threads.isLoading && Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
            {!threads.isLoading && filteredThreads.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">No conversations yet. Start a new chat.</p>
            )}
            {filteredThreads.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer hover:bg-muted transition-colors",
                  activeId === t.id && "bg-primary/10",
                )}
                onClick={() => setActiveId(t.id)}
              >
                <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{t.title}</span>
                <button
                  type="button"
                  aria-label="Delete chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this chat?")) deleteMut.mutate(t.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-opacity"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
        <header className="border-b bg-background px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-secondary grid place-items-center text-white">
            <Bot className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate flex items-center gap-2">
              {active?.title ?? "AI Tutor"}
              <Sparkles className="size-3.5 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground">
              For Nepali students — TU, NEB, SEE curriculum
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={docContext} onValueChange={setDocContext}>
              <SelectTrigger className="w-[200px]">
                <FileStack className="size-4 mr-1" />
                <SelectValue placeholder="Document context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No documents</SelectItem>
                <SelectItem value="all" disabled={readyDocs.length === 0}>
                  All my documents
                </SelectItem>
                {readyDocs.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
            {!activeId || (messages.data?.length ?? 0) === 0 ? (
              <div className="text-center py-10 space-y-6">
                <div className="mx-auto size-16 rounded-2xl bg-gradient-to-br from-primary to-secondary grid place-items-center text-white shadow-lg">
                  <Bot className="size-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">How can I help you learn today?</h2>
                  <p className="text-muted-foreground mt-2">
                    Ask about concepts, solve problems, generate quizzes, or prep for exams.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 max-w-2xl mx-auto text-left">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSend(p)}
                      className="rounded-lg border bg-background px-4 py-3 text-sm hover:bg-muted transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.data!.map((m) => <MessageBubble key={m.id} role={m.role} content={m.content} />)
            )}

            {sendMut.isPending && (
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-gradient-to-br from-primary to-secondary grid place-items-center text-white">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Loader2 className="size-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t bg-background p-3 md:p-4">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything — concepts, problems, quizzes, exam tips…"
              className="min-h-[52px] max-h-40 resize-none"
              disabled={sendMut.isPending}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sendMut.isPending}
              size="lg"
              className="h-[52px] w-[52px] p-0 shrink-0"
            >
              {sendMut.isPending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            </Button>
          </div>
          <p className="max-w-3xl mx-auto text-[11px] text-muted-foreground mt-2 text-center">
            AI can make mistakes. Verify important facts. Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "size-8 rounded-full grid place-items-center shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary to-secondary text-white",
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 max-w-[85%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-background border",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
