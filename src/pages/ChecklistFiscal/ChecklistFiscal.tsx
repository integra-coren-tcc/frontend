import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
  Loader2,
  MessageSquare,
  Paperclip,
  Save,
  SaveAll,
  Flag,
  History,
  FileCheck,
  Download,
} from 'lucide-react';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InteractionHistory from "@/components/InteractionHistory/InteractionHistory";
import Header from "@/components/layout/Header";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Checklist.module.css";
import { toast } from "sonner";
import { inspectionsService } from "@/services/inspectionsService";
import { checklistItemsService } from "@/services/checklistItemsService";
import { Inspection, InspectionStatus } from "@/@types/Inspection";
import { useUserStore } from "@/stores/userStore";
import { ChecklistItem, ItemStatus, ItemType } from "@/@types/ChecklistItem";

// Mapeamento de categorias para tabs
const CATEGORY_MAP: Record<ItemType, string> = {
  [ItemType.ILEGALIDADE]: "Ilegalidades",
  [ItemType.IRREGULARIDADE]: "Irregularidades",
  [ItemType.INFRACAO_ETICA]: "Infrações Éticas",
  [ItemType.QUESTAO_TRABALHISTA]: "Questões Trabalhistas",
};

const ChecklistFiscal: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<ItemType>(ItemType.ILEGALIDADE);
  const [justifications, setJustifications] =
    useState<Record<string, string>>({});

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState<{ show: boolean, type: 'success' | 'error' }>({ show: false, type: 'success' });
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);

  // Determinar modo baseado no status
  // SCHEDULED ou IN_PROGRESS_INSPECTOR -> Modo Formulário (initial)
  // AWAITING_CORRECTION ou outros -> Modo Monitoramento (monitoring)
  const fiscalizationMode =
    inspection?.status === InspectionStatus.COMPLETED
      ? "completed"
      : inspection?.status === InspectionStatus.SCHEDULED ||
        inspection?.status === InspectionStatus.IN_PROGRESS_INSPECTOR
        ? "initial"
        : "monitoring";

  useEffect(() => {
    if (id) {
      loadInspectionData();
    }
  }, [id]);

  const loadInspectionData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await inspectionsService.getById(id);

      // Debug: Check if comments and attachments are coming from backend
      console.log('🔍 Inspection data received:', data);
      console.log('🔍 Checklist items:', data.checklistItems);
      if (data.checklistItems && data.checklistItems.length > 0) {
        const itemsWithComments = data.checklistItems.filter((item: any) => item.comments && item.comments.length > 0);
        console.log('🔍 Items with comments:', itemsWithComments);
      }

      setInspection(data);
      setChecklistItems(data.checklistItems || []);

      // Se não houver itens, disparar Self-healing
      if (data.checklistItems.length === 0) {
        await handleNoItemsBug();
      }
    } catch (err) {
      console.error("Erro ao carregar inspeção:", err);
      setError("Não foi possível carregar os dados da inspeção.");
    } finally {
      setLoading(false);
    }
  };

  const handleNoItemsBug = async () => {
    if (!id) return;

    try {
      // Forçar Self-healing atualizando status
      const updated = await inspectionsService.update(id, {
        status: InspectionStatus.IN_PROGRESS_INSPECTOR,
      });

      if (updated.checklistItems.length > 0) {
        setInspection(updated);
        setChecklistItems(updated.checklistItems);
      } else {
        throw new Error("Self-healing falhou");
      }
    } catch (err) {
      console.error("Erro no Self-healing:", err);
      setError("Erro ao inicializar itens do checklist");
    }
  };

  const updateItemStatus = useCallback(
    async (
      publicId: string,
      status: ItemStatus,
      justification?: string
    ) => {
      try {
        setSaving(true);

        // Validação: NON_COMPLIANT requer justificativa
        if (status === ItemStatus.NON_COMPLIANT && !justification) {
          alert("Justificativa é obrigatória para itens Não Conformes");
          return;
        }

        const updatedItem = await checklistItemsService.updateStatus(publicId, {
          status,
          justification,
        });

        // Atualizar item localmente
        setChecklistItems((prev) =>
          prev.map((item) =>
            item.publicId === publicId ? { ...item, ...updatedItem } : item
          )
        );

        // Limpar observação após salvar
        setJustifications((prev) => {
          const newState = { ...prev };
          delete newState[publicId];
          return newState;
        });

        toast.success("Item atualizado com sucesso!");
      } catch (err) {
        console.error("Erro ao atualizar item:", err);
        // alert("Não foi possível atualizar o item. Tente novamente.");
        toast.error("Erro ao atualizar o item.");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleSaveDraft = async () => {
    if (!id) return;
    try {
      setSaving(true);
      // Apenas garante que o status está em IN_PROGRESS_INSPECTOR
      await inspectionsService.update(id, {
        status: InspectionStatus.IN_PROGRESS_INSPECTOR
      });
      setShowDraftModal({ show: true, type: 'success' });
    } catch (err) {
      console.error("Erro ao salvar rascunho:", err);
      setShowDraftModal({ show: true, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeClick = () => {
    // Abre o modal de aviso antes de executar
    setShowFinalizeWarning(true);
  };

  const executeFinalizeFiscalization = async () => {
    if (!id || !inspection) return;
    setShowFinalizeWarning(false); // Fecha o aviso

    try {
      setSaving(true);

      // 1. Encontrar itens PENDENTES e marcar como COMPLIANT
      const pendingItems = checklistItems.filter(item => item.status === ItemStatus.PENDING);

      console.log(`Auto-completing ${pendingItems.length} pending items...`);

      // Atualizar itens pendentes para CONFORME (um por um, idealmente seria batch no backend)
      await Promise.all(pendingItems.map(item =>
        checklistItemsService.updateStatus(item.publicId, { status: ItemStatus.COMPLIANT })
      ));

      // 2. Atualizar status da inspeção para AWAITING_CORRECTION
      // Backend calculará deadlines automaticamente para os NON_COMPLIANT
      const updated = await inspectionsService.update(id, {
        status: InspectionStatus.AWAITING_CORRECTION,
      });

      setInspection(updated);
      setChecklistItems(updated.checklistItems); // Recarregar itens para refletir status final

      // Show Success Modal instead of Alert
      setShowSuccessModal(true);

    } catch (err) {
      console.error("Erro ao finalizar fiscalização:", err);
      alert("Não foi possível finalizar a fiscalização");
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptAllConformities = async () => {
    // Validar que todos os itens estão resolvidos
    const allResolved = checklistItems.every(
      (item) =>
        item.status === ItemStatus.COMPLIANT || item.status === ItemStatus.NOT_APPLICABLE
    );

    if (!allResolved) {
      alert("Todos os itens devem estar conformes para concluir");
      return;
    }

    try {
      setSaving(true);
      // Update inspection status to COMPLETED
      await inspectionsService.update(id!, { status: InspectionStatus.COMPLETED });
      navigate("/dashboard/fiscal");
    } catch (err) {
      console.error("Erro ao finalizar inspeção:", err);
      alert("Erro ao finalizar a inspeção. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!inspection) return;

    try {
      setSaving(true);

      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório de Fiscalização', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Institution and Date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Instituição: ${inspection.institution?.name || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Data: ${new Date(inspection.date).toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Status: ${inspection.status}`, 20, yPosition);
      yPosition += 10;

      // Summary
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo:', 20, yPosition);
      yPosition += 7;
      pdf.setFont('helvetica', 'normal');

      const statusCounts = getStatusCounts();
      pdf.text(`- Conformes: ${statusCounts.compliant}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`- Não Conformes: ${statusCounts.nonCompliant}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`- Pendentes: ${statusCounts.pending}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`- Aguardando Análise: ${statusCounts.awaitingAnalysis}`, 25, yPosition);
      yPosition += 10;

      // Items
      pdf.setFont('helvetica', 'bold');
      pdf.text('Itens da Fiscalização:', 20, yPosition);
      yPosition += 7;

      checklistItems.forEach((item, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(`${index + 1}. ${item.itemCode}`, 20, yPosition);
        yPosition += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(`Status: ${item.status}`, 25, yPosition);
        yPosition += 5;

        if (item.justification) {
          const lines = pdf.splitTextToSize(`Justificativa: ${item.justification}`, pageWidth - 50);
          pdf.text(lines, 25, yPosition);
          yPosition += lines.length * 5 + 2;
        }

        if (item.comments && item.comments.length > 0) {
          pdf.text('Comentários:', 25, yPosition);
          yPosition += 5;

          item.comments.forEach((comment) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(9);
            pdf.text(`- ${comment.user.name} (${new Date(comment.createdAt).toLocaleString('pt-BR')}):`, 30, yPosition);
            yPosition += 5;

            const commentLines = pdf.splitTextToSize(comment.text, pageWidth - 60);
            pdf.text(commentLines, 32, yPosition);
            yPosition += commentLines.length * 4 + 2;

            if (comment.attachments && comment.attachments.length > 0) {
              pdf.text(`Anexos: ${comment.attachments.length} arquivo(s)`, 32, yPosition);
              yPosition += 5;
            }
          });
        }

        yPosition += 5;
      });

      // Save PDF
      pdf.save(`relatorio-fiscalizacao-${inspection.institution?.name?.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório PDF. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.COMPLIANT:
        return (
          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            Conforme
          </span>
        );
      case ItemStatus.NON_COMPLIANT:
        return (
          <span className={`${styles.badge} ${styles.badgeDanger}`}>
            Não Conforme
          </span>
        );
      case ItemStatus.AWAITING_ANALYSIS:
        return (
          <span className={`${styles.badge} ${styles.badgeWarning}`}>
            Aguardando Análise
          </span>
        );
      case ItemStatus.AWAITING_CORRECTION:
        return (
          <span className={`${styles.badge} ${styles.badgeDanger}`}>
            Aguardando Correção
          </span>
        );
      case ItemStatus.NOT_APPLICABLE:
        return (
          <span className={`${styles.badge} ${styles.badgeSecondary}`}>
            N/A
          </span>
        );
      default:
        return (
          <span className={`${styles.badge} ${styles.badgeOutline}`}>
            Pendente
          </span>
        );
    }
  };

  const calculateDaysRemaining = (deadline: string | null): string => {
    if (!deadline) return "Sem prazo definido";

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Atrasado (${Math.abs(diffDays)} dias)`;
    } else if (diffDays === 0) {
      return "Vence hoje";
    } else {
      return `${diffDays} ${diffDays === 1 ? "dia restante" : "dias restantes"}`;
    }
  };

  const getStatusCounts = () => {
    return {
      compliant: checklistItems.filter((item) => item.status === ItemStatus.COMPLIANT)
        .length,
      nonCompliant: checklistItems.filter(
        (item) => item.status === ItemStatus.NON_COMPLIANT || item.status === ItemStatus.AWAITING_CORRECTION
      ).length,
      pending: checklistItems.filter((item) => item.status === ItemStatus.PENDING)
        .length,
      awaitingAnalysis: checklistItems.filter(
        (item) => item.status === ItemStatus.AWAITING_ANALYSIS
      ).length,
    };
  };

  // Filtrar itens baseado no modo
  const getFilteredItems = () => {
    if (fiscalizationMode === "completed") {
      // Modo concluído: mostrar todos os itens com histórico
      return checklistItems;
    }
    if (fiscalizationMode === "monitoring") {
      // Modo monitoramento: mostrar NON_COMPLIANT, AWAITING_CORRECTION, AWAITING_ANALYSIS e COMPLIANT com histórico
      return checklistItems.filter(
        (item) =>
          item.status === ItemStatus.NON_COMPLIANT ||
          item.status === ItemStatus.AWAITING_CORRECTION ||
          item.status === ItemStatus.AWAITING_ANALYSIS ||
          (item.status === ItemStatus.COMPLIANT && item.comments && item.comments.length > 0)
      );
    }
    // Modo inicial: mostrar todos
    return checklistItems;
  };

  const categories = Object.keys(CATEGORY_MAP) as ItemType[];
  const statusCounts = getStatusCounts();
  const filteredItems = getFilteredItems();

  if (loading) {
    return (
      <div className={styles.checklistContainer}>
        <Header userType="inspector" userName="Carregando..." />
        <div className={styles.pageContainer}>
          <div className={styles.pageHeader}>
            <h1>Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className={styles.checklistContainer}>
        <Header userType="inspector" userName="Fiscal" />
        <div className={styles.pageContainer}>
          <div className={styles.pageHeader}>
            <h1>Erro</h1>
            <p>{error || "Inspeção não encontrada"}</p>
          </div>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => navigate("/dashboard/fiscal")}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checklistContainer}>
      {/* Success Finalize Modal */}
      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <CheckCircle className={styles.modalIcon} />
            <h2 className={styles.modalTitle}>Sucesso!</h2>
            <p className={styles.modalDescription}>
              A fiscalização foi finalizada e enviada para o Responsável Técnico.
            </p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => navigate('/dashboard/fiscal')}
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Modal */}
      {showDraftModal.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            {showDraftModal.type === 'success' ? (
              <Save className={styles.modalIcon} style={{ color: '#3b82f6' }} />
            ) : (
              <AlertTriangle className={styles.modalIcon} style={{ color: '#ef4444' }} />
            )}
            <h2 className={styles.modalTitle}>
              {showDraftModal.type === 'success' ? 'Rascunho Salvo' : 'Erro ao Salvar'}
            </h2>
            <p className={styles.modalDescription}>
              {showDraftModal.type === 'success'
                ? 'Seu progresso foi salvo com sucesso. Você pode continuar a qualquer momento.'
                : 'Houve um problema ao salvar seu rascunho. Tente novamente.'}
            </p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => setShowDraftModal({ ...showDraftModal, show: false })}
              >
                Continuar Editando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Warning Modal */}
      {showFinalizeWarning && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <AlertTriangle className={styles.modalIcon} style={{ color: '#f59e0b' }} />
            <h2 className={styles.modalTitle}>Finalizar Fiscalização?</h2>
            <p className={styles.modalDescription}>
              Tem certeza que deseja finalizar? <br />
              <strong>Todos os itens não marcados serão considerados CONFORMES.</strong>
            </p>
            <div className={styles.modalActions} style={{ gap: 10 }}>
              <button
                className={`${styles.button} ${styles.buttonOutline}`}
                onClick={() => setShowFinalizeWarning(false)}
              >
                Cancelar
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={executeFinalizeFiscalization}
              >
                Confirmar e Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      <Header userType="inspector" userName={user?.name || "Fiscal"} />

      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1>
              {fiscalizationMode === "completed"
                ? "Relatório da Fiscalização"
                : fiscalizationMode === "initial"
                  ? "Formulário de Avaliação"
                  : "Acompanhamento da Fiscalização"}
            </h1>
            <p>
              {inspection.institution?.name || "Instituição"} -{" "}
              {new Date(inspection.date).toLocaleDateString("pt-BR")}
            </p>
            {fiscalizationMode === "monitoring" && (
              <div className={styles.realTimeIndicator}>
                <div className={styles.realTimeDot} />
                <span className={styles.realTimeText}>
                  Aguardando atualizações do RT
                </span>
              </div>
            )}
            {fiscalizationMode === "initial" && (
              <span className={styles.badge} style={{ marginLeft: 10, background: '#e2e8f0', color: '#475569' }}>
                Modo Edição
              </span>
            )}
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonOutline}`}
              onClick={() => navigate("/dashboard/fiscal")}
            >
              Voltar
            </button>

            {fiscalizationMode === "initial" && (
              <>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonOutline}`}
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  <SaveAll className={styles.buttonIcon} />
                  Salvar Rascunho
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleFinalizeClick}
                  disabled={saving}
                >
                  <Save className={styles.buttonIcon} />
                  {saving ? "Finalizando..." : "Finalizar Formulário"}
                </button>
              </>
            )}

            {fiscalizationMode === "monitoring" && (
              <div className={styles.tooltipWrapper}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonSuccess}`}
                  onClick={handleAcceptAllConformities}
                  disabled={statusCounts.nonCompliant > 0 || statusCounts.awaitingAnalysis > 0}
                >
                  <Flag className={styles.buttonIcon} />
                  Aceitar Conformidades
                </button>
                {(statusCounts.nonCompliant > 0 || statusCounts.awaitingAnalysis > 0) && (
                  <span className={styles.tooltipText}>
                    As conformidades só podem ser aceitas quando todos os itens estiverem concluídos.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Resumo</h2>
              <p className={styles.cardDescription}>
                {statusCounts.compliant + statusCounts.nonCompliant + statusCounts.pending} itens no total
              </p>
            </div>
            {fiscalizationMode === "initial" && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 14, color: '#666' }}>Itens pendentes serão marcados como CONFORME ao finalizar.</span>
              </div>
            )}
          </div>
          <div className={styles.cardContent}>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
                <div
                  className={`${styles.statValue} ${styles.statValueSuccess}`}
                >
                  {statusCounts.compliant}
                </div>
                <div className={styles.statLabel}>Conformes</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardDanger}`}>
                <div
                  className={`${styles.statValue} ${styles.statValueDanger}`}
                >
                  {statusCounts.nonCompliant}
                </div>
                <div className={styles.statLabel}>Não Conformes</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardMuted}`}>
                <div className={`${styles.statValue} ${styles.statValueMuted}`}>
                  {statusCounts.pending}
                </div>
                <div className={styles.statLabel}>Não avaliados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Items */}
        <div className={styles.tabs}>
          <div className={styles.tabsList}>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.tabsTrigger} ${activeTab === category ? styles.tabsTriggerActive : ""
                  }`}
                onClick={() => setActiveTab(category)}
              >
                {CATEGORY_MAP[category]}
              </button>
            ))}
          </div>

          <div className={styles.tabsContent}>
            {filteredItems
              .filter((item) => item.itemType === activeTab)
              .map((item) => {
                const isReadonly = fiscalizationMode === "monitoring" && item.status === ItemStatus.COMPLIANT;

                return (
                  <div
                    key={item.publicId}
                    className={`${styles.checklistCard} ${isReadonly ? styles.checklistCardReadonly : ""
                      }`}
                  >
                    <div className={styles.checklistHeader}>
                      <div className={styles.checklistHeaderTop}>
                        <div className={styles.checklistHeaderLeft}>
                          <h3 className={styles.itemTitle}>
                            {item.notification}
                          </h3>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    <div className={styles.checklistContent}>
                      {/* FORM MODE: Selection Buttons */}
                      {fiscalizationMode === "initial" && (
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonSmall} ${item.status === ItemStatus.COMPLIANT ? styles.buttonSuccess : styles.buttonOutline}`}
                            onClick={() => updateItemStatus(item.publicId, ItemStatus.COMPLIANT)}
                            disabled={saving}
                          >
                            <CheckCircle size={16} style={{ marginRight: 6 }} /> Conforme
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonSmall} ${item.status === ItemStatus.NON_COMPLIANT || item.status === ItemStatus.AWAITING_CORRECTION ? styles.buttonDanger : styles.buttonOutline}`}
                            onClick={() => {
                              // Se já for non-compliant, não faz nada (apenas foca no textarea se quiser)
                              // Se não for, precisa abrir o campo de texto
                              if (item.status !== ItemStatus.NON_COMPLIANT) {
                                // Forçar focus ou algo assim, ou apenas setar o estado local para mostrar o textarea
                                // Na vdd, o textarea aparece se o status já for non-compliant ou se tivermos uma justificativa sendo digitada
                                // Vamos simplificar: Clicar aqui abre o textarea, mas só salva se tiver texto.
                                // Melhor: Clicar aqui muda o status para NON_COMPLIANT? Não, precisa de texto.
                                // UX: Clicar abre textarea. Botão de "Salvar" dentro do textarea confirma.
                                // Workaround: setar status NON_COMPLIANT requer texto.
                                // Vamos mostrar o textarea sempre que quiser marcar como NÃO conforme.
                              }
                              // Habilitar edição da justificativa
                              setJustifications(prev => ({ ...prev, [item.publicId]: item.justification || " " })) // " " trigger display
                            }}
                            disabled={saving}
                          >
                            <XCircle size={16} style={{ marginRight: 6 }} /> Não Conforme
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonSmall} ${item.status === ItemStatus.NOT_APPLICABLE ? styles.buttonSecondary : styles.buttonOutline}`}
                            onClick={() => updateItemStatus(item.publicId, ItemStatus.NOT_APPLICABLE)}
                            disabled={saving}
                          >
                            N/A
                          </button>
                        </div>
                      )}

                      {/* JUSTIFICATION TEXTAREA (For Non-Compliant Selection) */}
                      {fiscalizationMode === "initial" && (justifications[item.publicId] !== undefined || item.status === ItemStatus.NON_COMPLIANT || item.status === ItemStatus.AWAITING_CORRECTION) && (
                        <div className={styles.observationSection} style={{ marginTop: 16 }}>
                          <div className={styles.observationHeader}>
                            <MessageSquare className={styles.observationIcon} />
                            <span className={styles.observationLabel}>
                              Justificativa da Não Conformidade:
                            </span>
                          </div>
                          <textarea
                            placeholder="Descreva o motivo da não conformidade..."
                            value={justifications[item.publicId] !== undefined ? justifications[item.publicId] : (item.justification || "")}
                            onChange={(e) => setJustifications({ ...justifications, [item.publicId]: e.target.value })}
                            className={styles.textarea}
                          />
                          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              className={`${styles.button} ${styles.buttonSmall} ${styles.buttonDanger}`}
                              onClick={() => {
                                const text = justifications[item.publicId];
                                if (!text || text.trim().length === 0) {
                                  // alert("Digite uma justificativa.");
                                  toast.error("Digite uma justificativa para continuar.");
                                  return;
                                }
                                updateItemStatus(item.publicId, ItemStatus.NON_COMPLIANT, text);
                              }}
                            >
                              {item.status === ItemStatus.AWAITING_CORRECTION || item.status === ItemStatus.NON_COMPLIANT
                                ? "Atualizar Justificativa"
                                : "Confirmar Não Conformidade"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* MONITORING MODE: Displays & Actions */}
                      {fiscalizationMode === "monitoring" && (
                        <>
                          {/* Justification Display (if exists) */}
                          {item.justification && (
                            <div className={styles.justificationBox} style={{ marginTop: 12, padding: 12, background: '#fff1f2', borderRadius: 8 }}>
                              <strong>Motivo:</strong> {item.justification}
                            </div>
                          )}

                          {/* Deadline Display */}
                          {item.deadline && item.status === ItemStatus.NON_COMPLIANT && (
                            <div className={styles.deadlineInfo} style={{ marginTop: 12 }}>
                              <Clock className={styles.deadlineIcon} />
                              <span>Prazo: {calculateDaysRemaining(item.deadline)}</span>
                            </div>
                          )}

                          {/* Interaction History */}
                          {item.comments && item.comments.length > 0 && (
                            <InteractionHistory comments={item.comments} />
                          )}

                          {/* RT Evidence Display (Comments + Attachments) - KEEP OLD FOR FALLBACK */}
                          {false && (item.status === ItemStatus.AWAITING_ANALYSIS || item.status === ItemStatus.COMPLIANT) && item.comments && item.comments.length > 0 && (
                            <div style={{ marginTop: 16, padding: 12, background: item.status === ItemStatus.COMPLIANT ? '#f0fdf4' : '#f0f9ff', borderRadius: 8, border: item.status === ItemStatus.COMPLIANT ? '1px solid #86efac' : '1px solid #bfdbfe' }}>
                              <h4 style={{ margin: '0 0 8px', fontSize: '0.875rem', fontWeight: 600, color: item.status === ItemStatus.COMPLIANT ? '#15803d' : '#1e40af' }}>
                                {item.status === ItemStatus.COMPLIANT ? '✅ Histórico de Correção:' : '📎 Evidências Enviadas pelo RT:'}
                              </h4>
                              {item.comments.map((comment, idx) => (
                                <div key={comment.publicId} style={{ marginBottom: idx < item.comments!.length - 1 ? 12 : 0 }}>
                                  <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: '#374151' }}>
                                    <strong>{comment.user.name}</strong> ({new Date(comment.createdAt).toLocaleString('pt-BR')}):
                                  </p>
                                  <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: '#6b7280' }}>{comment.text}</p>
                                  {comment.attachments && comment.attachments.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      {comment.attachments.map((attachment) => (
                                        <a
                                          key={attachment.publicId}
                                          href={`http://localhost:3333${attachment.url}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '6px 10px',
                                            background: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: 4,
                                            fontSize: '0.8125rem',
                                            color: '#2563eb',
                                            textDecoration: 'none',
                                            width: 'fit-content',
                                          }}
                                        >
                                          <Paperclip size={14} />
                                          {attachment.originalName || attachment.fileName}
                                          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                            ({(attachment.size! / 1024).toFixed(0)} KB)
                                          </span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Review Actions (Approve/Reject Fix) */}
                          {item.status === ItemStatus.AWAITING_ANALYSIS && (
                            <div className={styles.actionButtons} style={{ marginTop: 16 }}>
                              <button
                                type="button"
                                className={`${styles.button} ${styles.buttonSmall} ${styles.buttonSuccessOutline}`}
                                onClick={() => updateItemStatus(item.publicId, ItemStatus.COMPLIANT)}
                                disabled={saving}
                              >
                                <CheckCircle className={styles.buttonIcon} />
                                Aprovar Correção
                              </button>
                              <button
                                type="button"
                                className={`${styles.button} ${styles.buttonSmall} ${styles.buttonDangerOutline}`}
                                onClick={() => setJustifications(prev => ({ ...prev, [item.publicId]: " " }))} // Abre textarea
                                disabled={saving}
                              >
                                <XCircle className={styles.buttonIcon} />
                                Reprovar
                              </button>
                            </div>
                          )}

                          {/* Rejection Textarea */}
                          {item.status === ItemStatus.AWAITING_ANALYSIS && justifications[item.publicId] !== undefined && (
                            <div className={styles.observationSection} style={{ marginTop: 12 }}>
                              <textarea
                                placeholder="Motivo da reprovação..."
                                className={styles.textarea}
                                value={justifications[item.publicId]}
                                onChange={e => setJustifications({ ...justifications, [item.publicId]: e.target.value })}
                              />
                              <button
                                className={`${styles.button} ${styles.buttonSmall} ${styles.buttonDanger}`}
                                style={{ marginTop: 8 }}
                                onClick={() => {
                                  if (!justifications[item.publicId]?.trim()) return alert("Justifique a reprovação");
                                  updateItemStatus(item.publicId, ItemStatus.NON_COMPLIANT, justifications[item.publicId]);
                                }}
                              >
                                Confirmar Reprovação
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

            {filteredItems.filter((item) => item.itemType === activeTab)
              .length === 0 && (
                <div className={styles.emptyState}>
                  <p>
                    {fiscalizationMode === "monitoring"
                      ? "Nenhum item não conforme nesta categoria"
                      : "Nenhum item nesta categoria"}
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChecklistFiscal;
