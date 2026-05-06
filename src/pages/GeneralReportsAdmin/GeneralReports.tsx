import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { inspectionsService } from "@/services/inspectionsService";
import { institutionsService } from "@/services/institutionsService";
import { fiscalsService } from "@/services/fiscalsService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const GeneralReports = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalInspections: 0,
        completed: 0,
        pending: 0,
        complianceRate: 0,
    });
    const [counts, setCounts] = useState({
        institutions: 0,
        fiscals: 0,
    });

    // Mock data for charts if API doesn't provide enough granularity yet
    const monthlyData = [
        { name: "Jan", total: 12 },
        { name: "Fev", total: 19 },
        { name: "Mar", total: 15 },
        { name: "Abr", total: 22 },
        { name: "Mai", total: 28 },
        { name: "Jun", total: 25 },
    ];

    const COLORS = ["#0088FE", "#FF8042", "#FFBB28"];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [dashboardData, instResponse, fiscalsResponse] = await Promise.all([
                inspectionsService.getDashboard(),
                institutionsService.getAll(1, 1),
                fiscalsService.getAll(1, 1)
            ]);

            setStats({
                totalInspections: dashboardData.totalInspections || 0,
                completed: dashboardData.completedThisMonth || 0,
                pending: dashboardData.activeFiscalizations || 0,
                complianceRate: 0
            });
            setCounts({
                institutions: instResponse.totalPages * 10,
                fiscals: 0
            });

        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao carregar dados",
                description: "Algumas informações podem não estar atualizadas.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPDF = async () => {
        const element = document.getElementById("report-content");
        if (!element) return;

        try {
            const canvas = await html2canvas(element);
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF();

            // Add Header
            pdf.setFillColor(0, 56, 168); // Primary Blue
            pdf.rect(0, 0, 210, 20, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(14);
            pdf.text("IntegraCoren - Relatório Geral", 10, 13);

            const date = new Date().toLocaleDateString("pt-BR");
            pdf.setFontSize(10);
            pdf.text(`Gerado em: ${date}`, 170, 13);

            // Add Content
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 0, 30, pdfWidth, pdfHeight); // Offset by 30 for header
            pdf.save("relatorio-geral.pdf");

            toast({
                title: "Relatório exportado",
                description: "O download do PDF foi iniciado.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro na exportação",
                description: "Não foi possível gerar o PDF.",
                variant: "destructive",
            });
        }
    };

    // Update chart data from stats
    const apiStatusData = [
        { name: "Conforme", value: stats.completed },
        { name: "Pendente", value: stats.pending },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/dashboard/admin")}
                            title="Voltar"
                            className="rounded-full"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Relatórios Gerais</h1>
                            <p className="text-muted-foreground mt-1">
                                Visão  global e métricas do sistema de fiscalização
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleExportPDF} className="gap-2">
                        <Download className="w-4 h-4" />
                        Exportar PDF
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div id="report-content" className="grid gap-6 p-4 bg-background">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total de Inspeções</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalInspections}</div>
                                    <p className="text-xs text-muted-foreground">+20.1% em relação ao mês anterior</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Taxa de Conformidade</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.complianceRate.toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground">Média geral das instituições</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Inspeções Pendentes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.pending}</div>
                                    <p className="text-xs text-muted-foreground">Aguardando ação</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Inspeções Concluídas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.completed}</div>
                                    <p className="text-xs text-muted-foreground">Finalizadas com sucesso</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="col-span-1">
                                <CardHeader>
                                    <CardTitle>Inspeções por Status</CardTitle>
                                    <CardDescription>Distribuição das inspeções atuais</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={apiStatusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {apiStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="col-span-1">
                                <CardHeader>
                                    <CardTitle>Evolução Mensal</CardTitle>
                                    <CardDescription>Volume de inspeções nos últimos 6 meses</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="total" fill="#8884d8" name="Inspeções" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneralReports;
