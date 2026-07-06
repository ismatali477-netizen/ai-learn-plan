import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listDocuments, createDocument, processDocument, deleteDocument,
  generateStudyContent, listGeneratedContent, deleteGeneratedContent,
} from "@/lib/documents.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileStack, Upload, Trash2, Loader2, FileText, Sparkles, CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents — StudyPlanner AI" }] }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const fnList = useServerFn(listDocuments);
  const fnCreate = useServerFn(createDocument);
  const fnProcess = useServerFn(processDocument);
  const fnDelete = useServerFn(deleteDocument);
  const fnGen = useServerFn(generateStudyContent);
  const fnListGen = useServerFn(listGeneratedContent);
  const fnDelGen = useServerFn(deleteGeneratedContent);

  const docs = useQuery({
    queryKey: ["documents"],
    queryFn: () => fnList(),
    refetchInterval: (q) =>
      (q.state.data ?? []).some((d) => d.status === "processing" || d.status === "pending") ? 3000 : false,
  });
  const gen = useQuery({ queryKey: ["generated-content"], queryFn: () => fnListGen() });

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [genDocId, setGenDocId] = useState<string>("");
  const [genKind, setGenKind] = useState<"notes" | "summary" | "quiz" | "cheatsheet">("notes");
  const [genTopic, setGenTopic] = useState("");
  const [genQuizType, setGenQuizType] = useState<"mcq" | "short" | "long" | "true_false" | "fill">("mcq");
  const [genCount, setGenCount] = useState(8);
  const [viewGenId, setViewGenId] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    if (file.type !== "application/pdf") { toast.error("Only PDF files"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Max 20 MB"); return; }
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, {
        contentType: "application/pdf",
      });
      if (error) throw error;
      const created = await fnCreate({
        data: {
          title: file.name.replace(/\.pdf$/i, ""),
          filename: file.name,
          storage_path: path,
          mime_type: "application/pdf",
          size_bytes: file.size,
        },
      });
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Uploaded — processing…");
      // Kick off processing (long-running; don't block UI)
      fnProcess({ data: { id: created.id } })
        .then(() => {
          qc.invalidateQueries({ queryKey: ["documents"] });
          toast.success("Document ready");
        })
        .catch((e) => {
          toast.error(`Processing failed: ${e.message}`);
          qc.invalidateQueries({ queryKey: ["documents"] });
        });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const delMut = useMutation({
    mutationFn: (id: string) => fnDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const genMut = useMutation({
    mutationFn: () =>
      fnGen({
        data: {
          documentId: genDocId || null,
          kind: genKind,
          topic: genTopic || undefined,
          quizType: genKind === "quiz" ? genQuizType : undefined,
          count: genKind === "quiz" ? genCount : undefined,
        },
      }),
    onSuccess: (row) => {
      toast.success("Generated");
      setGenOpen(false);
      setGenTopic("");
      qc.invalidateQueries({ queryKey: ["generated-content"] });
      setViewGenId(row.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delGenMut = useMutation({
    mutationFn: (id: string) => fnDelGen({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["generated-content"] }),
  });

  const viewGen = gen.data?.find((g) => g.id === viewGenId);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2">
            <FileStack className="size-7 text-primary" /> Documents
          </h1>
          <p className="text-muted-foreground">
            Upload PDFs (notes, textbooks, past papers). The AI Tutor will use them to answer questions.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Uploading..." : "Upload PDF"}
          </Button>
          <Dialog open={genOpen} onOpenChange={setGenOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Sparkles className="size-4" /> Generate</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Generate study content</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={genKind} onValueChange={(v) => setGenKind(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notes">Revision notes</SelectItem>
                      <SelectItem value="summary">Chapter summary</SelectItem>
                      <SelectItem value="cheatsheet">Cheat sheet</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Based on document (optional)</Label>
                  <Select value={genDocId || "none"} onValueChange={(v) => setGenDocId(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="None (use topic)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(docs.data ?? []).filter((d) => d.status === "ready").map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Topic (optional if document is chosen)</Label>
                  <Input value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="e.g. DBMS Normalization, Newton's Laws" />
                </div>
                {genKind === "quiz" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Quiz type</Label>
                      <Select value={genQuizType} onValueChange={(v) => setGenQuizType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq">MCQ</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="fill">Fill in the blanks</SelectItem>
                          <SelectItem value="short">Short answer</SelectItem>
                          <SelectItem value="long">Long answer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Count</Label>
                      <Input type="number" min={1} max={20} value={genCount} onChange={(e) => setGenCount(Number(e.target.value) || 8)} />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => genMut.mutate()}
                  disabled={genMut.isPending || (!genDocId && !genTopic)}
                  className="gap-2"
                >
                  {genMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="docs">
        <TabsList>
          <TabsTrigger value="docs">My Documents</TabsTrigger>
          <TabsTrigger value="generated">Generated Content</TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="space-y-3 mt-4">
          {docs.isLoading && <p className="text-muted-foreground">Loading…</p>}
          {docs.data && docs.data.length === 0 && (
            <Card className="p-10 text-center">
              <FileStack className="size-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold">No documents yet</h3>
              <p className="text-sm text-muted-foreground">Upload a PDF to enable document-aware Q&amp;A in the AI Tutor.</p>
            </Card>
          )}
          <div className="grid gap-3">
            {(docs.data ?? []).map((d) => (
              <Card key={d.id} className="p-4 flex items-center gap-3">
                <FileText className="size-6 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.filename} · {d.page_count ? `${d.page_count} pages · ` : ""}
                    {d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : ""}
                  </p>
                  {d.error_message && <p className="text-xs text-destructive mt-1">{d.error_message}</p>}
                </div>
                <StatusBadge status={d.status} />
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete document?")) delMut.mutate(d.id); }}>
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generated" className="space-y-3 mt-4">
          {gen.data && gen.data.length === 0 && (
            <Card className="p-10 text-center">
              <Sparkles className="size-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold">Nothing generated yet</h3>
              <p className="text-sm text-muted-foreground">Click "Generate" to create notes, summaries, cheat sheets, or quizzes.</p>
            </Card>
          )}
          <div className="grid gap-3">
            {(gen.data ?? []).map((g) => (
              <Card key={g.id} className="p-4 flex items-center gap-3">
                <Sparkles className="size-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{g.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(g.created_at).toLocaleString()}</p>
                </div>
                <Badge variant="outline">{g.kind}</Badge>
                <Button variant="outline" size="sm" onClick={() => setViewGenId(g.id)}>View</Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) delGenMut.mutate(g.id); }}>
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewGenId} onOpenChange={(o) => !o && setViewGenId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewGen?.title}</DialogTitle></DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{((viewGen?.content as any)?.markdown ?? "") as string}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="size-3" /> Ready</Badge>;
  if (status === "processing") return <Badge variant="outline" className="gap-1"><Loader2 className="size-3 animate-spin" /> Processing</Badge>;
  if (status === "pending") return <Badge variant="outline" className="gap-1"><Clock className="size-3" /> Pending</Badge>;
  return <Badge variant="destructive" className="gap-1"><AlertCircle className="size-3" /> Error</Badge>;
}
