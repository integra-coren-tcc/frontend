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
                    {group.inspections.map((inspection) => (
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
                          {inspection.nearDeadlineItems.length > 0 && (
                            <Badge variant="destructive">
                              {inspection.nearDeadlineItems.length} perto do prazo
                            </Badge>
                          )}
                        </div>

                        {inspection.nearDeadlineItems.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {inspection.nearDeadlineItems.map((item) => (
                              <div
                                key={item.itemCode}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                              >
                                <Clock className="w-3 h-3" />
                                <span>{item.notification}</span>
                                <span className="ml-auto">
                                  {new Date(item.deadline).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
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
