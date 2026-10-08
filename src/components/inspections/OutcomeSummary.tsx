import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Inspection, InspectionOutcome, OUTCOME_LABELS } from "@/@types/Inspection";

interface OutcomeSummaryProps {
  inspection: Pick<Inspection, "outcome" | "finalOpinion" | "nextSteps" | "completedAt">;
}

// Desfecho do processo, mostrado ao RT, ao representante legal e ao fiscal após o encerramento
const OutcomeSummary = ({ inspection }: OutcomeSummaryProps) => {
  if (!inspection.outcome) return null;

  const complied = inspection.outcome === InspectionOutcome.COMPLIED;
  const Icon = complied ? CheckCircle2 : AlertTriangle;

  return (
    <section
      aria-label="Desfecho da fiscalização"
      className={`rounded-lg border p-4 mb-6 ${
        complied ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${complied ? "text-green-700" : "text-amber-700"}`} />
        <h2 className="font-semibold text-foreground">
          Fiscalização encerrada — {OUTCOME_LABELS[inspection.outcome]}
        </h2>
      </div>
      {inspection.completedAt && (
        <p className="text-xs text-muted-foreground mb-3">
          Encerrada em {new Date(inspection.completedAt).toLocaleDateString("pt-BR")}
        </p>
      )}
      {inspection.finalOpinion && (
        <div className="mb-2">
          <p className="text-sm font-medium">Parecer do fiscal</p>
          <p className="text-sm whitespace-pre-line">{inspection.finalOpinion}</p>
        </div>
      )}
      {inspection.nextSteps && (
        <div>
          <p className="text-sm font-medium">Próximos passos</p>
          <p className="text-sm whitespace-pre-line">{inspection.nextSteps}</p>
        </div>
      )}
    </section>
  );
};

export default OutcomeSummary;
