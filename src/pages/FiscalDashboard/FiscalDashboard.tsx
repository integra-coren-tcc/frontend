// src/pages/FiscalDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  CheckSquare,
  AlertTriangle,
  Bell,
  BookOpen,
  MessagesSquare,
  FolderOpen,
  Library,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import styles from "./FiscalDashboard.module.css";
import { inspectionsService } from "@/services/inspectionsService";
import { inspectorGoalsService } from "@/services/inspectorGoalsService";
import { useSocket } from "@/contexts/SocketContext";
import { getErrorStatus } from "@/lib/getErrorMessage";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Inspection, InspectionStatus, PendingByInstitutionGroup } from "@/@types/Inspection";
import ReportModal from "./ReportModal";

type Stats = {
  scheduledFiscalizations: number;
  inProgress: number;
  completedThisMonth: number;
  pendingReports: number;
};

type GoalsSummary = {
  targetYearTotal: number;
  completedYearTotal: number;
};

const UPCOMING_LIST_LIMIT = 6;

import { useUserStore } from "@/stores/userStore";

const FiscalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [stats, setStats] = useState<Stats>({
    scheduledFiscalizations: 0,
    inProgress: 0,
    completedThisMonth: 0,
    pendingReports: 0,
  });

  const [upcomingFiscalizations, setUpcomingFiscalizations] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingInspectionId, setStartingInspectionId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [nearDeadlineCount, setNearDeadlineCount] = useState(0);
  const [goalsSummary, setGoalsSummary] = useState<GoalsSummary>({
    targetYearTotal: 0,
    completedYearTotal: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('inspection_updated', (data) => {
      console.log('Inspection updated event received:', data);

      if (data.actorId && user?.id && data.actorId === user.id) {
        console.log('Ignoring self-notification');
        return;
      }

      // Refresh data
      loadDashboardData();

      // Invalidate queries for other components utilizing React Query
      queryClient.invalidateQueries({
        queryKey: ['inspections'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      toast({
        title: "Atualização recebida",
        description: "O RT enviou novas correções para avaliação.",
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

      // Carregar todas as inspeções (filtrado por inspector), pendências por
      // instituição (para o resumo de prazos) e progresso das metas do ano —
      // em paralelo para não serializar as chamadas.
      const currentYear = new Date().getFullYear();
      const [inspections, pendingGroups, goalsProgress] = await Promise.all([
        inspectionsService.getAll({ inspectorId: user?.id }),
        inspectionsService.getPendingByInstitution().catch(() => [] as PendingByInstitutionGroup[]),
        inspectorGoalsService.getProgress(currentYear).catch(() => null),
      ]);

      setUpcomingFiscalizations(inspections);

      setNearDeadlineCount(
        pendingGroups.reduce((sum: number, group) => sum + group.nearDeadlineCount, 0)
      );

      if (goalsProgress) {
        setGoalsSummary({
          targetYearTotal: goalsProgress.months.reduce((sum, m) => sum + m.targetCount, 0),
          completedYearTotal: goalsProgress.months.reduce((sum, m) => sum + m.completedCount, 0),
        });
      }

      // Calcular estatísticas
      const scheduledCount = inspections.filter(i => i.status === 'SCHEDULED').length;
      const inProgressCount = inspections.filter(
        i => i.status === 'IN_PROGRESS_INSPECTOR' || i.status === 'AWAITING_CORRECTION'
      ).length;
      const completedCount = inspections.filter(i => i.status === 'COMPLETED').length;
      const awaitingCount = inspections.filter(i => i.status === 'AWAITING_CORRECTION').length;

      setStats({
        scheduledFiscalizations: scheduledCount,
        inProgress: inProgressCount,
        completedThisMonth: completedCount,
        pendingReports: awaitingCount,
      });
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Não foi possível carregar os dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInspection = async (inspectionId: string) => {
    try {
      setStartingInspectionId(inspectionId);

      // Atualizar status para IN_PROGRESS_INSPECTOR
      // O backend automaticamente cria os 17 itens fixos (Self-healing)
      const updatedInspection = await inspectionsService.update(inspectionId, {
        status: InspectionStatus.IN_PROGRESS_INSPECTOR,
      });

      // Validar que os itens foram criados
      if (updatedInspection.checklistItems.length === 0) {
        throw new Error('Erro ao criar itens do checklist. Tente novamente.');
      }

      // Navegar para o checklist
      navigate(`/checklist/${inspectionId}`);
    } catch (err: unknown) {
      // Instituição sem RT vinculado: o backend bloqueia essa transição até o fiscal
      // informar o RT manualmente. Nesse caso, seguimos para o checklist normalmente —
      // a própria tela do checklist exibe o modal para coletar nome/COREN do RT.
      if (getErrorStatus(err) === 409) {
        navigate(`/checklist/${inspectionId}`);
        return;
      }

      console.error('Erro ao iniciar fiscalização:', err);
      alert('Não foi possível iniciar a fiscalização. Tente novamente.');
    } finally {
      setStartingInspectionId(null);
    }
  };

  const getStatusBadge = (status: InspectionStatus) => {
    const base = styles.cardDescription;

    switch (status) {
      case 'SCHEDULED':
        return <span className={`${base} ${styles.infoText}`}>Agendada</span>;
      case 'IN_PROGRESS_INSPECTOR':
        return <span className={`${base} ${styles.warningText}`}>Em andamento</span>;
      case 'AWAITING_CORRECTION':
        return <span className={`${base} ${styles.warningText}`}>Aguardando RT</span>;
      case 'COMPLETED':
        return <span className={`${base} ${styles.successText}`}>Concluída</span>;
      default:
        return <span className={base}>Indefinido</span>;
    }
  };

  const hasNotification = (inspection: Inspection): boolean => {
    // Mostrar notificação se há itens aguardando análise
    return inspection.status === 'AWAITING_CORRECTION' &&
      (inspection.checklistItems?.some(item => item.status === 'AWAITING_ANALYSIS') ?? false);
  };

  const getNotificationMessage = (inspection: Inspection): string => {
    const awaitingCount = inspection.checklistItems?.filter(
      item => item.status === 'AWAITING_ANALYSIS'
    ).length ?? 0;

    return awaitingCount > 0
      ? `RT enviou ${awaitingCount} ${awaitingCount === 1 ? 'item' : 'itens'} para análise`
      : '';
  };

  // Com muitas instituições sob responsabilidade do fiscal, mostrar tudo de uma vez
  // vira ruído — priorizamos as mais próximas da data e limitamos a lista, com um
  // link para a visão completa (agrupada por instituição) em "Pendências".
  const sortedUpcoming = [...upcomingFiscalizations]
    .filter((i) => i.status !== InspectionStatus.COMPLETED)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const visibleUpcoming = sortedUpcoming.slice(0, UPCOMING_LIST_LIMIT);
  const hiddenUpcomingCount = sortedUpcoming.length - visibleUpcoming.length;

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Header userType="inspector" userName="Carregando..." />
        <div className={styles.pageContainer}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <Header userType="inspector" userName="Fiscal" />
        <div className={styles.pageContainer}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Erro</h1>
            <p className={styles.pageDescription}>{error}</p>
          </div>
          <button
            type="button"
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={loadDashboardData}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Report Modal */}
      {selectedInspection && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedInspection(null);
          }}
          inspection={selectedInspection}
        />
      )}

      <Header userType="inspector" userName={user?.name || "Fiscal"} />

      <div className={styles.pageContainer}>
        {/* Cabeçalho */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard do Fiscal</h1>
            <p className={styles.pageDescription}>
              Gerencie suas fiscalizações e relatórios
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={() => navigate("/fiscal/schedule")}
            >
              <Calendar className={styles.buttonIcon} />
              Agendar Fiscalização
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className={styles.statsGrid}>
          <div className={`${styles.card} ${styles.infoBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Agendadas</h3>
              <Calendar className={`${styles.cardIcon} ${styles.infoText}`} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.scheduledFiscalizations}</div>
              <p className={styles.cardDescription}>Próximas fiscalizações</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.warningBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Em Andamento</h3>
              <Clock className={`${styles.cardIcon} ${styles.warningText}`} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.inProgress}</div>
              <p className={styles.cardDescription}>Fiscalizações ativas</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.successBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Concluídas</h3>
              <CheckSquare className={`${styles.cardIcon} ${styles.successText}`} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.completedThisMonth}</div>
              <p className={styles.cardDescription}>Este mês</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.warningBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Pendentes</h3>
              <AlertTriangle className={`${styles.cardIcon} ${styles.warningText}`} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.pendingReports}</div>
              <p className={styles.cardDescription}>Relatórios pendentes</p>
            </div>
          </div>

          <div
            className={`${styles.card} ${styles.warningBorder}`}
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard/fiscal/pendencias")}
            title="Ver pendências por instituição"
          >
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Perto do Prazo</h3>
              <Clock className={`${styles.cardIcon} ${styles.warningText}`} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{nearDeadlineCount}</div>
              <p className={styles.cardDescription}>Itens a vencer em breve — ver por instituição</p>
            </div>
          </div>

          <div
            className={`${styles.card} ${styles.successBorder}`}
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard/fiscal/metas")}
            title="Ver metas do ano"
          >
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Meta Anual</h3>
              <CheckSquare className={`${styles.cardIcon} ${styles.successText}`} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>
                {goalsSummary.completedYearTotal}/{goalsSummary.targetYearTotal || "–"}
              </div>
              <p className={styles.cardDescription}>Fiscalizações concluídas x meta do ano</p>
            </div>
          </div>
        </div>

        {/* Próximas Fiscalizações + Ações rápidas */}
        <div className={styles.contentGrid}>
          {/* Lista de próximas fiscalizações */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.quickActionsTitle}>Próximas Fiscalizações</h3>
              <p className={styles.cardDescription}>
                Suas fiscalizações agendadas e em andamento
              </p>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.quickActionsContent}>
                {visibleUpcoming.length === 0 ? (
                  <p className={styles.cardDescription}>Nenhuma fiscalização encontrada</p>
                ) : (
                  visibleUpcoming.map((inspection) => (
                    <div
                      key={inspection.id}
                      className={styles.actionButton}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div className={styles.actionTitle}>
                              {inspection.institution?.name || 'Instituição não informada'}
                            </div>
                            {hasNotification(inspection) && (
                              <span className={styles.notificationBadge}>
                                <Bell />
                                Nova atualização
                              </span>
                            )}
                          </div>
                          {getStatusBadge(inspection.status)}
                        </div>

                        {hasNotification(inspection) && (
                          <div style={{
                            backgroundColor: "rgba(239, 68, 68, 0.05)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            marginBottom: "0.5rem",
                            fontSize: "0.875rem",
                            color: "#ef4444",
                          }}>
                            {getNotificationMessage(inspection)}
                          </div>
                        )}

                        <div className={styles.cardDescription}>
                          RT: {inspection.responsibleTechnician?.user.name || inspection.manualRtName || 'Não atribuído'}
                        </div>

                        <div
                          className={styles.cardDescription}
                          style={{ display: "flex", gap: "1rem", marginTop: "0.35rem" }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <Calendar className={styles.cardIcon} />
                            {new Date(inspection.date).toLocaleDateString("pt-BR")}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <MapPin className={styles.cardIcon} />
                            {inspection.institution?.address || 'Endereço não informado'}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.primaryButton}`}
                            onClick={() => {
                              if (inspection.status === InspectionStatus.COMPLETED) {
                                setSelectedInspection(inspection);
                                setShowReportModal(true);
                              } else if ([InspectionStatus.SCHEDULED, InspectionStatus.IN_PROGRESS_INSPECTOR].includes(inspection.status)) {
                                handleStartInspection(inspection.id);
                              } else if (inspection.status === InspectionStatus.AWAITING_CORRECTION) {
                                navigate(`/checklist/${inspection.id}`);
                              }
                            }}
                            disabled={startingInspectionId === inspection.id}
                          >
                            {startingInspectionId === inspection.id
                              ? "Iniciando..."
                              : inspection.status === 'COMPLETED'
                                ? "Ver Relatório"
                                : inspection.status === 'AWAITING_CORRECTION'
                                  ? "Acompanhar Fiscalização"
                                  : inspection.status === 'IN_PROGRESS_INSPECTOR'
                                    ? "Continuar Checklist"
                                    : "Iniciar Fiscalização"}
                          </button>

                          {inspection.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              className={`${styles.button} ${styles.secondaryButton}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/fiscal/schedule/${inspection.id}`);
                              }}
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {hiddenUpcomingCount > 0 && (
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => navigate("/dashboard/fiscal/pendencias")}
                  >
                    <div className={styles.actionTitle}>
                      Ver mais {hiddenUpcomingCount} fiscalizaç{hiddenUpcomingCount === 1 ? "ão" : "ões"} por instituição →
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.quickActionsTitle}>Acesso Rápido</h3>
              <p className={styles.cardDescription}>
                Ferramentas de apoio ao fiscal
              </p>
            </div>

            <div className={styles.quickActionsContent}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => navigate("/fiscal/schedule")}
              >
                <Calendar className={`${styles.actionIcon} ${styles.infoText}`} />
                <div>
                  <div className={styles.actionTitle}>Agendar Nova Fiscalização</div>
                  <div className={styles.actionDescription}>Criar novo agendamento</div>
                </div>
              </button>

              <button
                type="button"
                className={styles.actionButton}
                onClick={() => navigate("/dashboard/standard-checklist")}
              >
                <CheckSquare className={`${styles.actionIcon} ${styles.successText}`} />
                <div>
                  <div className={styles.actionTitle}>Checklist Padrão</div>
                  <div className={styles.actionDescription}>
                    Visualizar itens de verificação
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={styles.actionButton}
                onClick={() => navigate("/dashboard/fiscal/pendencias")}
              >
                <AlertTriangle className={`${styles.actionIcon} ${styles.warningText}`} />
                <div>
                  <div className={styles.actionTitle}>Pendências por Instituição</div>
                  <div className={styles.actionDescription}>
                    Cobranças e prazos, agrupados por instituição
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={styles.actionButton}
                onClick={() => navigate("/dashboard/fiscal/metas")}
              >
                <Calendar className={`${styles.actionIcon} ${styles.infoText}`} />
                <div>
                  <div className={styles.actionTitle}>Metas</div>
                  <div className={styles.actionDescription}>
                    Acompanhar metas mensais e anuais
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={styles.actionButton}
                onClick={() => navigate("/chamados")}
              >
                <MessagesSquare className={`${styles.actionIcon} ${styles.infoText}`} />
                <div>
                  <div className={styles.actionTitle}>Chamados</div>
                  <div className={styles.actionDescription}>
                    Canal direto com os RTs das instituições
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={styles.actionButton}
                onClick={() => navigate("/documentos-instituicao")}
              >
                <FolderOpen className={`${styles.actionIcon} ${styles.infoText}`} />
                <div>
                  <div className={styles.actionTitle}>Documentos das Instituições</div>
                  <div className={styles.actionDescription}>
                    Regimento, dimensionamento, PRS e protocolos atualizados
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={styles.actionButton}
                onClick={() => navigate("/biblioteca")}
              >
                <Library className={`${styles.actionIcon} ${styles.infoText}`} />
                <div>
                  <div className={styles.actionTitle}>Biblioteca</div>
                  <div className={styles.actionDescription}>
                    Legislação, manuais e modelos de documentos
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={styles.actionButton}
                onClick={() => navigate("/wiki")}
              >
                <BookOpen className={`${styles.actionIcon} ${styles.infoText}`} />
                <div>
                  <div className={styles.actionTitle}>Ajuda & Wiki</div>
                  <div className={styles.actionDescription}>
                    Como explicar o papel do RT para a instituição
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        {/* /grid */}
      </div>
    </div>
  );
};

export default FiscalDashboard;