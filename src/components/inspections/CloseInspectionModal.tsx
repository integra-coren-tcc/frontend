import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InspectionOutcome, OUTCOME_LABELS } from "@/@types/Inspection";

export interface CloseInspectionData {
  outcome: InspectionOutcome;
  finalOpinion: string;
  nextSteps?: string;
}

interface CloseInspectionModalProps {
  open: boolean;
  submitting: boolean;
  // Every item is compliant or not applicable — only then "cumprida" is possible
  allItemsClosed: boolean;
  openItemsCount: number;
  onCancel: () => void;
  onConfirm: (data: CloseInspectionData) => void;
}

const OUTCOME_HINTS: Record<InspectionOutcome, string> = {
  [InspectionOutcome.COMPLIED]: "Todas as notificações foram atendidas dentro do esperado.",
  [InspectionOutcome.NOT_COMPLIED]: "As notificações não foram atendidas, sem encaminhamento definido ainda.",
  [InspectionOutcome.REFERRED_TO_CONCILIATION]: "Medidas administrativas esgotadas; o caso segue para conciliação.",
  [InspectionOutcome.REFERRED_TO_LEGAL_MEASURES]: "O caso segue para as medidas cabíveis (ex.: processo ético).",
};

const CloseInspectionModal = ({
  open,
  submitting,
  allItemsClosed,
  openItemsCount,
  onCancel,
  onConfirm,
}: CloseInspectionModalProps) => {
  const [outcome, setOutcome] = useState<InspectionOutcome | "">("");
  const [finalOpinion, setFinalOpinion] = useState("");
  const [nextSteps, setNextSteps] = useState("");

  useEffect(() => {
    if (open) {
      setOutcome(allItemsClosed ? InspectionOutcome.COMPLIED : "");
      setFinalOpinion("");
      setNextSteps("");
    }
  }, [open, allItemsClosed]);

  const needsNextSteps = !!outcome && outcome !== InspectionOutcome.COMPLIED;
  const canSubmit =
    !!outcome && finalOpinion.trim().length > 0 && (!needsNextSteps || nextSteps.trim().length > 0);

  const handleSubmit = () => {
    if (!outcome || !canSubmit) return;
    onConfirm({
      outcome,
      finalOpinion: finalOpinion.trim(),
      nextSteps: needsNextSteps ? nextSteps.trim() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !submitting && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Encerrar fiscalização</DialogTitle>
          <DialogDescription>
            O RT recebe o desfecho, o seu parecer e os próximos passos no sistema e por e-mail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Desfecho *</Label>
            <RadioGroup
              value={outcome}
              onValueChange={(value) => setOutcome(value as InspectionOutcome)}
              className="space-y-2"
            >
              {Object.values(InspectionOutcome).map((value) => {
                const disabled = value === InspectionOutcome.COMPLIED && !allItemsClosed;
                return (
                  <label
                    key={value}
                    htmlFor={`outcome-${value}`}
                    className={`flex items-start gap-3 rounded-md border p-3 ${
                      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem id={`outcome-${value}`} value={value} disabled={disabled} className="mt-0.5" />
                    <span>
                      <span className="block text-sm font-medium">{OUTCOME_LABELS[value]}</span>
                      <span className="block text-xs text-muted-foreground">
                        {disabled
                          ? `Indisponível: ${openItemsCount} ${openItemsCount === 1 ? "item ainda não está conforme" : "itens ainda não estão conformes"}.`
                          : OUTCOME_HINTS[value]}
                      </span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="final-opinion">Parecer final do fiscal *</Label>
            <Textarea
              id="final-opinion"
              value={finalOpinion}
              onChange={(e) => setFinalOpinion(e.target.value)}
              placeholder="Resumo do que foi verificado e sugestões de melhoria para o serviço."
              rows={4}
              maxLength={5000}
            />
          </div>

          {needsNextSteps && (
            <div className="space-y-2">
              <Label htmlFor="next-steps">Próximos passos para o RT *</Label>
              <Textarea
                id="next-steps"
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="O que acontece agora e o que a instituição deve fazer."
                rows={3}
                maxLength={5000}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Encerrar e notificar o RT
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseInspectionModal;
