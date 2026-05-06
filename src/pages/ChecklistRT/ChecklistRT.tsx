import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Save,
  Paperclip,
  Clock,
  Send,
  Upload,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import InteractionHistory from "@/components/InteractionHistory/InteractionHistory";
import Header from "@/components/layout/Header";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Checklist.module.css";
import { useUserStore } from "@/stores/userStore";
import { Inspection, InspectionStatus } from "@/@types/Inspection";
import { ChecklistItem, ItemStatus, ItemType } from "@/@types/ChecklistItem";
import { inspectionsService } from "@/services/inspectionsService";
import { checklistItemsService } from "@/services/checklistItemsService";
import { intervalToDuration, formatDuration, formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORY_MAP: Record<ItemType, string> = {
  [ItemType.ILEGALIDADE]: "Ilegalidades",
  [ItemType.IRREGULARIDADE]: "Irregularidades",
  [ItemType.INFRACAO_ETICA]: "Infrações Éticas",
  [ItemType.QUESTAO_TRABALHISTA]: "Questões Trabalhistas",
};

const ChecklistRT: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ItemType>(ItemType.ILEGALIDADE);

  // State for Evidence Upload
  const [evidenceText, setEvidenceText] = useState<Record<string, string>>({});
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File[]>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

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
      setInspection(data);
      setChecklistItems(data.checklistItems || []);
    } catch (err) {
      console.error("Erro ao carregar inspeção:", err);
      setError("Não foi possível carregar a inspeção");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (publicId: string, files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setEvidenceFiles(prev => ({
      ...prev,
      [publicId]: [...(prev[publicId] || []), ...fileArray]
    }));
  };

  const removeFile = (publicId: string, index: number) => {
    setEvidenceFiles(prev => {
      const newFiles = [...(prev[publicId] || [])];
      newFiles.splice(index, 1);
      return { ...prev, [publicId]: newFiles };
    });
  };

  const handleSubmitEvidence = async (item: ChecklistItem) => {
    const text = evidenceText[item.publicId];
    const files = evidenceFiles[item.publicId];

    // Validação: Exigir anexo (requisito "obrigatorio o envio de anexo (pdf ou imagem)")
    if (!files || files.length === 0) {
      alert("É obrigatório anexar pelo menos um comprovante (PDF ou Imagem) para enviar a correção.");
      return;
    }

    if (!inspection?.id) {
      console.error("Inspection ID not found");
      return;
    }

    try {
      setSubmitting(prev => ({ ...prev, [item.publicId]: true }));

      // Chamada ao serviço para criar comentário (e trocar status se tiver anexo)
      // Agora passando inspectionId e itemPublicId (UUID) corretamente, pois o backend busca por publicId
      await checklistItemsService.createComment(
        inspection.id,
        item.publicId,
        text || "Correção enviada pelo RT (com anexo)",
        files
      );

      // Recarregar dados para refletir status
      await loadInspectionData();

      // Limpar formulário
      setEvidenceText(prev => ({ ...prev, [item.publicId]: "" }));
      setEvidenceFiles(prev => ({ ...prev, [item.publicId]: [] }));

      // Show Success Modal
      setShowSuccessModal(true);

    } catch (err) {
      console.error("Erro ao enviar evidência:", err);
      // Show Error Modal
      setShowErrorModal(true);
    } finally {
      setSubmitting(prev => ({ ...prev, [item.publicId]: false }));
    }
  };

  const getCountdown = (deadline: string | null) => {
    if (!deadline) return "Sem prazo";
    const date = new Date(deadline);

    if (isPast(date)) {
      return <span className={styles.expiredText}>Expirado</span>;
    }

    // Calcular duração restante
    const duration = intervalToDuration({
      start: new Date(),
      end: date
    });

    // Formatar manualmente ou usar formatDuration
    // "Faltam 05 dias, 04h"
    const days = duration.days || 0;
    const hours = duration.hours || 0;

    return `${days} dias, ${hours}h restantes`;
  };

  const handleExportPDF = async () => {
    if (!inspection) return;

    try {
      // Create PDF document  
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório de Fiscalização - RT', pageWidth / 2, yPosition, { align: 'center' });
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

      const compliantCount = checklistItems.filter(i => i.status === ItemStatus.COMPLIANT || i.status === ItemStatus.NOT_APPLICABLE).length;
      const nonCompliantCount = checklistItems.filter(i => i.status === ItemStatus.NON_COMPLIANT).length;
      const awaitingCount = checklistItems.filter(i => i.status === ItemStatus.AWAITING_ANALYSIS).length;

      pdf.text(`- Conformes: ${compliantCount}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`- Não Conformes: ${nonCompliantCount}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`- Em Análise: ${awaitingCount}`, 25, yPosition);
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

        if (item.deadline) {
          pdf.text(`Prazo: ${new Date(item.deadline).toLocaleDateString('pt-BR')}`, 25, yPosition);
          yPosition += 5;
        }

        yPosition += 5;
      });

      // Save PDF
      pdf.save(`relatorio-rt-${inspection.institution?.name?.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório PDF. Tente novamente.');
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.COMPLIANT:
        return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Conforme</span>;
      case ItemStatus.NON_COMPLIANT:
        return <span className={`${styles.badge} ${styles.badgeDanger}`}>Não Conforme</span>;
      case ItemStatus.AWAITING_ANALYSIS:
        return <span className={`${styles.badge} ${styles.badgeWarning}`}>Em Análise</span>;
      case ItemStatus.NOT_APPLICABLE:
        return <span className={`${styles.badge} ${styles.badgeSecondary}`}>N/A</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgeOutline}`}>Pendente</span>;
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (!inspection) return <div className={styles.error}>Inspeção não encontrada</div>;

  const filteredItems = checklistItems.filter(i => {
    // Filtrar por categoria
    if (i.itemType !== activeTab) return false;

    // Modo em andamento: mostrar NON_COMPLIANT, AWAITING_CORRECTION, AWAITING_ANALYSIS e COMPLIANT com histórico
    if (inspection.status === InspectionStatus.AWAITING_CORRECTION) {
      return i.status === ItemStatus.NON_COMPLIANT ||
        i.status === ItemStatus.AWAITING_CORRECTION ||
        i.status === ItemStatus.AWAITING_ANALYSIS ||
        (i.status === ItemStatus.COMPLIANT && i.comments && i.comments.length > 0);
    }

    // Outros modos: mostrar todos
    return true;
  });
  const categories = Object.keys(CATEGORY_MAP) as ItemType[];

  // Progress logic
  const compliantCount = checklistItems.filter(i => i.status === ItemStatus.COMPLIANT || i.status === ItemStatus.NOT_APPLICABLE).length;
  const progress = Math.round((compliantCount / checklistItems.length) * 100) || 0;

  return (
    <div className={styles.checklistContainer}>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <CheckCircle className={styles.modalIcon} style={{ color: '#22c55e' }} />
            <h2 className={styles.modalTitle}>Correção Enviada!</h2>
            <p className={styles.modalDescription}>
              Evidência enviada com sucesso para análise do Fiscal.
            </p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => setShowSuccessModal(false)}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <XCircle className={styles.modalIcon} style={{ color: '#ef4444' }} />
            <h2 className={styles.modalTitle}>Erro no Envio</h2>
            <p className={styles.modalDescription}>
              Não foi possível enviar a evidência. Tente novamente.
            </p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.button} ${styles.buttonOutline}`}
                onClick={() => setShowErrorModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <Header userType="rt" userName={user?.name || "RT"} />

      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div>
            <h1>
              {inspection.status === InspectionStatus.COMPLETED
                ? "Relatório da Fiscalização"
                : "Correção de Fiscalização"}
            </h1>
            <p>{inspection.institution?.name} - {new Date(inspection.date).toLocaleDateString()}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => navigate("/dashboard/rt")} className={`${styles.button} ${styles.buttonOutline}`}>
              Voltar
            </button>
            {inspection.status === InspectionStatus.COMPLETED && (
              <button onClick={handleExportPDF} className={`${styles.button} ${styles.buttonPrimary}`}>
                <Download size={16} style={{ marginRight: 8 }} />
                Exportar Relatório
              </button>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Status da Correção</h2>
            <span className={styles.progressValue}>{progress}% Resolvido</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.checklistLegend}>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <span className={`${styles.badge} ${styles.badgeDanger}`}>
                {checklistItems.filter(i => i.status === ItemStatus.NON_COMPLIANT).length} Pendentes
              </span>
              <span className={`${styles.badge} ${styles.badgeWarning}`}>
                {checklistItems.filter(i => i.status === ItemStatus.AWAITING_ANALYSIS).length} Em Análise
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <div className={styles.tabsList}>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.tabsTrigger} ${activeTab === category ? styles.tabsTriggerActive : ""}`}
                onClick={() => setActiveTab(category)}
              >
                {CATEGORY_MAP[category]}
              </button>
            ))}
          </div>

          <div className={styles.tabsContent}>
            {filteredItems.map(item => (
              <div key={item.publicId} className={styles.checklistCard}>
                <div className={styles.checklistHeader}>
                  <div>
                    <h3 className={styles.itemTitle}>{item.notification}</h3>
                    <span className={styles.itemCode}>{item.itemCode}</span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className={styles.checklistContent}>
                  {/* Fiscal Justification (if rejected) */}
                  {item.justification && (
                    <div className={styles.justificationBox}>
                      <div className={styles.justificationTitle}>
                        <MessageSquare size={16} />
                        Motivo da Reprovação (Fiscal):
                      </div>
                      <p>{item.justification}</p>
                    </div>
                  )}

                  {/* Interaction History */}
                  {item.comments && item.comments.length > 0 && (
                    <InteractionHistory comments={item.comments} />
                  )}

                  {/* Countdown for Pending Items */}
                  {item.status === ItemStatus.NON_COMPLIANT && item.deadline && (
                    <div className={styles.deadlineInfo}>
                      <Clock size={16} className={styles.deadlineIcon} />
                      <span className={styles.deadlineText}>Prazo: {getCountdown(item.deadline)}</span>
                    </div>
                  )}

                  {/* Evidence Upload Form - Enabled for NON_COMPLIANT and AWAITING_CORRECTION */}
                  {(item.status === ItemStatus.NON_COMPLIANT || item.status === ItemStatus.AWAITING_CORRECTION) && (
                    <div className={styles.evidenceForm}>
                      <h4>Enviar Correção</h4>
                      <textarea
                        className={styles.textarea}
                        placeholder="Descreva a correção realizada..."
                        value={evidenceText[item.publicId] || ""}
                        onChange={(e) => setEvidenceText(prev => ({ ...prev, [item.publicId]: e.target.value }))}
                      />

                      <div className={styles.fileInputContainer} style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
                        <input
                          id={`file-${item.publicId}`}
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          onChange={(e) => handleFileChange(item.publicId, e.target.files)}
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor={`file-${item.publicId}`}
                          className={`${styles.button} ${styles.buttonOutline}`}
                          style={{ width: '100%', justifyContent: 'center', cursor: 'pointer', borderStyle: 'dashed' }}
                        >
                          <Paperclip size={16} style={{ marginRight: 8 }} />
                          Anexar Comprovantes (PDF ou Imagem)
                        </label>

                        {/* File List */}
                        {evidenceFiles[item.publicId] && evidenceFiles[item.publicId].length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {evidenceFiles[item.publicId].map((f, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: 4 }}>
                                <span>{f.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFile(item.publicId, idx)}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                                >
                                  <XCircle size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={() => handleSubmitEvidence(item)}
                        disabled={submitting[item.publicId]}
                        style={{ width: '100%' }}
                      >
                        {submitting[item.publicId] ? "Enviando..." : "Enviar para Análise"}
                        <Send size={16} style={{ marginLeft: 8 }} />
                      </button>
                    </div>
                  )}

                  {item.status === ItemStatus.AWAITING_ANALYSIS && (
                    <div className={styles.infoBox}>
                      <CheckCircle size={16} />
                      Correção enviada. Aguardando análise do fiscal.
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <p className={styles.emptyState}>Nenhum item nesta categoria.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChecklistRT;