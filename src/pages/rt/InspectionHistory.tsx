import { useState, useEffect } from "react";
import { History, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { inspectionsService } from "@/services/inspectionsService";
import { Inspection, InspectionStatus } from "@/@types/Inspection";

const STATUS_LABELS: Record<string, string> = {
  [InspectionStatus.SCHEDULED]: "Agendada",
  [InspectionStatus.IN_PROGRESS]: "Em Andamento",
  [InspectionStatus.IN_PROGRESS_INSPECTOR]: "Em Andamento (Fiscal)",
  [InspectionStatus.AWAITING_CORRECTION]: "Aguardando Correção",
  [InspectionStatus.COMPLETED]: "Concluída",
};

const InspectionHistory = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await inspectionsService.getAll();
        // Mais recentes primeiro
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setInspections(data);
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
        setError("Não foi possível carregar o histórico de fiscalizações.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header userType="rt" userName={user?.name || "RT"} />

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <History className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Histórico da Instituição</h1>
            <p className="text-muted-foreground mt-1">
              Todas as fiscalizações já realizadas na sua instituição, para consulta (somente visualização)
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fiscalizações</CardTitle>
            <CardDescription>
              {inspections.length} fiscalizaç{inspections.length === 1 ? "ão" : "ões"} encontrada{inspections.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <AlertCircle className="w-8 h-8" />
                <p>{error}</p>
              </div>
            ) : inspections.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                Nenhuma fiscalização registrada ainda para esta instituição.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fiscal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((inspection) => (
                    <TableRow
                      key={inspection.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/rt/history/${inspection.id}`)}
                    >
                      <TableCell>{new Date(inspection.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{inspection.inspector?.user.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {STATUS_LABELS[inspection.status] || inspection.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{inspection.priority}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InspectionHistory;
