import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { libraryDocumentsService } from "@/services/libraryDocumentsService";
import { LIBRARY_CATEGORY_LABELS, type LibraryCategory } from "@/@types/Documents";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatFileSize } from "@/lib/fileUrl";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.odt,.ods";

type SourceType = "file" | "link";

interface NewLibraryDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const NewLibraryDocumentDialog = ({ open, onOpenChange, onCreated }: NewLibraryDocumentDialogProps) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LibraryCategory | "">("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [source, setSource] = useState<SourceType>("file");
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setKeywords("");
    setSource("file");
    setFile(null);
    setExternalUrl("");
  };

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Informe o título do documento.";
    if (!category) return "Selecione a categoria.";
    if (source === "file") {
      if (!file) return "Selecione um arquivo para enviar.";
      if (file.size > MAX_FILE_SIZE) return "O arquivo deve ter no máximo 5 MB.";
    } else {
      const url = externalUrl.trim();
      if (!url) return "Informe o link externo.";
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
      } catch {
        return "Informe um link válido (começando com http:// ou https://).";
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    if (!category) return;

    setSubmitting(true);
    try {
      await libraryDocumentsService.create({
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        keywords: keywords.trim() || undefined,
        file: source === "file" ? file : undefined,
        externalUrl: source === "link" ? externalUrl.trim() : undefined,
      });
      toast.success("Documento adicionado à biblioteca.");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível adicionar o documento."));
    } finally {
      setSubmitting(false);
    }
  };

  const fileTooLarge = file !== null && file.size > MAX_FILE_SIZE;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo documento</DialogTitle>
          <DialogDescription>
            Adicione um arquivo ou um link externo à biblioteca de documentos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="library-title">Título *</Label>
            <Input
              id="library-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Lei do Exercício Profissional"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="library-category">Categoria *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as LibraryCategory)}>
              <SelectTrigger id="library-category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LIBRARY_CATEGORY_LABELS) as LibraryCategory[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {LIBRARY_CATEGORY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="library-description">Descrição</Label>
            <Textarea
              id="library-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Breve resumo do conteúdo do documento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="library-keywords">Palavras-chave</Label>
            <Input
              id="library-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Ex.: dimensionamento, escala, COFEN"
              aria-describedby="library-keywords-hint"
            />
            <p id="library-keywords-hint" className="text-xs text-muted-foreground">
              Separadas por vírgula.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium leading-none mb-2">Origem do documento *</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {(
                [
                  { value: "file", label: "Arquivo" },
                  { value: "link", label: "Link externo" },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={source === opt.value}
                  variant={source === opt.value ? "default" : "outline"}
                  onClick={() => setSource(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </fieldset>

          {source === "file" ? (
            <div className="space-y-2">
              <Label htmlFor="library-file">Arquivo *</Label>
              <Input
                id="library-file"
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                aria-describedby="library-file-hint"
              />
              <p
                id="library-file-hint"
                className={cn("text-xs", fileTooLarge ? "text-destructive" : "text-muted-foreground")}
              >
                {file
                  ? `${file.name} (${formatFileSize(file.size)})${fileTooLarge ? " — excede o limite de 5 MB" : ""}`
                  : "PDF, imagem (JPG/PNG), Word, Excel ou LibreOffice — até 5 MB."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="library-url">Link externo *</Label>
              <Input
                id="library-url"
                type="url"
                inputMode="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewLibraryDocumentDialog;
