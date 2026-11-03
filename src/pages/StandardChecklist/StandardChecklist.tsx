import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FIXED_CHECKLIST_ITEMS, FixedChecklistItem } from "@/constants/fixed-items";

const StandardChecklist = () => {
    const navigate = useNavigate();

    // Agrupa conforme o documento de Notificação Pessoa Jurídica (item 3.x)
    const NOTIF_TITLES: Record<string, string> = {
        "3.0": "Inexistência ou inadequação de planejamento e programação da atividade de Enfermagem",
        "3.3": "Inexistência de Enfermeiro em setor ou período em que são desenvolvidas atividades de Enfermagem",
        "3.5": "Exercício Ilegal da Enfermagem",
        "3.6": "Inexistência de anotação de responsabilidade técnica do serviço de Enfermagem",
        "3.7": "Inexistência de Registro de Empresa",
        "3.8": "Profissional exercendo atividade com impedimento por processo ético transitado em julgado",
        "3.10": "Inexistência ou número insuficiente de profissionais de Enfermagem em evento esportivo",
        "3.12": "Técnico(s) e/ou auxiliar(es) sem supervisão, orientação e direção de enfermeiro",
        "3.13": "Inexistência ou inadequação de documento(s) de gerenciamento dos processos de trabalho",
        "3.14": "Inexistência ou inadequação dos registros relativos à assistência de Enfermagem",
        "3.15": "Inexistência de Comissões de Ética de Enfermagem",
    };
    const notifOf = (item: FixedChecklistItem) => item.description.match(/^Notif\. (\d+\.\d+)/)?.[1] ?? "";
    const groupedItems = FIXED_CHECKLIST_ITEMS.reduce((acc, item) => {
        const key = notifOf(item);
        (acc[key] ||= []).push(item);
        return acc;
    }, {} as Record<string, FixedChecklistItem[]>);

    const isIlegal = (key: string) => Number(key.split(".")[1]) <= 12;
    const getCategoryLabel = (key: string) => `${key} – ${NOTIF_TITLES[key] ?? "Outras notificações"} (${isIlegal(key) ? "Ilegalidade" : "Irregularidade"})`;
    const getCategoryColor = (key: string) => isIlegal(key) ? "text-red-600 bg-red-50 border-red-200" : "text-orange-600 bg-orange-50 border-orange-200";

    const categories = Object.keys(groupedItems).sort((x, y) => { const [a1, a2] = x.split(".").map(Number), [b1, b2] = y.split(".").map(Number); return a1 - b1 || a2 - b2; });

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/dashboard/fiscal")}
                        className="h-10 w-10"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Checklist Padrão
                        </h1>
                        <p className="text-muted-foreground">
                            Consulta rápida dos itens de verificação e prazos padrão.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="grid gap-6">
                    {categories.map((category) => (
                        <div key={category} className="space-y-4">
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${getCategoryColor(category)}`}>
                                <AlertTriangle className="h-5 w-5" />
                                <h2 className="font-semibold text-lg">{getCategoryLabel(category)}</h2>
                            </div>

                            <div className="bg-card rounded-lg border shadow-sm">
                                <Accordion type="single" collapsible className="w-full">
                                    {groupedItems[category].map((item, index) => (
                                        <AccordionItem key={item.code} value={item.code} className="px-4">
                                            <AccordionTrigger className="hover:no-underline py-4">
                                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-left w-full">
                                                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground whitespace-nowrap">
                                                        {item.code}
                                                    </span>
                                                    <span className="text-sm font-medium flex-1 mr-4">
                                                        {item.description.length > 80
                                                            ? item.description.substring(0, 80) + "..."
                                                            : item.description}
                                                    </span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-4 pt-1 text-muted-foreground">
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-muted/30 rounded-md border border-border/50">
                                                        <div className="flex items-start gap-3">
                                                            <FileText className="h-5 w-5 text-primary mt-0.5" />
                                                            <div className="space-y-1">
                                                                <p className="font-semibold text-foreground text-sm">Descrição Detalhada</p>
                                                                <p className="text-sm leading-relaxed">{item.description}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="h-4 w-4" />
                                                        <span className="font-medium text-foreground">Prazo Padrão:</span>
                                                        {item.defaultDeadlineDays === 0 ? (
                                                            <Badge variant="destructive" className="font-normal">Imediato</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="font-normal">
                                                                {item.defaultDeadlineDays} dias
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StandardChecklist;
