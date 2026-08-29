import { useState, useEffect } from "react";
import { Target, Loader2, Save } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/layout/Header";
import { useUserStore } from "@/stores/userStore";
import { toast } from "sonner";
import { inspectorGoalsService } from "@/services/inspectorGoalsService";
import { MonthProgress } from "@/@types/InspectorGoal";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const Goals = () => {
  const { user } = useUserStore();

  const [year, setYear] = useState(CURRENT_YEAR);
  const [months, setMonths] = useState<MonthProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const [formMonth, setFormMonth] = useState(String(new Date().getMonth() + 1));
  const [formTarget, setFormTarget] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProgress = async (selectedYear: number) => {
    try {
      setLoading(true);
      const data = await inspectorGoalsService.getProgress(selectedYear);
      setMonths(data.months);
    } catch (err) {
      console.error("Erro ao carregar metas:", err);
      toast.error("Não foi possível carregar as metas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress(year);
  }, [year]);

  const handleSaveGoal = async () => {
    const targetCount = parseInt(formTarget, 10);
    if (!formTarget || isNaN(targetCount) || targetCount < 0) {
      toast.error("Informe uma meta válida.");
      return;
    }

    try {
      setSaving(true);
      await inspectorGoalsService.upsert(parseInt(formMonth, 10), year, targetCount);
      toast.success("Meta salva com sucesso!");
      setFormTarget("");
      await loadProgress(year);
    } catch (err) {
      console.error("Erro ao salvar meta:", err);
      toast.error("Não foi possível salvar a meta.");
    } finally {
      setSaving(false);
    }
  };

  const chartData = months.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    Meta: m.targetCount,
    Realizado: m.completedCount,
  }));

  const totalTarget = months.reduce((sum, m) => sum + m.targetCount, 0);
  const totalCompleted = months.reduce((sum, m) => sum + m.completedCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header userType="inspector" userName={user?.name || "Fiscal"} />

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Target className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Metas</h1>
              <p className="text-muted-foreground mt-1">
                Cadastre suas metas mensais e acompanhe o progresso ao longo do ano
              </p>
            </div>
          </div>

          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Cadastrar Meta</CardTitle>
              <CardDescription>Defina o número de fiscalizações planejadas para o mês</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select value={formMonth} onValueChange={setFormMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, index) => (
                      <SelectItem key={index + 1} value={String(index + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Meta (nº de fiscalizações)</Label>
                <Input
                  id="target"
                  type="number"
                  min={0}
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder="Ex: 10"
                />
              </div>

              <Button onClick={handleSaveGoal} disabled={saving} className="w-full">
                {saving ? "Salvando..." : (<><Save className="w-4 h-4 mr-2" />Salvar Meta</>)}
              </Button>

              <div className="pt-4 border-t text-sm text-muted-foreground space-y-1">
                <p>Meta total do ano: <strong>{totalTarget}</strong></p>
                <p>Concluídas até agora: <strong>{totalCompleted}</strong></p>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Progresso em {year}</CardTitle>
              <CardDescription>Meta planejada vs. fiscalizações concluídas por mês</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Meta" fill="#94a3b8" />
                    <Bar dataKey="Realizado" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Goals;
