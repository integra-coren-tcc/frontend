import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, AlertCircle, Paperclip, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import { useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { inspectionsService } from "@/services/inspectionsService";
import { Inspection } from "@/@types/Inspection";
import { ItemType } from "@/@types/ChecklistItem";
import { getErrorStatus } from "@/lib/getErrorMessage";

const CATEGORY_MAP: Record<ItemType, string> = {
  [ItemType.ILEGALIDADE]: "Ilegalidades",
  [ItemType.IRREGULARIDADE]: "Irregularidades",
  [ItemType.INFRACAO_ETICA]: "Infrações Éticas",
  [ItemType.QUESTAO_TRABALHISTA]: "Questões Trabalhistas",
};

const STATUS_VARIANT: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  COMPLIANT: "default",
  NOT_APPLICABLE: "secondary",
  NON_COMPLIANT: "destructive",
  AWAITING_CORRECTION: "destructive",
  AWAITING_ANALYSIS: "outline",
  PENDING: "outline",
};

const InspectionHistoryDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUserStore();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await inspectionsService.getById(id);
        setInspection(data);
      } catch (err: unknown) {
        console.error("Erro ao carregar fiscalização:", err);
        setError(
          getErrorStatus(err) === 403
            ? "Você não tem acesso a esta fiscalização."
            : "Não foi possível carregar os dados da fiscalização."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header userType="rt" userName={user?.name || "RT"} />
        <div className="container mx-auto px-6 py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-background">
        <Header userType="rt" userName={user?.name || "RT"} />
        <div className="container mx-auto px-6 py-8 flex flex-col items-center gap-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-muted-foreground">{error || "Fiscalização não encontrada."}</p>
          <Button variant="outline" onClick={() => navigate("/rt/history")}>Voltar</Button>
        </div>
      </div>
    );
  }

  const categories = Object.keys(CATEGORY_MAP) as ItemType[];

  return (
    <div className="min-h-screen bg-background">
      <Header userType="rt" userName={user?.name || "RT"} />

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate("/rt/history")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fiscalização — Somente Leitura</h1>
            <p className="text-muted-foreground mt-1">
              {inspection.institution?.name} · {new Date(inspection.date).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <Badge variant="outline" className="ml-auto">{inspection.status}</Badge>
        </div>

        {categories.map((category) => {
          const items = inspection.checklistItems.filter((item) => item.itemType === category);
          if (items.length === 0) return null;

          return (
            <Card key={category} className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">{CATEGORY_MAP[category]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => {
                  const reportableComments = item.comments ?? [];

                  return (
                    <div key={item.publicId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-medium text-sm">{item.itemCode}</p>
                          <p className="text-sm text-muted-foreground">{item.notification}</p>
                        </div>
                        <Badge variant={STATUS_VARIANT[item.status] ?? "outline"}>{item.status}</Badge>
                      </div>

                      {item.justification && (
                        <p className="text-sm bg-destructive/5 border border-destructive/20 rounded-md p-2 mb-2">
                          <strong>Motivo:</strong> {item.justification}
                        </p>
                      )}

                      {item.deadline && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Clock className="w-4 h-4" />
                          Prazo: {new Date(item.deadline).toLocaleDateString("pt-BR")}
                        </div>
                      )}

                      {reportableComments.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {reportableComments.map((comment) => (
                            <div key={comment.publicId} className="text-sm bg-muted/40 rounded-md p-2">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span className="font-medium">{comment.user.name}</span>
                                <span>{new Date(comment.createdAt).toLocaleString("pt-BR")}</span>
                              </div>
                              <p>{comment.text}</p>
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {comment.attachments.map((att) => (
                                    <span key={att.publicId} className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Paperclip className="w-3 h-3" />
                                      {att.originalName || "Anexo"}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default InspectionHistoryDetail;
