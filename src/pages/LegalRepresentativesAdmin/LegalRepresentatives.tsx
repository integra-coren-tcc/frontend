import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Loader2, Plus, Save, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { institutionsService } from "@/services/institutionsService";
import {
  legalRepresentativesService,
  type LegalRepresentative,
} from "@/services/legalRepresentativesService";
import type { Institution } from "@/@types/Institution";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatCpf, isValidCpf, maskCpf, onlyCpfDigits } from "@/lib/cpf";

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  email: string;
  cpf: string; // com máscara
  institutionId: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  cpf: "",
  institutionId: "",
  password: "",
  confirmPassword: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim().length < 3) errors.name = "Informe o nome completo.";
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = "Informe um e-mail válido.";
  const cpfDigits = onlyCpfDigits(form.cpf);
  if (cpfDigits.length !== 11) errors.cpf = "O CPF deve ter 11 dígitos.";
  else if (!isValidCpf(cpfDigits)) errors.cpf = "CPF inválido. Verifique os dígitos informados.";
  if (!form.institutionId) errors.institutionId = "Selecione a instituição.";
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (form.confirmPassword !== form.password) errors.confirmPassword = "As senhas não coincidem.";
  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

const LegalRepresentatives = () => {
  const navigate = useNavigate();

  const [representatives, setRepresentatives] = useState<LegalRepresentative[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [toDelete, setToDelete] = useState<LegalRepresentative | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRepresentatives = useCallback(async () => {
    setLoading(true);
    try {
      setRepresentatives(await legalRepresentativesService.list());
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Não foi possível carregar os representantes legais."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepresentatives();
  }, [loadRepresentatives]);

  useEffect(() => {
    let active = true;
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
  }, []);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const handleCreateOpenChange = (open: boolean) => {
    if (submitting) return;
    setCreateOpen(open);
    if (!open) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await legalRepresentativesService.create({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        cpf: onlyCpfDigits(form.cpf),
        institutionId: form.institutionId,
        password: form.password,
      });
      toast.success("Representante legal cadastrado com sucesso.");
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      await loadRepresentatives();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Não foi possível cadastrar o representante legal."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await legalRepresentativesService.delete(toDelete.id);
      toast.success("Representante legal excluído.");
      setToDelete(null);
      await loadRepresentatives();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Não foi possível excluir o representante legal."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Cabeçalho da página */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Voltar" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Representantes legais</h1>
              <p className="text-muted-foreground mt-1">
                Cadastre e gerencie os representantes legais (alta gestão) das instituições.
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="shrink-0 self-start">
            <Plus className="w-4 h-4 mr-2" />
            Novo representante
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 mb-6 text-sm text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            O representante legal tem acesso somente leitura ao histórico de fiscalizações e aos documentos da
            instituição à qual está vinculado.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Representantes cadastrados</CardTitle>
            <CardDescription>
              {loading
                ? "Carregando..."
                : `${representatives.length} ${
                    representatives.length === 1 ? "representante encontrado" : "representantes encontrados"
                  }`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Carregando representantes">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : representatives.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center gap-3">
                <UserRound className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
                <p className="font-medium">Nenhum representante legal cadastrado</p>
                <p className="text-sm text-muted-foreground">
                  Use o botão “Novo representante” para cadastrar o primeiro.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="whitespace-nowrap">CPF</TableHead>
                    <TableHead>Instituição</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {representatives.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="font-medium">{rep.user?.name ?? "-"}</TableCell>
                      <TableCell className="break-all">{rep.user?.email ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCpf(rep.cpf)}</TableCell>
                      <TableCell>{rep.institution?.name ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToDelete(rep)}
                          aria-label={`Excluir ${rep.user?.name ?? "representante"}`}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de cadastro */}
      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo representante legal</DialogTitle>
            <DialogDescription>
              Terá acesso somente leitura ao histórico de fiscalizações e aos documentos da instituição.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lr-name">Nome completo *</Label>
              <Input
                id="lr-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "lr-name-error" : undefined}
              />
              <FieldError id="lr-name-error" message={errors.name} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lr-email">E-mail *</Label>
                <Input
                  id="lr-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  autoComplete="email"
                  placeholder="nome@instituicao.com.br"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "lr-email-error" : undefined}
                />
                <FieldError id="lr-email-error" message={errors.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lr-cpf">CPF *</Label>
                <Input
                  id="lr-cpf"
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(e) => setField("cpf", maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  aria-invalid={!!errors.cpf}
                  aria-describedby={errors.cpf ? "lr-cpf-error" : undefined}
                />
                <FieldError id="lr-cpf-error" message={errors.cpf} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lr-institution">Instituição *</Label>
              <Select
                value={form.institutionId || undefined}
                onValueChange={(value) => setField("institutionId", value)}
                disabled={loadingInstitutions}
              >
                <SelectTrigger
                  id="lr-institution"
                  aria-invalid={!!errors.institutionId}
                  aria-describedby={errors.institutionId ? "lr-institution-error" : undefined}
                >
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
              <FieldError id="lr-institution-error" message={errors.institutionId} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lr-password">Senha temporária *</Label>
                <Input
                  id="lr-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  autoComplete="new-password"
                  placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "lr-password-error" : "lr-password-hint"}
                />
                {errors.password ? (
                  <FieldError id="lr-password-error" message={errors.password} />
                ) : (
                  <p id="lr-password-hint" className="text-xs text-muted-foreground">
                    O representante deverá alterar a senha no primeiro acesso.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lr-confirm-password">Confirmar senha *</Label>
                <Input
                  id="lr-confirm-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                  placeholder="Digite a senha novamente"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "lr-confirm-password-error" : undefined}
                />
                <FieldError id="lr-confirm-password-error" message={errors.confirmPassword} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCreateOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {submitting ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir representante legal</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{toDelete?.user?.name}</strong>
              {toDelete?.institution?.name ? ` (${toDelete.institution.name})` : ""}? Ele perderá o acesso ao
              sistema. Essa ação não pode ser desfeita.
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

export default LegalRepresentatives;
