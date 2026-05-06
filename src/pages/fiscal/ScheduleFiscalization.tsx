import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, User, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { institutionsService } from "@/services/institutionsService";
import { inspectionsService } from "@/services/inspectionsService";
import { useUserStore } from "@/stores/userStore";
import { toast } from "sonner";
import { Priority } from "@/@types/Inspection";
import type { Institution } from "@/@types/Institution";

const ScheduleFiscalization = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    institutionId: "",
    rtId: "",
    time: "",
    observations: "",
    priority: Priority.MEDIUM,
  });

  // Diagnose Identity
  useEffect(() => {
    console.log('--- DIAGNOSTIC START ---');
    console.log('Logged User:', user);
    console.log('User ID:', user?.id);
    console.log('Inspector Public ID:', user?.inspectorPublicId);
    console.log('--- DIAGNOSTIC END ---');
  }, [user]);

  // Role Validation
  if (user?.role !== 'INSPECTOR') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground">Apenas fiscais podem agendar fiscalizações.</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>Voltar</Button>
      </div>
    );
  }

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Buscar Instituições reais
  const { data: institutionsData, isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsService.getAll(),
  });

  const institutions = institutionsData?.institutions || [];

  // Mutation para criar inspeção
  const createInspectionMutation = useMutation({
    mutationFn: inspectionsService.create,
    onSuccess: () => {
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate("/dashboard/fiscal");
      }, 3000);
    },
    onError: (error) => {
      console.error("Erro ao agendar:", error);
      setShowErrorModal(true);
    }
  });

  const selectedInstitution = institutions.find(i => i.id === formData.institutionId);

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const handleInstitutionChange = (institutionId: string) => {
    const institution = institutions.find(inst => inst.id === institutionId);

    // Auto-selecionar RT APENAS se houver SOMENTE UM
    const defaultRtId = institution?.rts && institution.rts.length === 1
      ? institution.rts[0].id
      : "";

    setFormData(prev => ({
      ...prev,
      institutionId,
      rtId: defaultRtId
    }));
  };

  const handleSchedule = () => {
    if (!date || !formData.institutionId || !formData.time || !formData.rtId || !user?.inspectorPublicId) {
      if (!user?.inspectorPublicId) {
        toast.error("Erro: Identificador de fiscal não encontrado. Faça login novamente.");
      }
      return;
    }

    // Combinar data e hora
    const [hours, minutes] = formData.time.split(':').map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    createInspectionMutation.mutate({
      institutionPublicId: formData.institutionId,
      // inspectorPublicId: user.inspectorPublicId!, // Handled by backend via JWT token
      responsibleTechnicianPublicId: formData.rtId,
      date: scheduledDate.toISOString(),
      priority: formData.priority,
      observations: formData.observations,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userType="inspector" userName={user?.name || "Fiscal"} />

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agendar Fiscalização</h1>
            <p className="text-muted-foreground mt-1">
              Configure uma nova fiscalização e notifique o responsável técnico
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Fiscalização</CardTitle>
              <CardDescription>
                Preencha as informações para agendar a fiscalização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Institution Selection */}
              <div className="space-y-2">
                <Label htmlFor="institution">Instituição</Label>
                <Select value={formData.institutionId} onValueChange={handleInstitutionChange} disabled={isLoadingInstitutions}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingInstitutions ? "Carregando..." : "Selecione a instituição"} />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((institution) => (
                      <SelectItem key={institution.id} value={institution.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {institution.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* RT Selection / Display */}
              {selectedInstitution && (
                <div className="space-y-2">
                  <Label>Responsável Técnico</Label>

                  {selectedInstitution.rts && selectedInstitution.rts.length > 0 ? (
                    <Select
                      value={formData.rtId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, rtId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o RT" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedInstitution.rts.map(rt => (
                          <SelectItem key={rt.id} value={rt.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {rt.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Esta instituição não possui RT vinculado. Não é possível agendar.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Data da Fiscalização</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"
                        }`}
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
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Select value={formData.time} onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}>
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

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Priority) =>
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
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

              {/* Observations */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Adicione observações ou instruções especiais para a fiscalização..."
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSchedule}
                className="w-full bg-gradient-to-r from-primary to-primary-dark"
                disabled={
                  !formData.institutionId ||
                  !date ||
                  !formData.time ||
                  !formData.rtId ||
                  createInspectionMutation.isPending
                }
              >
                {createInspectionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Confirmar Agendamento
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Agendamento</CardTitle>
              <CardDescription>
                Verifique os dados antes de confirmar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formData.institutionId && date && formData.time ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h3 className="font-semibold text-primary mb-3">Detalhes da Fiscalização</h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Instituição:</span>
                        <span>{selectedInstitution?.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">RT:</span>
                        <span>
                          {selectedInstitution?.rts?.find(rt => rt.id === formData.rtId)?.name || "Selecione..."}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Data:</span>
                        <span>{format(date, "PPP", { locale: ptBR })}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Horário:</span>
                        <span>{formData.time}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Prioridade:</span>
                        <span className={
                          formData.priority === Priority.HIGH || formData.priority === Priority.CRITICAL ? "text-destructive" :
                            formData.priority === Priority.MEDIUM ? "text-warning" :
                              "text-muted-foreground"
                        }>
                          {formData.priority === Priority.CRITICAL ? "Crítica" :
                            formData.priority === Priority.HIGH ? "Alta" :
                              formData.priority === Priority.MEDIUM ? "Média" : "Baixa"}
                        </span>
                      </div>
                    </div>

                    {formData.observations && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="font-medium text-sm">Observações:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formData.observations}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                    <h4 className="font-medium text-success mb-2">O que acontece após confirmar?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• O RT será notificado automaticamente</li>
                      <li>• A fiscalização aparecerá no seu dashboard</li>
                      <li>• Um checklist será criado para a fiscalização</li>
                      <li>• Lembretes serão enviados próximo à data</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Preencha os dados do formulário para visualizar o resumo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
                <DialogTitle className="text-xl font-bold text-center">Agendamento Confirmado!</DialogTitle>
                <DialogDescription className="text-center">
                  A fiscalização foi agendada com sucesso. Você será redirecionado para o dashboard em instantes.
                </DialogDescription>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Error Modal */}
        <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <AlertCircle className="h-16 w-16 text-red-500 animate-in zoom-in duration-300" />
                <DialogTitle className="text-xl font-bold text-center">Falha no Agendamento</DialogTitle>
                <DialogDescription className="text-center">
                  Ocorreu um erro ao tentar agendar a fiscalização. Por favor, verifique os dados e tente novamente.
                </DialogDescription>
                <Button variant="outline" onClick={() => setShowErrorModal(false)}>
                  Fechar
                </Button>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ScheduleFiscalization;