import { useState, useEffect } from "react";
import { ArrowLeft, Save, Calendar, MapPin, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/layout/Header";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from "@/stores/userStore";

const EditFiscalization = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    institution: "",
    date: "",
    time: "",
    estimatedDuration: "2",
    priority: "normal",
    type: "routine",
    observations: "",
    rtName: "",
    rtPhone: "",
    rtEmail: "",
    address: "",
    neighborhood: "",
    city: "",
  });

  // Mock institutions data
  const institutions = [
    { id: "1", name: "UBS Vila Nova", rt: "Dr. Carlos Silva", address: "Rua das Flores, 123" },
    { id: "2", name: "UBS Centro", rt: "Dra. Maria Santos", address: "Av. Principal, 456" },
    { id: "3", name: "UBS Jardim América", rt: "Dr. João Oliveira", address: "Rua do Hospital, 789" },
  ];

  // Simulate loading existing data
  useEffect(() => {
    const loadFiscalizationData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - in real app, this would come from API
        setFormData({
          institution: "1",
          date: "2024-01-25",
          time: "09:00",
          estimatedDuration: "2",
          priority: "normal",
          type: "routine",
          observations: "Fiscalização de rotina agendada. Verificar conformidade geral da unidade.",
          rtName: "Dr. Carlos Silva",
          rtPhone: "(11) 99999-9999",
          rtEmail: "carlos.silva@saude.sp.gov.br",
          address: "Rua das Flores, 123",
          neighborhood: "Vila Nova",
          city: "São Paulo",
        });
      } catch (error) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados da fiscalização.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFiscalizationData();
  }, [id, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-fill RT data when institution changes
    if (field === "institution") {
      const selectedInstitution = institutions.find(inst => inst.id === value);
      if (selectedInstitution) {
        setFormData(prev => ({
          ...prev,
          rtName: selectedInstitution.rt,
          address: selectedInstitution.address,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Fiscalização atualizada com sucesso!",
        description: "As alterações foram salvas.",
      });

      navigate("/dashboard/fiscal");
    } catch (error) {
      toast({
        title: "Erro ao atualizar fiscalização",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header userType="inspector" userName={user?.name || "Fiscal"} />
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-muted-foreground">Carregando dados da fiscalização...</div>
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
          {/* Institution and Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Instituição e Localização
              </CardTitle>
              <CardDescription>
                Selecione a instituição a ser fiscalizada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Instituição *</Label>
                <Select
                  value={formData.institution}
                  onValueChange={(value) => handleInputChange("institution", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a instituição" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((institution) => (
                      <SelectItem key={institution.id} value={institution.id}>
                        {institution.name} - {institution.rt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Endereço da instituição"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date and Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Data e Horário
              </CardTitle>
              <CardDescription>
                Configure quando a fiscalização será realizada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Duração Estimada</Label>
                  <Select
                    value={formData.estimatedDuration}
                    onValueChange={(value) => handleInputChange("estimatedDuration", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="1.5">1h 30min</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="2.5">2h 30min</SelectItem>
                      <SelectItem value="3">3 horas</SelectItem>
                      <SelectItem value="3.5">3h 30min</SelectItem>
                      <SelectItem value="4">4 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fiscalization Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Detalhes da Fiscalização
              </CardTitle>
              <CardDescription>
                Configure o tipo e prioridade da fiscalização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Fiscalização</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Rotina</SelectItem>
                      <SelectItem value="complaint">Por Denúncia</SelectItem>
                      <SelectItem value="follow-up">Acompanhamento</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                Dados de contato do responsável técnico da instituição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rtName">Nome do RT</Label>
                <Input
                  id="rtName"
                  value={formData.rtName}
                  onChange={(e) => handleInputChange("rtName", e.target.value)}
                  placeholder="Nome do responsável técnico"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rtPhone">Telefone do RT</Label>
                  <Input
                    id="rtPhone"
                    value={formData.rtPhone}
                    onChange={(e) => handleInputChange("rtPhone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rtEmail">Email do RT</Label>
                  <Input
                    id="rtEmail"
                    type="email"
                    value={formData.rtEmail}
                    onChange={(e) => handleInputChange("rtEmail", e.target.value)}
                    placeholder="rt@instituicao.com.br"
                  />
                </div>
              </div>
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
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-primary-dark"
            >
              {isLoading ? (
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