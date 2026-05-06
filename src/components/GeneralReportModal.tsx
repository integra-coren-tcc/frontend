import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { inspectionsService } from "@/services/inspectionsService";
import { institutionsService } from "@/services/institutionsService";
import { fiscalsService } from "@/services/fiscalsService";
import { useToast } from "@/hooks/use-toast";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface GeneralReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GeneralReportModal: React.FC<GeneralReportModalProps> = ({ isOpen, onClose }) => {
    const { toast } = useToast();
    const [stats, setStats] = useState({
        totalInspections: 0,
        completed: 0,
        pending: 0,
        complianceRate: 0,
    });
    const [loading, setLoading] = useState(false);

    // Mock chart data (since backend mostly gives aggregated numbers, we simulate distribution for now)
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
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            setLoading(true);
            const dashboardData = await inspectionsService.getDashboard();
            setStats({
                totalInspections: dashboardData.totalInspections || 0,
                completed: dashboardData.completedThisMonth || 0,
                pending: dashboardData.activeFiscalizations || 0,
                complianceRate: 0
            });
        } catch (error) {
            console.error("Erro ao carregar dados do relatório:", error);
            toast({
                title: "Erro ao carregar relatório",
                description: "Não foi possível obter os dados atualizados.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        const element = document.getElementById("report-content");
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Header Background
            pdf.setFillColor(0, 56, 168); // Primary Blue
            pdf.rect(0, 0, pdfWidth, 40, "F");

            // Header Text
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(24);
            pdf.setFont("helvetica", "bold");
            pdf.text("IntegraCoren", 20, 25);

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "normal");
            pdf.text("Relatório Geral Administrativo", 20, 35);

            // Date
            const today = new Date().toLocaleDateString("pt-BR");
            pdf.setFontSize(10);
            pdf.text(`Gerado em: ${today}`, pdfWidth - 20, 35, { align: "right" });

            // Content
            const imgProps = pdf.getImageProperties(imgData);
            const contentHeight = (imgProps.height * (pdfWidth - 40)) / imgProps.width;

            pdf.addImage(imgData, "PNG", 20, 50, pdfWidth - 40, contentHeight);

            // Footer
            const pageCount = pdf.getNumberOfPages();
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.text(`Página ${i} de ${pageCount}`, pdfWidth / 2, pdfHeight - 10, { align: "center" });
            }

            pdf.save("relatorio-geral-modal.pdf");

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

    const apiStatusData = [
        { name: "Conforme", value: stats.completed },
        { name: "Pendente", value: stats.pending },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Relatório Geral Administrativo</DialogTitle>
                    <DialogDescription>Resumo dos indicadores do sistema</DialogDescription>
                </DialogHeader>

                <div id="report-content" className="space-y-6 py-4">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg bg-card">
                            <p className="text-sm font-medium text-muted-foreground">Total de Inspeções</p>
                            <h3 className="text-2xl font-bold">{stats.totalInspections}</h3>
                        </div>
                        <div className="p-4 border rounded-lg bg-card">
                            <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                            <h3 className="text-2xl font-bold text-green-600">{stats.completed}</h3>
                        </div>
                        <div className="p-4 border rounded-lg bg-card">
                            <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                            <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-[300px] border rounded-lg p-4">
                            <h4 className="mb-4 font-semibold">Status das Inspeções</h4>
                            <ResponsiveContainer width="100%" height="80%">
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
                        </div>
                        <div className="h-[300px] border rounded-lg p-4">
                            <h4 className="mb-4 font-semibold">Evolução Mensal</h4>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total" fill="#8884d8" name="Inspeções" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                    <Button onClick={handleExportPDF} className="gap-2">
                        <Download className="w-4 h-4" />
                        Exportar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default GeneralReportModal;
