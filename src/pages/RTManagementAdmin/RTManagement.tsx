import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Eye, ArrowLeft, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import styles from "./RTManagementAdmin.module.css";
import { rtsService, RT } from "@/services/rtsService";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const RTManagement: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [rts, setRts] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState<string | null>(null);

    useEffect(() => {
        loadRts();
    }, []);

    const loadRts = async () => {
        try {
            setLoading(true);
            const response = await rtsService.getAll();
            setRts(response.rts);
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao carregar RTs",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await rtsService.delete(deleteId);
            toast({ title: "RT excluído com sucesso", className: "bg-green-500 text-white" });
            loadRts();
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao excluir RT", variant: "destructive" });
        } finally {
            setDeleteId(null);
            setDeleteName(null);
        }
    };

    const filteredRts = rts.filter(
        (rt) =>
            (rt.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (rt.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (rt.institution?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <div className="container mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/dashboard/admin")}
                            className="p-2 -ml-2 rounded-full hover:bg-muted/50"
                            title="Voltar"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold">Gerenciar Responsáveis Técnicos</h1>
                            <p className="text-muted-foreground mt-1">Cadastre e gerencie os RTs do sistema</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/rts/new")}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo RT
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm mb-6">
                    <div className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, email ou instituição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Rts Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-col space-y-1.5">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight">RTs Cadastrados</h3>
                        <p className="text-sm text-muted-foreground">{filteredRts.length} RTs encontrados</p>
                    </div>
                    <div className="p-6 pt-0">
                        {loading ? (
                            <p>Carregando...</p>
                        ) : (
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nome</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">CRM</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Instituição</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {filteredRts.map((rt) => (
                                            <tr key={rt.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle font-medium">
                                                    {rt.user?.name || 'N/A'}
                                                </td>
                                                <td className="p-4 align-middle">{rt.user?.email || 'N/A'}</td>
                                                <td className="p-4 align-middle">{rt.crm}</td>
                                                <td className="p-4 align-middle">
                                                    {rt.institution?.name || "N/A"}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => navigate(`/admin/rts/new`, { state: { rtId: rt.id } })}
                                                            title="Editar"
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setDeleteId(rt.id);
                                                                setDeleteName(rt.user?.name || "RT");
                                                            }}
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o Responsável Técnico <strong>{deleteName}</strong>?
                            Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default RTManagement;
