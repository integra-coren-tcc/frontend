import { useState, useEffect } from "react";
import { ArrowLeft, Save, Calendar as CalendarIcon, MapPin, User, Clock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/layout/Header";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";
import { inspectionsService } from "@/services/inspectionsService";
import { Inspection, InspectionStatus, Priority } from "@/@types/Inspection";
import { getErrorMessage } from "@/lib/getErrorMessage";

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00"
];

const EditFiscalization = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUserStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);

  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    time: "",
    priority: Priority.MEDIUM,
    observations: "",
    manualRtName: "",
    manualRtCrm: "",
  });

  useEffect(() => {
    if (!id) return;

    const loadFiscalizationData = async () => {
      try {
        setIsLoadingData(true);
        setLoadError(null);

        const data = await inspectionsService.getById(id);
        setInspection(data);

        const scheduledDate = new Date(data.date);
        setDate(scheduledDate);

        setFormData({
          time: format(scheduledDate, "HH:mm"),
          priority: data.priority,
          observations: data.observations || "",
          manualRtName: data.manualRtName || "",
          manualRtCrm: data.manualRtCrm || "",
        });
      } catch (error) {
        console.error("Erro ao carregar fiscalização:", error);
        setLoadError("Não foi possível carregar os dados da fiscalização.");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFiscalizationData();
  }, [id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const hasRealRt = !!inspection?.responsibleTechnician;
  const canEdit = inspection?.status === InspectionStatus.SCHEDULED;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !date) return;

    const [hours, minutes] = formData.time.split(":").map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    setIsSaving(true);
    try {
      await inspectionsService.update(id, {
        date: scheduledDate.toISOString(),
        priority: formData.priority,
        observations: formData.observations,
        ...(hasRealRt
          ? {}
          : {
            manualRtName: formData.manualRtName || undefined,
            manualRtCrm: formData.manualRtCrm || undefined,
          }),
      });

      toast.success("Fiscalização atualizada com sucesso!");
      navigate("/dashboard/fiscal");
    } catch (error: unknown) {
      console.error("Erro ao atualizar fiscalização:", error);
      toast.error(getErrorMessage(error, "Não foi possível atualizar a fiscalização."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header userType="inspector" userName={user?.name || "Fiscal"} />
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !inspection) {
    return (
      <div className="min-h-screen bg-background">
        <Header userType="inspector" userName={user?.name || "Fiscal"} />
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-muted-foreground">{loadError || "Fiscalização não encontrada."}</p>
            <Button variant="outline" onClick={() => navigate("/dashboard/fiscal")}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-background">
        <Header userType="inspector" userName={user?.name || "Fiscal"} />
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Esta fiscalização já está em andamento ou foi concluída e não pode mais ser editada.
            </p>
            <Button variant="outline" onClick={() => navigate("/dashboard/fiscal")}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userType="inspector" userName={user?.name || "Fiscal"} />

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard/fiscal")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar Fiscalização</h1>
            <p className="text-muted-foreground mt-1">
              Atualize os dados da fiscalização agendada
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Institution (read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Instituição
              </CardTitle>
              <CardDescription>
                A instituição não pode ser alterada após o agendamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input value={inspection.institution?.name || ""} disabled />
              {inspection.institution?.address && (
                <Input value={inspection.institution.address} disabled />
              )}
            </CardContent>
          </Card>

          {/* Date and Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Data e Horário
              </CardTitle>
              <CardDescription>
                Configure quando a fiscalização será realizada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <Select value={formData.time} onValueChange={(value) => handleInputChange("time", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority and observations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Detalhes da Fiscalização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Priority) => handleInputChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Priority.CRITICAL}>Crítica - Imediata</SelectItem>
                    <SelectItem value={Priority.HIGH}>Alta - Urgente</SelectItem>
                    <SelectItem value={Priority.MEDIUM}>Média - Normal</SelectItem>
                    <SelectItem value={Priority.LOW}>Baixa - Rotina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => handleInputChange("observations", e.target.value)}
                  placeholder="Observações adicionais sobre a fiscalização..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Responsible Technician */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Responsável Técnico
              </CardTitle>
              <CardDescription>
                {hasRealRt
                  ? "RT vinculado à instituição"
                  : "Esta instituição não possui RT cadastrado. Você pode informar os dados aqui ou ao iniciar a fiscalização."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasRealRt ? (
                <div className="space-y-2">
                  <Input value={inspection.responsibleTechnician?.user.name || ""} disabled />
                  <Input value={inspection.responsibleTechnician?.crm || ""} disabled />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manualRtName">Nome do RT</Label>
                    <Input
                      id="manualRtName"
                      value={formData.manualRtName}
                      onChange={(e) => handleInputChange("manualRtName", e.target.value)}
                      placeholder="Nome do responsável técnico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manualRtCrm">COREN</Label>
                    <Input
                      id="manualRtCrm"
                      value={formData.manualRtCrm}
                      onChange={(e) => handleInputChange("manualRtCrm", e.target.value)}
                      placeholder="Número de registro no COREN"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/fiscal")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !date || !formData.time}
              className="bg-gradient-to-r from-primary to-primary-dark"
            >
              {isSaving ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFiscalization;
