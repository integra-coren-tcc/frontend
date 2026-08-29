import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { inspectionsService } from "@/services/inspectionsService";
import { PendingByInstitutionGroup, InspectionStatus } from "@/@types/Inspection";

const STATUS_LABELS: Record<string, string> = {
  [InspectionStatus.SCHEDULED]: "Agendada",
  [InspectionStatus.IN_PROGRESS]: "Em Andamento",
  [InspectionStatus.IN_PROGRESS_INSPECTOR]: "Em Andamento (Fiscal)",
  [InspectionStatus.AWAITING_CORRECTION]: "Aguardando Correção",
};

function getCountdown(deadline: string): { label: string; overdue: boolean } {
  const diffMs = new Date(deadline).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Venceu há ${Math.abs(diffDays)} dia${Math.abs(diffDays) === 1 ? "" : "s"}`, overdue: true };
  }
  if (diffDays === 0) {
    return { label: "Vence hoje", overdue: true };
  }
  if (diffDays === 1) {
    return { label: "Vence amanhã", overdue: false };
  }
  return { label: `Vence em ${diffDays} dias`, overdue: false };
}

// Ordena o mais urgente primeiro (prazo mais próximo/vencido no topo)
function sortByDeadlineAsc<T extends { deadline: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
}

const PendingByInstitution = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [groups, setGroups] = useState<PendingByInstitutionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await inspectionsService.getPendingByInstitution();
        setGroups(data);
      } catch (err) {
        console.error("Erro ao carregar pendências:", err);
        setError("Não foi possível carregar as pendências por instituição.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header userType="inspector" userName={user?.name || "Fiscal"} />

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <AlertTriangle className="w-7 h-7 text-warning" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pendências por Instituição</h1>
            <p className="text-muted-foreground mt-1">
              Instituições com fiscalizações em aberto, para acompanhar e cobrar o que está perto do prazo
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">{error}</CardContent>
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma fiscalização em aberto no momento.
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {groups.map((group) => (
              <AccordionItem
                key={group.institution.publicId}
                value={group.institution.publicId}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{group.institution.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {group.inspections.length} fiscalizaç{group.inspections.length === 1 ? "ão" : "ões"} em aberto
                    </span>
                    {group.nearDeadlineCount > 0 && (
                      <Badge variant="destructive" className="ml-auto mr-2">
                        {group.nearDeadlineCount} item{group.nearDeadlineCount === 1 ? "" : "s"} perto do prazo
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    {[...group.inspections]
                      .sort((a, b) => {
                        const aEarliest = sortByDeadlineAsc(a.nearDeadlineItems)[0]?.deadline;
                        const bEarliest = sortByDeadlineAsc(b.nearDeadlineItems)[0]?.deadline;
                        if (aEarliest && bEarliest) {
                          return new Date(aEarliest).getTime() - new Date(bEarliest).getTime();
                        }
                        if (aEarliest) return -1;
                        if (bEarliest) return 1;
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                      })
                      .map((inspection) => {
                        const sortedItems = sortByDeadlineAsc(inspection.nearDeadlineItems);
                        return (
                          <div
                            key={inspection.id}
                            className="border rounded-md p-3 cursor-pointer hover:bg-muted/40"
                            onClick={() => navigate(`/checklist/${inspection.id}`)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">
                                  {new Date(inspection.date).toLocaleDateString("pt-BR")}
                                </p>
                                <Badge variant="outline" className="mt-1">
                                  {STATUS_LABELS[inspection.status] || inspection.status}
                                </Badge>
                              </div>
                              {sortedItems.length > 0 && (
                                <Badge variant="destructive">
                                  {sortedItems.length} perto do prazo
                                </Badge>
                              )}
                            </div>

                            {sortedItems.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {sortedItems.map((item) => {
                                  const countdown = getCountdown(item.deadline);
                                  return (
                                    <div
                                      key={item.itemCode}
                                      className="flex items-center gap-2 text-xs"
                                    >
                                      <Clock className={`w-3 h-3 ${countdown.overdue ? "text-destructive" : "text-muted-foreground"}`} />
                                      <span className="text-muted-foreground">{item.notification}</span>
                                      <span className={`ml-auto font-medium whitespace-nowrap ${countdown.overdue ? "text-destructive" : "text-muted-foreground"}`}>
                                        {countdown.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default PendingByInstitution;
