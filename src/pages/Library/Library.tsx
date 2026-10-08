import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Library as LibraryIcon,
  Link2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { libraryDocumentsService } from "@/services/libraryDocumentsService";
import {
  LIBRARY_CATEGORY_LABELS,
  type LibraryCategory,
  type LibraryDocument,
} from "@/@types/Documents";
import { fileUrl, formatFileSize } from "@/lib/fileUrl";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useUserStore } from "@/stores/userStore";
import { cn } from "@/lib/utils";
import NewLibraryDocumentDialog from "./NewLibraryDocumentDialog";

type CategoryFilter = LibraryCategory | "ALL";

const CATEGORIES = Object.keys(LIBRARY_CATEGORY_LABELS) as LibraryCategory[];

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.oasis.opendocument.text": "ODT",
  "application/vnd.oasis.opendocument.spreadsheet": "ODS",
};

function fileTypeLabel(doc: LibraryDocument): string {
  if (doc.mimeType && MIME_LABELS[doc.mimeType]) return MIME_LABELS[doc.mimeType];
  const ext = doc.originalName?.split(".").pop();
  return ext && ext !== doc.originalName ? ext.toUpperCase() : "Arquivo";
}

function splitKeywords(keywords: string | null): string[] {
  if (!keywords) return [];
  return keywords
    .split(",")
    .map((k) => k.trim())
    .filter((k, i, arr) => k && arr.indexOf(k) === i);
}

interface DocumentCardProps {
  doc: LibraryDocument;
  isAdmin: boolean;
  onDelete: (doc: LibraryDocument) => void;
}

const DocumentCard = ({ doc, isAdmin, onDelete }: DocumentCardProps) => {
  const keywords = splitKeywords(doc.keywords);
  const downloadUrl = fileUrl(doc.path);
  const isLink = !downloadUrl && !!doc.externalUrl;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3 min-w-0">
            <div className="mt-0.5 shrink-0 rounded-md bg-primary/10 p-2 text-primary">
              {isLink ? <Link2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0 space-y-1.5">
              <h3 className="font-semibold text-foreground break-words">{doc.title}</h3>
              {doc.description && (
                <p className="text-sm text-muted-foreground break-words">{doc.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {isLink
                  ? "Link externo"
                  : [fileTypeLabel(doc), formatFileSize(doc.size)].filter(Boolean).join(" · ")}
              </p>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Palavras-chave">
                  {keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-xs font-normal">
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
            {downloadUrl ? (
              <Button asChild size="sm" className="flex-1 sm:flex-none">
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </a>
              </Button>
            ) : doc.externalUrl ? (
              <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
                <a href={doc.externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir link
                </a>
              </Button>
            ) : null}
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(doc)}
                aria-label={`Remover documento ${doc.title}`}
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Remover</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Carregando documentos">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-5 flex gap-3">
          <Skeleton className="h-9 w-9 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const Library = () => {
  const navigate = useNavigate();
  const isAdmin = useUserStore().user?.role === "ADMIN";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<LibraryDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const requestIdRef = useRef(0);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadDocuments = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await libraryDocumentsService.list({
        search: search || undefined,
        category: category === "ALL" ? undefined : category,
      });
      if (requestId === requestIdRef.current) setDocuments(data);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setDocuments([]);
        toast.error(getErrorMessage(err, "Não foi possível carregar a biblioteca de documentos."));
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const grouped = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        category: cat,
        items: documents.filter((d) => d.category === cat),
      })).filter((g) => g.items.length > 0),
    [documents]
  );

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await libraryDocumentsService.delete(toDelete.id);
      toast.success("Documento removido da biblioteca.");
      setToDelete(null);
      loadDocuments();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover o documento."));
    } finally {
      setDeleting(false);
    }
  };

  const filterOptions: { value: CategoryFilter; label: string }[] = [
    { value: "ALL", label: "Todos" },
    ...CATEGORIES.map((c) => ({ value: c, label: LIBRARY_CATEGORY_LABELS[c] })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Voltar" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <LibraryIcon className="w-7 h-7 text-primary hidden sm:block" />
                Biblioteca de documentos
              </h1>
              <p className="text-muted-foreground mt-1">
                Legislação, manuais, instrumentos administrativos, modelos editáveis e orientações para
                apoiar a prática de enfermagem.
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)} className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Novo documento
            </Button>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <label htmlFor="library-search" className="sr-only">
              Buscar documentos
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="library-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por título, descrição ou palavra-chave..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {filterOptions.map((opt) => {
              const active = category === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  aria-pressed={active}
                  onClick={() => setCategory(opt.value)}
                  className={cn("rounded-full", !active && "text-muted-foreground")}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : documents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center text-center gap-2">
              <FileText className="w-10 h-10 text-muted-foreground/60" />
              <p className="font-medium text-foreground">Nenhum documento encontrado</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                {search || category !== "ALL"
                  ? "Tente outros termos de busca ou selecione outra categoria."
                  : "Ainda não há documentos cadastrados na biblioteca."}
              </p>
            </CardContent>
          </Card>
        ) : category === "ALL" ? (
          <div className="space-y-8">
            {grouped.map((group) => (
              <section key={group.category} aria-labelledby={`library-section-${group.category}`}>
                <h2
                  id={`library-section-${group.category}`}
                  className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"
                >
                  {LIBRARY_CATEGORY_LABELS[group.category]}
                  <Badge variant="outline" className="font-normal">
                    {group.items.length}
                  </Badge>
                </h2>
                <div className="space-y-3">
                  {group.items.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={setToDelete} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={setToDelete} />
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <>
          <NewLibraryDocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={loadDocuments} />

          <AlertDialog
            open={toDelete !== null}
            onOpenChange={(open) => {
              if (!open && !deleting) setToDelete(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover documento?</AlertDialogTitle>
                <AlertDialogDescription>
                  O documento "{toDelete?.title}" será removido da biblioteca e deixará de estar
                  disponível para todos os usuários. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleConfirmDelete();
                  }}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Removendo..." : "Remover"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default Library;
