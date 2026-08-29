import React, { useState, useEffect } from "react";
import { Calendar, AlertCircle, CheckCircle, Bell, History, BookOpen } from "lucide-react";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import styles from "./RTDashboard.module.css";
import ReportModal from "./ReportModal";
import { useUserStore } from "@/stores/userStore";
import { inspectionsService } from "@/services/inspectionsService";
import { Inspection, InspectionStatus } from "@/@types/Inspection";
import { ItemStatus } from "@/@types/ChecklistItem";
import { useSocket } from "@/contexts/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

type Stats = {

  pendingActions: number;
  completedThisMonth: number;
};

const RTDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedFiscalization, setSelectedFiscalization] = useState<Inspection | null>(null);

  const [stats, setStats] = useState<Stats>({

    pendingActions: 0,
    completedThisMonth: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('inspection_updated', (data) => {
      console.log('RT Dashboard - Inspection updated:', data);

      // If we implemented actorId check
      // if (data.actorId === user?.id) return; 

      loadDashboardData();

      // Force refetch
      queryClient.invalidateQueries({
        queryKey: ['inspections'],
        exact: false,
        refetchType: 'all'
      });

      toast({
        title: "Nova atualização na fiscalização!",
        description: "Verifique as pendências.",
      });
    });

    return () => {
      socket.off('inspection_updated');
    };
  }, [socket, toast, queryClient]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = user?.id; // Ajuste conforme seu store, pode ser user.publicId ou user.id

      // Fetch all inspections
      // Idealmente, o backend já filtraria por RT se o usuário logado for RT.
      // Assumindo que o endpoint /inspections retorna tudo ou filtra baseado na role.
      // Se retornar tudo, filtramos aqui pelo RT logado.

      const allInspections = await inspectionsService.getAll();

      console.log("Logged User:", user);
      console.log("UserID used for filter:", userId);
      console.log("All Inspections:", allInspections);

      // Filter for current RT
      // Supondo que inspection.responsibleTechnician.user.publicId == user.id ou similar
      // Vamos verificar a estrutura do objeto User no store.

      const myInspections = allInspections.filter(
        (insp) => {
          // Check against the logged-in user ID (which is the publicId)
          const rtUserId = insp.responsibleTechnician?.user?.id;
          const matches = rtUserId === userId;
          // console.log(`Checking Inspection ${insp.id}: RT User ID (${rtUserId}) === Logged User ID (${userId}) ? ${matches}`);
          return matches;
        }
      );

      setInspections(myInspections);

      // Calcular Stats


      const pending = myInspections.filter(i =>
        i.status === InspectionStatus.AWAITING_CORRECTION
      ).length;

      const completed = myInspections.filter(i => {
        const isCompleted = i.status === InspectionStatus.COMPLETED;
        const isThisMonth = new Date(i.date).getMonth() === new Date().getMonth();
        return isCompleted && isThisMonth;
      }).length;

      setStats({

        pendingActions: pending,
        completedThisMonth: completed,
      });

    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError("Não foi possível carregar as fiscalizações.");
    } finally {
      setLoading(false);
    }
  };

  const hasNotification = (inspection: Inspection): boolean => {
    // Show alert ONLY if inspection is in correction mode AND there are items requiring action (Non-Compliant or Awaiting Correction)
    if (inspection.status !== InspectionStatus.AWAITING_CORRECTION) return false;

    // Check if there are any items that need RT's attention
    const hasItemsNeedingAction = inspection.checklistItems?.some(
      item => item.status === ItemStatus.NON_COMPLIANT || item.status === ItemStatus.AWAITING_CORRECTION
    );

    return hasItemsNeedingAction ?? false;
  };

  const getNotificationMessage = (inspection: Inspection): string => {
    if (hasNotification(inspection)) {
      return "O fiscal solicitou correções. Clique para ver.";
    }
    return "";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case InspectionStatus.SCHEDULED:
        return <span className={`${styles.badge} ${styles.badgeScheduled}`}>Agendada</span>;
      case InspectionStatus.IN_PROGRESS_INSPECTOR:
        return <span className={`${styles.badge} ${styles.badgeInProgress}`}>Em Andamento (Fiscal)</span>;
      case InspectionStatus.AWAITING_CORRECTION:
        return <span className={`${styles.badge} ${styles.badgeDanger}`}>Correção Necessária</span>;
      case InspectionStatus.COMPLETED:
        return <span className={`${styles.badge} ${styles.badgeCompleted}`}>Concluída</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgeDefault}`}>{status}</span>;
    }
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case InspectionStatus.AWAITING_CORRECTION:
        return "Realizar Correções";
      case InspectionStatus.COMPLETED:
        return "Ver Relatório";
      case InspectionStatus.IN_PROGRESS_INSPECTOR:
        return "Aguardando Fiscal";
      case InspectionStatus.SCHEDULED:
        return "Aguardando Início";
      default:
        return "Ver Detalhes";
    }
  };

  const handleButtonClick = (inspection: Inspection) => {
    if (inspection.status === InspectionStatus.COMPLETED) {
      setSelectedFiscalization(inspection);
      setShowReportModal(true);
    } else if (inspection.status === InspectionStatus.AWAITING_CORRECTION) {
      // Redirecionar para tela de resolução de pendências (ChecklistRT)
      navigate(`/checklistRT/${inspection.id}`);
    } else {
      // Apenas visualizar
      navigate(`/checklistRT/${inspection.id}`);
    }
  };

  // Obter nome da instituição do primeiro item (assumindo RT de uma instituição principal, ou pegar do user se tiver vinculado)
  const institutionName = inspections.length > 0
    ? inspections[0].institution?.name
    : "Instituição não identificada";

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Header userType="rt" userName="Carregando..." />
        <div className={styles.pageContainer}>
          <h2>Carregando informações...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Header userType="rt" userName={user?.name || "Responsável Técnico"} />

      <div className={styles.pageContainer}>
        {/* Cabeçalho */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard RT</h1>
            <p className={styles.pageDescription}>
              Acompanhe fiscalizações e gerencie ações corretivas
            </p>
            <p className={styles.pageSubtitle}>
              {user?.name} - Contratado(a)
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonOutline}`}
              onClick={() => navigate("/rt/history")}
            >
              <History size={16} style={{ marginRight: 8 }} />
              Histórico da Instituição
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonOutline}`}
              onClick={() => navigate("/wiki")}
            >
              <BookOpen size={16} style={{ marginRight: 8 }} />
              Ajuda &amp; Wiki
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className={styles.statsGrid}>


          <div className={`${styles.card} ${styles.dangerBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Ações Pendentes</h3>
              <AlertCircle className={`${styles.cardIcon} ${styles.dangerText}`} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.pendingActions}</div>
              <p className={styles.cardDescription}>Aguardando Correção</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.successBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Concluídas</h3>
              <CheckCircle className={`${styles.cardIcon} ${styles.successText}`} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.completedThisMonth}</div>
              <p className={styles.cardDescription}>Este mês</p>
            </div>
          </div>

        </div>

        {/* Status das Fiscalizações */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Status das Fiscalizações</h3>
              <p className={styles.sectionDescription}>
                Acompanhe o progresso das fiscalizações em tempo real
              </p>
            </div>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.fiscalizationList}>
              {inspections.length === 0 ? (
                <p style={{ padding: '1rem', color: '#666' }}>Nenhuma fiscalização encontrada para você.</p>
              ) : (
                inspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className={styles.fiscalizationItem}
                    onClick={() => navigate(`/checklistRT/${inspection.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/checklistRT/${inspection.id}`);
                      }
                    }}
                  >
                    <div className={styles.fiscalizationHeader}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <h3 className={styles.fiscalizationTitle}>
                            Instituição: {inspection.institution?.name}
                          </h3>
                          {hasNotification(inspection) && (
                            <span className={styles.notificationBadge}>
                              <Bell />
                              Nova atualização
                            </span>
                          )}
                        </div>
                        <p className={styles.fiscalizationSubtitle}>
                          Data: {new Date(inspection.date).toLocaleDateString("pt-BR")}
                          {inspection.inspector && ` • Fiscal: ${inspection.inspector.user.name}`}
                        </p>
                      </div>
                      {getStatusBadge(inspection.status)}
                    </div>

                    {hasNotification(inspection) && getNotificationMessage(inspection) && (
                      <div className={styles.notificationMessage} style={{ marginTop: 8 }}>
                        <AlertCircle size={16} style={{ marginRight: 6 }} />
                        {getNotificationMessage(inspection)}
                      </div>
                    )}


                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleButtonClick(inspection);
                      }}
                    >
                      {getButtonText(inspection.status)}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedFiscalization && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedFiscalization(null);
          }}
          fiscalizationData={{
            fiscal: selectedFiscalization.inspector?.user.name || "Fiscal",
            date: selectedFiscalization.date.toString(),
            institution: selectedFiscalization.institution?.name || "Instituição",
          }}
        />
      )}
    </div>
  );
};

export default RTDashboard;