import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import styles from "./FiscalManagementAdmin.module.css";
import { fiscalsService } from "@/services/fiscalsService";
import { Inspector } from "@/services/fiscalsService";
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

const FiscalManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [fiscals, setFiscals] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string | null>(null);

  useEffect(() => {
    loadFiscals();
  }, []);

  const loadFiscals = async () => {
    try {
      setLoading(true);
      const response = await fiscalsService.getAll();
      setFiscals(response.inspectors);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao carregar fiscais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fiscalsService.delete(deleteId);
      toast({ title: "Fiscal excluído com sucesso", className: "bg-green-500 text-white" });
      loadFiscals();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao excluir fiscal", variant: "destructive" });
    } finally {
      setDeleteId(null);
      setDeleteName(null);
    }
  };

  const filteredFiscals = fiscals.filter(
    (fiscal) =>
      (fiscal.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fiscal.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.fiscalManagementContainer}>
      <Header />

      <div className={styles.pageContainer}>
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard/admin")}
                className="p-2 -ml-2 rounded-full hover:bg-muted/50"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">Gerenciar Fiscais</h1>
                <p className="text-muted-foreground mt-1">
                  Cadastre e gerencie os fiscais do sistema
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/fiscals/new")}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            <Plus className={styles.buttonIcon} style={{ marginRight: "0.5rem" }} />
            Novo Fiscal
          </button>
        </div>

        {/* Search and Filters */}
        <div className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fiscals Table */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Fiscais Cadastrados</h2>
            <p className={styles.cardDescription}>{filteredFiscals.length} fiscais encontrados</p>
          </div>
          <div className={styles.cardContent}>
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr className={styles.tableHeaderRow}>
                    <th className={styles.tableHead}>Nome</th>
                    <th className={styles.tableHead}>Email</th>
                    <th className={styles.tableHead}>CPF</th>
                    <th className={styles.tableHead}>Ações</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {filteredFiscals.map((fiscal) => (
                    <tr key={fiscal.id} className={styles.tableRow}>
                      <td className={`${styles.tableCell} ${styles.tableCellMedium}`}>
                        {fiscal.user?.name || 'N/A'}
                      </td>
                      <td className={styles.tableCell}>{fiscal.user?.email || 'N/A'}</td>
                      <td className={styles.tableCell}>{fiscal.cpf}</td>
                      <td className={styles.tableCell}>
                        <div className={styles.actionButtons}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/fiscals/new`, { state: { fiscalId: fiscal.id } })}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteId(fiscal.id);
                              setDeleteName(fiscal.user?.name || "Fiscal");
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
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fiscal <strong>{deleteName}</strong>?
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

export default FiscalManagement;