
import React, { useState, useEffect } from "react";
import { Plus, Building2, Users, FileText, TrendingUp, Settings } from "lucide-react";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.css";
import { institutionsService, InstitutionResponse } from "@/services/institutionsService";
import { fiscalsService, InspectorResponse } from "@/services/fiscalsService";
import { inspectionsService } from "@/services/inspectionsService";
import { rtsService } from "@/services/rtsService";
import { InspectionStatus, Inspection } from "@/@types/Inspection";
import GeneralReportModal from "@/components/GeneralReportModal";

type Stats = {
  totalInstitutions: number;
  totalFiscals: number;
  activeFiscalizations: number;
  completedThisMonth: number;
  totalRTs: number;
};

const DashboardAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalInstitutions: 0,
    totalFiscals: 0,
    activeFiscalizations: 0,
    completedThisMonth: 0,
    totalRTs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const values = await Promise.all([
        institutionsService.getAll(1, 100),
        fiscalsService.getAll(1, 100),
        inspectionsService.getAll(),
        rtsService.getAll()
      ]);

      const institutionsRes = values[0] as InstitutionResponse;
      const fiscalsRes = values[1] as InspectorResponse;
      const inspections = values[2] as Inspection[];
      const rtsRes = values[3];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const activeCount = inspections.filter(i =>
        i.status === InspectionStatus.SCHEDULED ||
        i.status === InspectionStatus.IN_PROGRESS ||
        i.status === InspectionStatus.IN_PROGRESS_INSPECTOR ||
        i.status === InspectionStatus.AWAITING_CORRECTION
      ).length;

      const completedCount = inspections.filter(i => {
        if (i.status !== InspectionStatus.COMPLETED || !i.completedAt) return false;
        const completeDate = new Date(i.completedAt);
        return completeDate.getMonth() === currentMonth && completeDate.getFullYear() === currentYear;
      }).length;

      setStats({
        totalInstitutions: institutionsRes.institutions.length,
        totalFiscals: fiscalsRes.inspectors.length,
        activeFiscalizations: activeCount,
        completedThisMonth: completedCount,
        totalRTs: rtsRes.rts.length
      });

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Header />
        <div className={styles.pageContainer}>
          <div className="flex h-screen items-center justify-center">
            <p>Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Header />

      <div className={styles.pageContainer}>
        {/* Cabeçalho da página */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard Administrativo</h1>
            <p className={styles.pageDescription}>
              Gerencie instituições, fiscais, RTs e monitore o sistema
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={() => navigate("/admin/institutions/new")}
            >
              <Plus className={styles.buttonIcon} />
              Nova Instituição
            </button>

            <button
              type="button"
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={() => navigate("/admin/fiscals/new")}
            >
              <Users className={styles.buttonIcon} />
              Novo Fiscal
            </button>

            <button
              type="button"
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={() => navigate("/admin/rts/new")}
            >
              <Users className={styles.buttonIcon} />
              Novo RT
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className={styles.statsGrid}>
          <div className={`${styles.card} ${styles.infoBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Instituições</h3>
              <Building2
                className={`${styles.cardIcon} ${styles.infoText}`}
                aria-hidden
              />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.totalInstitutions}</div>
              <p className={styles.cardDescription}>Unidades cadastradas</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.successBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Fiscais Cadastrados</h3>
              <Users
                className={`${styles.cardIcon} ${styles.successText}`}
                aria-hidden
              />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.totalFiscals}</div>
              <p className={styles.cardDescription}>Total de fiscais</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.infoBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>RTs Cadastrados</h3>
              <Users
                className={`${styles.cardIcon} ${styles.infoText}`}
                aria-hidden
              />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.totalRTs}</div>
              <p className={styles.cardDescription}>Total de RTs</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.warningBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Em Andamento</h3>
              <FileText
                className={`${styles.cardIcon} ${styles.warningText}`}
                aria-hidden
              />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.activeFiscalizations}</div>
              <p className={styles.cardDescription}>Fiscalizações ativas</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.successBorder}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Concluídas</h3>
              <TrendingUp
                className={`${styles.cardIcon} ${styles.successText}`}
                aria-hidden
              />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{stats.completedThisMonth}</div>
              <p className={styles.cardDescription}>Este mês</p>
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.quickActionsTitle}>Ações Rápidas</h3>
          </div>

          <div className={styles.quickActionsContent}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => navigate("/admin/institutions")}
            >
              <Building2
                className={`${styles.actionIcon} ${styles.infoText}`}
                aria-hidden
              />
              <div>
                <div className={styles.actionTitle}>Gerenciar Instituições</div>
                <div className={styles.actionDescription}>
                  Cadastrar e editar UBS
                </div>
              </div>
            </button>

            <button
              type="button"
              className={styles.actionButton}
              onClick={() => navigate("/admin/fiscals")}
            >
              <Users
                className={`${styles.actionIcon} ${styles.successText}`}
                aria-hidden
              />
              <div>
                <div className={styles.actionTitle}>Gerenciar Fiscais</div>
                <div className={styles.actionDescription}>
                  Cadastrar e visualizar fiscais
                </div>
              </div>
            </button>

            <button
              type="button"
              className={styles.actionButton}
              onClick={() => navigate("/admin/rts")}
            >
              <Settings
                className={`${styles.actionIcon} ${styles.warningText}`}
                aria-hidden
              />
              <div>
                <div className={styles.actionTitle}>Gerenciar RTs</div>
                <div className={styles.actionDescription}>
                  Vincular responsáveis técnicos
                </div>
              </div>
            </button>

            <button
              type="button"
              className={styles.actionButton}
              onClick={() => setIsReportModalOpen(true)}
            >
              <TrendingUp
                className={`${styles.actionIcon} ${styles.infoText}`}
                aria-hidden
              />
              <div>
                <div className={styles.actionTitle}>Relatórios Gerais</div>
                <div className={styles.actionDescription}>
                  Visualizar métricas do sistema
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Reports Modal */}
        <GeneralReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default DashboardAdmin;
