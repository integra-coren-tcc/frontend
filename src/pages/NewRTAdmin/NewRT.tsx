import { useState, useEffect } from "react";
import { ArrowLeft, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Header from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { rtsService } from "@/services/rtsService";
import { institutionsService } from "@/services/institutionsService";
import { Institution } from "@/@types/Institution";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { isValidCpf, maskCpf, onlyCpfDigits } from "@/lib/cpf";

// "2026-10-07T23:59:59.999-03:00" -> "2026-10-07" (dia no horário de Brasília)
const toDateInput = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) : "";

const NewRT = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [rtId, setRtId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        crm: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        institutionId: "",
        cpf: "",
        crtNumber: "",
        crtValidUntil: "",
    });

    useEffect(() => {
        loadInstitutions();
        if (location.state?.rtId) {
            setIsEditing(true);
            setRtId(location.state.rtId);
            loadRT(location.state.rtId);
        }
    }, [location]);

    const loadRT = async (id: string) => {
        try {
            const rt = await rtsService.getById(id);
            setFormData({
                name: rt.user?.name || "",
                crm: rt.crm || "",
                email: rt.user?.email || "",
                phone: "",
                password: "",
                confirmPassword: "",
                institutionId: rt.institutionId ? String(rt.institutionId) : "",
                cpf: rt.cpf ? maskCpf(rt.cpf) : "",
                crtNumber: rt.crtNumber || "",
                crtValidUntil: toDateInput(rt.crtValidUntil),
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao carregar dados",
                variant: "destructive",
            });
        }
    };

    const loadInstitutions = async () => {
        try {
            const response = await institutionsService.getAll();
            setInstitutions(response.institutions);
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao carregar instituições",
                description: "Não foi possível carregar a lista de instituições.",
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

        if (formData.cpf && !isValidCpf(formData.cpf)) {
            toast({
                title: "Erro na validação",
                description: "CPF inválido.",
                variant: "destructive",
            });
            return;
        }

        const crtData = {
            cpf: formData.cpf ? onlyCpfDigits(formData.cpf) : undefined,
            crtNumber: formData.crtNumber || undefined,
            crtValidUntil: formData.crtValidUntil || undefined,
        };

        // Create Mode Validation
        if (!isEditing) {
            if (formData.password !== formData.confirmPassword) {
                toast({
                    title: "Erro na validação",
                    description: "As senhas não coincidem.",
                    variant: "destructive",
                });
                return;
            }

            if (!formData.institutionId) {
                toast({
                    title: "Erro na validação",
                    description: "Selecione uma instituição.",
                    variant: "destructive",
                });
                return;
            }
        }

        setIsLoading(true);

        try {
            if (isEditing && rtId) {
                // Partial Update - Only Contact Details
                await rtsService.update(rtId, {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    ...crtData,
                });
                toast({ title: "RT atualizado com sucesso!" });
            } else {
                // Create Mode - Full Payload
                await rtsService.create({
                    name: formData.name,
                    email: formData.email,
                    crm: formData.crm,
                    password: formData.password,
                    institutionId: formData.institutionId,
                    ...crtData,
                });
                toast({ title: "RT cadastrado com sucesso!" });
            }

            navigate("/admin/rts");
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao salvar RT",
                description: getErrorMessage(error, "Tente novamente mais tarde."),
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
                {/* Page Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/admin/rts")}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            {isEditing ? "Editar Responsável Técnico" : "Novo Responsável Técnico"}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {isEditing ? "Atualize os dados do RT" : "Cadastre um novo RT no sistema e vincule a uma instituição"}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Informações Pessoais
                            </CardTitle>
                            <CardDescription>
                                Dados do RT
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="Dr. João Silva"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="crm">CRM *</Label>
                                    <Input
                                        id="crm"
                                        value={formData.crm}
                                        onChange={(e) => handleInputChange("crm", e.target.value)}
                                        placeholder="123456/SP"
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
                                        placeholder="rt@saude.gov.br"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CPF e CRT (v3): login por CPF e bloqueio de acesso com CRT vencida */}
                    <Card>
                        <CardHeader>
                            <CardTitle>CPF e Certidão de Responsabilidade Técnica</CardTitle>
                            <CardDescription>
                                O RT pode entrar no sistema com o CPF. Com a CRT vencida, o acesso é bloqueado até a renovação; o RT é avisado 30 dias antes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cpf">CPF</Label>
                                    <Input
                                        id="cpf"
                                        inputMode="numeric"
                                        value={formData.cpf}
                                        onChange={(e) => handleInputChange("cpf", maskCpf(e.target.value))}
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="crtNumber">Número da CRT</Label>
                                    <Input
                                        id="crtNumber"
                                        value={formData.crtNumber}
                                        onChange={(e) => handleInputChange("crtNumber", e.target.value)}
                                        placeholder="CRT-0001/2026"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="crtValidUntil">Validade da CRT</Label>
                                    <Input
                                        id="crtValidUntil"
                                        type="date"
                                        value={formData.crtValidUntil}
                                        onChange={(e) => handleInputChange("crtValidUntil", e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Institution Link - Only Show in CREATE mode */}
                    {!isEditing && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Vínculo Institucional</CardTitle>
                                <CardDescription>
                                    Selecione a instituição onde o RT atua
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="institution">Instituição *</Label>
                                    <Select value={formData.institutionId} onValueChange={(value) => handleInputChange("institutionId", value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a instituição" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {institutions.map(inst => (
                                                <SelectItem key={inst.id} value={String(inst.id)}>{inst.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Access Credentials */}
                    {!isEditing && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Credenciais de Acesso</CardTitle>
                                <CardDescription>
                                    Configuração de login no sistema
                                </CardDescription>
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
                                            placeholder="Mínimo 8 caracteres"
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            O RT deverá alterar a senha no primeiro acesso
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                            placeholder="Digite a senha novamente"
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
                            onClick={() => navigate("/admin/rts")}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-primary to-primary-dark"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isEditing ? "Salvar Alterações" : "Cadastrar RT"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewRT;
