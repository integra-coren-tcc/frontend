import { useState, useEffect } from "react";
import { ArrowLeft, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { fiscalsService } from "@/services/fiscalsService";

const NewFiscal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fiscalId, setFiscalId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    cpf: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (location.state?.fiscalId) {
      setIsEditing(true);
      setFiscalId(location.state.fiscalId);
      loadFiscal(location.state.fiscalId);
    }
  }, [location]);

  const loadFiscal = async (id: string) => {
    try {
      const fiscal = await fiscalsService.getById(id);
      setFormData({
        fullName: fiscal.user?.name || "",
        cpf: fiscal.cpf || "",
        email: fiscal.user?.email || "",
        phone: "", // API might not verify this yet
        password: "", // Don't fill password
        confirmPassword: "",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao carregar dados",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing && formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro na validação",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && fiscalId) {
        await fiscalsService.update(fiscalId, {
          name: formData.fullName,
          email: formData.email,
        });
        toast({ title: "Fiscal atualizado com sucesso!" });
      } else {
        await fiscalsService.create({
          name: formData.fullName,
          email: formData.email,
          cpf: formData.cpf,
          password: formData.password,
        });
        toast({ title: "Fiscal cadastrado com sucesso!" });
      }

      navigate("/admin/fiscals");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar fiscal",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin/fiscals")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditing ? "Editar Fiscal" : "Novo Fiscal"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? "Atualize os dados do fiscal" : "Cadastre um novo fiscal no sistema"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    disabled={isEditing}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {!isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Credenciais de Acesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha Temporária *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/fiscals")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-primary-dark"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? "Salvar Alterações" : "Cadastrar Fiscal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewFiscal;