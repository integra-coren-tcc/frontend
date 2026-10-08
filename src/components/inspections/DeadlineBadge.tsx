import { Clock } from "lucide-react";
import {
  DEADLINE_URGENCY_CLASSES,
  formatDeadlineCountdown,
  getDeadlineUrgency,
} from "@/lib/deadline";

interface DeadlineBadgeProps {
  deadline: string;
  className?: string;
}

// Prazo com cor por urgência + contagem regressiva ("Vence em 2 dias")
const DeadlineBadge = ({ deadline, className = "" }: DeadlineBadgeProps) => {
  const urgency = getDeadlineUrgency(deadline);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${DEADLINE_URGENCY_CLASSES[urgency]} ${className}`}
      title={`Prazo: ${new Date(deadline).toLocaleDateString("pt-BR")}`}
    >
      <Clock className="w-3 h-3" aria-hidden="true" />
      {formatDeadlineCountdown(deadline)} · {new Date(deadline).toLocaleDateString("pt-BR")}
    </span>
  );
};

export default DeadlineBadge;
