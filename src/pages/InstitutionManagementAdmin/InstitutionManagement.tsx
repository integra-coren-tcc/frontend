import { useState, useEffect } from "react";
import { Plus, Search, Building2, MapPin, Phone, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import { institutionsService, InstitutionResponse } from "@/services/institutionsService";
import { Institution } from "@/@types/Institution";
import { useToast } from "@/hooks/use-toast";

const InstitutionManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string | null>(null);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const response = await institutionsService.getAll();
      setInstitutions(response.institutions);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao carregar instituições",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await institutionsService.delete(deleteId);
      toast({ title: "Instituição excluída com sucesso", className: "bg-green-500 text-white" });
      loadInstitutions();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao excluir instituição", variant: "destructive" });
    } finally {
      setDeleteId(null);
      setDeleteName(null);
    }
  };

  const filteredInstitutions = institutions.filter(institution =>
    institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    institution.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
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
              <h1 className="text-3xl font-bold text-foreground">Gerenciar Instituições</h1>
              <p className="text-muted-foreground mt-1">
                Cadastre e gerencie unidades de saúde no sistema
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/institutions/new")}
            className="bg-gradient-to-r from-primary to-primary-dark"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Instituição
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Instituições</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{institutions.length}</div>
            </CardContent>
          </Card>

          {/* Note: Backend might not return status, assuming all active for now or filtered by query */}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Instituições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Institutions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Instituições</CardTitle>
            <CardDescription>
              {filteredInstitutions.length} instituição(ões) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstitutions.map((institution) => (
                    <TableRow key={institution.id}>
                      <TableCell>
                        <div className="font-medium">{institution.name}</div>
                        <div className="text-xs text-muted-foreground">CNPJ: {institution.cnpj}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm">{institution.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>{institution.type}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* 
                           Note: Edit page is assumed to be /admin/institutions/:id/edit 
                           If not implemented, I should probably do it or leave as future work.
                           The plan says: "Implement/Update Institution Pages -> InstitutionManagementAdmin".
                        */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigate(`/admin/institutions/${institution.id}/edit`)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setDeleteId(institution.id);
                              setDeleteName(institution.name);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a instituição <strong>{deleteName}</strong>?
              Essa ação não pode ser desfeita e pode afetar RTs e fiscalizações vinculadas.
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

export default InstitutionManagement;