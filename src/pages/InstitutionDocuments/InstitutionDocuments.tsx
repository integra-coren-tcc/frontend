import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Download,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useUserStore } from "@/stores/userStore";
import { institutionsService } from "@/services/institutionsService";
import { institutionDocumentsService } from "@/services/institutionDocumentsService";
import type { Institution } from "@/@types/Institution";
import {
  INSTITUTION_DOCUMENT_TYPE_LABELS,
  type InstitutionDocument,
  type InstitutionDocumentType,
} from "@/@types/Documents";
import { fileUrl, formatFileSize } from "@/lib/fileUrl";
import { getErrorMessage } from "@/lib/getErrorMessage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx", ".odt", ".ods"];
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(",");
const EXPIRING_SOON_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DOCUMENT_TYPES = Object.keys(INSTITUTION_DOCUMENT_TYPE_LABELS) as InstitutionDocumentType[];

/** Converte "AAAA-MM-DD" ou ISO em uma data local (meia-noite), evitando deslocamento de fuso. */
function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDate(value: string): string {
  const d = parseDateOnly(value);
  return d ? d.toLocaleDateString("pt-BR") : "-";
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

type ValidityStatus =
  | { kind: "none" }
  | { kind: "expired" }
  | { kind: "soon"; days: number }
  | { kind: "ok" };

/** O documento é considerado válido até o fim do dia informado em validUntil. */
function getValidityStatus(validUntil: string | null): ValidityStatus {
  if (!validUntil) return { kind: "none" };
  const due = parseDateOnly(validUntil);
  if (!due) return { kind: "none" };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY);
  if (days < 0) return { kind: "expired" };
  if (days <= EXPIRING_SOON_DAYS) return { kind: "soon", days };
  return { kind: "ok" };
}

function ValidityBadge({ validUntil }: { validUntil: string | null }) {
  const status = getValidityStatus(validUntil);
  if (status.kind === "none") {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        Sem validade definida
      </Badge>
    );
  }
  if (status.kind === "expired") {
    return (
      <Badge className="border-transparent bg-red-600 text-white hover:bg-red-600">Vencido</Badge>
    );
  }
  if (status.kind === "soon") {
    const label =
      status.days === 0 ? "Vence hoje" : status.days === 1 ? "Vence amanhã" : `Vence em ${status.days} dias`;
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200">
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal">
      Em dia
    </Badge>
  );
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

interface UploadFormState {
  type: InstitutionDocumentType | "";
  title: string;
  validUntil: string;
  file: File | null;
}

const EMPTY_FORM: UploadFormState = { type: "", title: "", validUntil: "", file: null };

type FormErrors = Partial<Record<keyof UploadFormState, string>>;

function validateForm(form: UploadFormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.type) errors.type = "Selecione o tipo do documento.";
  if (!form.title.trim()) errors.title = "Informe um título.";
  else if (form.title.trim().length > 200) errors.title = "O título deve ter no máximo 200 caracteres.";
  if (form.validUntil && !/^\d{4}-\d{2}-\d{2}$/.test(form.validUntil)) {
    errors.validUntil = "Data de validade inválida.";
  }
  if (!form.file) {
    errors.file = "Selecione um arquivo.";
  } else if (!ACCEPTED_EXTENSIONS.includes(getExtension(form.file.name))) {
    errors.file = "Formato não permitido. Use PDF, imagem (PNG/JPG) ou documento do Office/LibreOffice.";
  } else if (form.file.size > MAX_FILE_SIZE) {
    errors.file = "O arquivo deve ter no máximo 5 MB.";
  } else if (form.file.size === 0) {
    errors.file = "O arquivo está vazio.";
  }
  return errors;
}

const InstitutionDocuments = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useUserStore((s) => s.user?.role);

  const needsInstitutionPicker = role === "INSPECTOR" || role === "ADMIN";
  const canUpload = role === "RT" || role === "ADMIN";
  const canDelete = role === "RT" || role === "ADMIN";

  const selectedInstitutionId = needsInstitutionPicker ? searchParams.get("institutionId") ?? "" : "";

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  const [documents, setDocuments] = useState<InstitutionDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState<UploadFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [docToDelete, setDocToDelete] = useState<InstitutionDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Instituições (apenas fiscal/admin)
  useEffect(() => {
    if (!needsInstitutionPicker) return;
    let active = true;
    setLoadingInstitutions(true);
    institutionsService
      .getAll()
      .then((res) => {
        if (active) setInstitutions(res.institutions ?? []);
      })
      .catch((err: unknown) => {
        if (active) toast.error(getErrorMessage(err, "Não foi possível carregar as instituições."));
      })
      .finally(() => {
        if (active) setLoadingInstitutions(false);
      });
    return () => {
      active = false;
    };
  }, [needsInstitutionPicker]);

  const loadDocuments = useCallback(async () => {
    if (!role) return;
    if (needsInstitutionPicker && !selectedInstitutionId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const docs = needsInstitutionPicker
        ? await institutionDocumentsService.list(selectedInstitutionId)
        : await institutionDocumentsService.list();
      setDocuments(docs);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Não foi possível carregar os documentos.");
      setLoadError(message);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [role, needsInstitutionPicker, selectedInstitutionId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const groupedDocuments = useMemo(() => {
    const groups = new Map<InstitutionDocumentType, InstitutionDocument[]>();
    for (const doc of documents) {
      const list = groups.get(doc.type) ?? [];
      list.push(doc);
      groups.set(doc.type, list);
    }
    return DOCUMENT_TYPES.filter((t) => groups.has(t)).map((type) => ({
      type,
      docs: (groups.get(type) ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }));
  }, [documents]);

  const selectedInstitutionName = institutions.find((i) => String(i.id) === selectedInstitutionId)?.name;

  const handleInstitutionChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("institutionId", value);
    setSearchParams(next, { replace: true });
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFileInputKey((k) => k + 1);
  };

  const handleUploadOpenChange = (open: boolean) => {
    if (submitting) return;
    setUploadOpen(open);
    if (!open) resetForm();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0 || !form.type || !form.file) return;
    if (role === "ADMIN" && !selectedInstitutionId) {
      toast.error("Selecione uma instituição antes de enviar o documento.");
      return;
    }

    setSubmitting(true);
    try {
      await institutionDocumentsService.create({
        type: form.type,
        title: form.title.trim(),
        file: form.file,
        validUntil: form.validUntil || undefined,
        institutionId: role === "ADMIN" ? selectedInstitutionId : undefined,
      });
      toast.success("Documento enviado com sucesso.");
      setUploadOpen(false);
      resetForm();
      await loadDocuments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Não foi possível enviar o documento."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      await institutionDocumentsService.delete(docToDelete.id);
      toast.success("Documento excluído.");
      setDocToDelete(null);
      await loadDocuments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Não foi possível excluir o documento."));
    } finally {
      setDeleting(false);
    }
  };

  const showUploadButton = canUpload && (!needsInstitutionPicker || !!selectedInstitutionId);
  const awaitingInstitution = needsInstitutionPicker && !selectedInstitutionId;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Cabeçalho da página */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Voltar" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Documentos da instituição</h1>
              <p className="text-muted-foreground mt-1">
                Repositório dos documentos vigentes da instituição (regimento interno, dimensionamento de pessoal,
                PRS, protocolos/POPs, escalas etc.), mantido atualizado para acompanhamento pela fiscalização do
                COREN, independentemente de uma fiscalização em andamento.
              </p>
            </div>
          </div>
          {showUploadButton && (
            <Button onClick={() => setUploadOpen(true)} className="shrink-0 self-start">
              <Plus className="w-4 h-4 mr-2" />
              Enviar documento
            </Button>
          )}
        </div>

        {role === "LEGAL_REPRESENTATIVE" && (
          <p className="text-sm text-muted-foreground mb-6">
            Você tem acesso somente para consulta. O envio e a exclusão de documentos são feitos pelo Responsável
            Técnico.
          </p>
        )}

        {/* Seleção de instituição (fiscal/admin) */}
        {needsInstitutionPicker && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Instituição
              </CardTitle>
              <CardDescription>
                Selecione a instituição para consultar os documentos
                {role === "INSPECTOR" ? " (somente leitura)." : "."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="institution-select" className="sr-only">
                Instituição
              </Label>
              <Select
                value={selectedInstitutionId || undefined}
                onValueChange={handleInstitutionChange}
                disabled={loadingInstitutions}
              >
                <SelectTrigger id="institution-select" className="w-full sm:max-w-md">
                  <SelectValue
                    placeholder={loadingInstitutions ? "Carregando instituições..." : "Selecione a instituição"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={String(inst.id)}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Conteúdo */}
        {awaitingInstitution ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center text-center gap-3">
              <Building2 className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
              <p className="text-muted-foreground">Selecione uma instituição para ver seus documentos.</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Carregando documentos">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loadError ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center text-center gap-4">
              <p className="text-destructive">{loadError}</p>
              <Button variant="outline" onClick={() => loadDocuments()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : groupedDocuments.length === 0 ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center text-center gap-3">
              <FolderOpen className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium">Nenhum documento cadastrado</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {canUpload
                  ? "Envie os documentos vigentes da instituição para que fiquem disponíveis à fiscalização."
                  : selectedInstitutionName
                    ? `${selectedInstitutionName} ainda não enviou documentos.`
                    : "A instituição ainda não enviou documentos."}
              </p>
              {showUploadButton && (
                <Button onClick={() => setUploadOpen(true)} className="mt-2">
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar primeiro documento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedDocuments.map(({ type, docs }) => (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between gap-2">
                    <span>{INSTITUTION_DOCUMENT_TYPE_LABELS[type]}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {docs.length} {docs.length === 1 ? "documento" : "documentos"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y">
                    {docs.map((doc) => {
                      const href = fileUrl(doc.path);
                      const size = formatFileSize(doc.size);
                      return (
                        <li
                          key={doc.id}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <FileText className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
                            <div className="min-w-0 space-y-1">
                              <p className="font-medium break-words">{doc.title}</p>
                              <p className="text-sm text-muted-foreground break-all">
                                {doc.originalName}
                                {size && ` · ${size}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Enviado por {doc.uploadedBy?.name ?? "—"} em {formatDateTime(doc.createdAt)}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {doc.validUntil && (
                                  <span className="text-sm">Válido até {formatDate(doc.validUntil)}</span>
                                )}
                                <ValidityBadge validUntil={doc.validUntil} />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:shrink-0 pl-8 sm:pl-0">
                            {href && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Baixar ${doc.title}`}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Baixar
                                </a>
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDocToDelete(doc)}
                                aria-label={`Excluir ${doc.title}`}
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo de envio */}
      {canUpload && (
        <Dialog open={uploadOpen} onOpenChange={handleUploadOpenChange}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enviar documento</DialogTitle>
              <DialogDescription>
                {role === "ADMIN" && selectedInstitutionName
                  ? `O documento será vinculado a ${selectedInstitutionName}.`
                  : "O documento ficará disponível para consulta pela fiscalização."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc-type">Tipo *</Label>
                <Select
                  value={form.type || undefined}
                  onValueChange={(value) => setForm((f) => ({ ...f, type: value as InstitutionDocumentType }))}
                >
                  <SelectTrigger
                    id="doc-type"
                    aria-invalid={!!formErrors.type}
                    aria-describedby={formErrors.type ? "doc-type-error" : undefined}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {INSTITUTION_DOCUMENT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.type && (
                  <p id="doc-type-error" className="text-sm text-destructive">
                    {formErrors.type}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-title">Título *</Label>
                <Input
                  id="doc-title"
                  value={form.title}
                  maxLength={200}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex.: Regimento interno de enfermagem 2026"
                  aria-invalid={!!formErrors.title}
                  aria-describedby={formErrors.title ? "doc-title-error" : undefined}
                />
                {formErrors.title && (
                  <p id="doc-title-error" className="text-sm text-destructive">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-valid-until">Validade (opcional)</Label>
                <Input
                  id="doc-valid-until"
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                  aria-invalid={!!formErrors.validUntil}
                  aria-describedby={formErrors.validUntil ? "doc-valid-until-error" : "doc-valid-until-hint"}
                />
                {formErrors.validUntil ? (
                  <p id="doc-valid-until-error" className="text-sm text-destructive">
                    {formErrors.validUntil}
                  </p>
                ) : (
                  <p id="doc-valid-until-hint" className="text-xs text-muted-foreground">
                    Informe se o documento tiver data de vencimento.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-file">Arquivo *</Label>
                <Input
                  key={fileInputKey}
                  id="doc-file"
                  type="file"
                  accept={ACCEPT_ATTR}
                  onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
                  aria-invalid={!!formErrors.file}
                  aria-describedby={formErrors.file ? "doc-file-error" : "doc-file-hint"}
                />
                {formErrors.file ? (
                  <p id="doc-file-error" className="text-sm text-destructive">
                    {formErrors.file}
                  </p>
                ) : (
                  <p id="doc-file-hint" className="text-xs text-muted-foreground">
                    PDF, PNG, JPG, DOC, DOCX, XLS, XLSX, ODT ou ODS — até 5 MB.
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleUploadOpenChange(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? "Enviando..." : "Enviar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!docToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setDocToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento <strong>{docToDelete?.title}</strong>? Essa ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InstitutionDocuments;
