import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FIXED_CHECKLIST_ITEMS, FixedChecklistItem } from "@/constants/fixed-items";

const StandardChecklist = () => {
    const navigate = useNavigate();

    // Group items by category
    const groupedItems = FIXED_CHECKLIST_ITEMS.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, FixedChecklistItem[]>);

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case "ILEGALIDADE": return "Ilegalidades";
            case "IRREGULARIDADE": return "Irregularidades";
            case "INFRACAO_ETICA": return "Infrações Éticas";
            case "QUESTAO_TRABALHISTA": return "Questões Trabalhistas";
            default: return category;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "ILEGALIDADE": return "text-red-600 bg-red-50 border-red-200";
            case "IRREGULARIDADE": return "text-orange-600 bg-orange-50 border-orange-200";
            case "INFRACAO_ETICA": return "text-purple-600 bg-purple-50 border-purple-200";
            case "QUESTAO_TRABALHISTA": return "text-blue-600 bg-blue-50 border-blue-200";
            default: return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const categories = Object.keys(groupedItems) as Array<keyof typeof groupedItems>;

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
