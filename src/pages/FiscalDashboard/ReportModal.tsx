import React from "react";
import { X, Download, CheckCircle, AlertCircle, FileText } from "lucide-react";
import styles from "../RTDashboard/ReportModal.module.css";
import { Inspection } from "@/@types/Inspection";
import { ItemStatus } from "@/@types/ChecklistItem";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    inspection: Inspection;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, inspection }) => {
    const handleExportPDF = () => {
        // Create printable content using same approach as RT
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const compliantCount = inspection.checklistItems?.filter(i => i.status === ItemStatus.COMPLIANT || i.status === ItemStatus.NOT_APPLICABLE).length || 0;
        const nonCompliantItems = inspection.checklistItems?.filter(i => i.status !== ItemStatus.COMPLIANT && i.status !== ItemStatus.NOT_APPLICABLE) || [];

        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Fiscalização - ${inspection.institution?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            .info { margin-bottom: 20px; color: #6b7280; }
            .item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .item-header { font-weight: bold; color: #1f2937; margin-bottom: 8px; }
            .item-category { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
            .item-row { display: flex; margin-bottom: 8px; }
            .item-label { font-weight: 500; color: #374151; min-width: 150px; }
            .item-value { color: #6b7280; }
            .summary { background: #f0fdf4; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .summary-title { color: #166534; font-weight: bold; margin-bottom: 10px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Relatório de Fiscalização</h1>
          <div class="info">
            <p><strong>Instituição:</strong> ${inspection.institution?.name || 'N/A'}</p>
            <p><strong>Fiscal Responsável:</strong> ${inspection.inspector?.user?.name || 'N/A'}</p>
            <p><strong>Data da Fiscalização:</strong> ${new Date(inspection.date).toLocaleDateString("pt-BR")}</p>
            <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
          </div>
          
          <h2>Itens Corrigidos</h2>
          ${nonCompliantItems.map(item => `
            <div class="item">
              <div class="item-header">${item.itemCode}</div>
              <div class="item-category">Categoria: ${item.itemType}</div>
              ${item.justification ? `
                <div class="item-row">
                  <span class="item-label">Observação Original:</span>
                  <span class="item-value">${item.justification}</span>
                </div>
              ` : ''}
              ${item.comments && item.comments.length > 0 ? `
                <div class="item-row">
                  <span class="item-label">Correção Realizada:</span>
                  <span class="item-value">${item.comments[item.comments.length - 1].text}</span>
                </div>
                <div class="item-row">
                  <span class="item-label">Data da Correção:</span>
                  <span class="item-value">${new Date(item.comments[item.comments.length - 1].createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              ` : ''}
            </div>
          `).join("")}
          
          <div class="summary">
            <div class="summary-title">Resumo</div>
            <p>Total de itens corrigidos: ${nonCompliantItems.length}</p>
            <p>Itens conformes: ${compliantCount}</p>
            <p>Status: Fiscalização Concluída</p>
          </div>
        </body>
      </html>
    `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
    };

    if (!isOpen) return null;

    const compliantCount = inspection.checklistItems?.filter(i => i.status === ItemStatus.COMPLIANT || i.status === ItemStatus.NOT_APPLICABLE).length || 0;
    const totalItems = inspection.checklistItems?.length || 0;
    const conformityPercentage = totalItems > 0 ? Math.round((compliantCount / totalItems) * 100) : 0;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2 className={styles.modalTitle}>Relatório de Fiscalização</h2>
                        <p className={styles.modalSubtitle}>{inspection.institution?.name}</p>
                    </div>
                    <button type="button" className={styles.closeButton} onClick={onClose}>
                        <X />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.infoSection}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Fiscal Responsável</span>
                            <span className={styles.infoValue}>{inspection.inspector?.user?.name || 'N/A'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Data da Fiscalização</span>
                            <span className={styles.infoValue}>
                                {new Date(inspection.date).toLocaleDateString("pt-BR")}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Status</span>
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                <CheckCircle className={styles.badgeIcon} />
                                Concluída
                            </span>
                        </div>
                    </div>

                    <div className={styles.summaryCards}>
                        <div className={`${styles.summaryCard} ${styles.summaryCardSuccess}`}>
                            <CheckCircle className={styles.summaryIcon} />
                            <div className={styles.summaryValue}>{compliantCount}</div>
                            <div className={styles.summaryLabel}>Itens Conformes</div>
                        </div>
                        <div className={`${styles.summaryCard} ${styles.summaryCardInfo}`}>
                            <FileText className={styles.summaryIcon} />
                            <div className={styles.summaryValue}>{conformityPercentage}%</div>
                            <div className={styles.summaryLabel}>Conformidade</div>
                        </div>
                    </div>

                    <h3 className={styles.sectionTitle}>Resumo dos Itens</h3>
                    <div className={styles.itemsList}>
                        {inspection.checklistItems?.filter(item => item.status !== ItemStatus.COMPLIANT && item.status !== ItemStatus.NOT_APPLICABLE).map((item) => (
                            <div key={item.publicId} className={styles.itemCard}>
                                <div className={styles.itemHeader}>
                                    <h4 className={styles.itemTitle}>{item.itemCode}</h4>
                                    <span className={styles.itemCategory}>{item.itemType}</span>
                                </div>
                                <div className={styles.itemDetails}>
                                    {item.justification && (
                                        <div className={styles.itemRow}>
                                            <AlertCircle className={styles.itemRowIcon} />
                                            <div>
                                                <span className={styles.itemRowLabel}>Observação:</span>
                                                <p className={styles.itemRowValue}>{item.justification}</p>
                                            </div>
                                        </div>
                                    )}
                                    {item.comments && item.comments.length > 0 && (
                                        <div className={styles.itemRow}>
                                            <CheckCircle className={`${styles.itemRowIcon} ${styles.itemRowIconSuccess}`} />
                                            <div>
                                                <span className={styles.itemRowLabel}>Correção Realizada:</span>
                                                <p className={styles.itemRowValue}>{item.comments[item.comments.length - 1].text}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {inspection.checklistItems?.filter(item => item.status !== ItemStatus.COMPLIANT && item.status !== ItemStatus.NOT_APPLICABLE).length === 0 && (
                            <p className={styles.emptyState}>Todos os itens estão conformes!</p>
                        )}
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={`${styles.button} ${styles.buttonOutline}`}
                        onClick={onClose}
                    >
                        Fechar
                    </button>
                    <button
                        type="button"
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={handleExportPDF}
                    >
                        <Download className={styles.buttonIcon} />
                        Exportar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
