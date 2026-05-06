import React from "react";
import { X, Download, CheckCircle, AlertCircle, FileText } from "lucide-react";
import styles from "./ReportModal.module.css";

interface ReportItem {
  id: number;
  item: string;
  category: string;
  originalObservation: string;
  correctionDate: string;
  rtComment: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiscalizationData: {
    fiscal: string;
    date: string;
    institution: string;
  };
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, fiscalizationData }) => {
  const correctedItems: ReportItem[] = [
    {
      id: 1,
      item: "Acessibilidade para pessoas com deficiência",
      category: "Infraestrutura",
      originalObservation: "Rampa de acesso danificada",
      correctionDate: "2024-01-12",
      rtComment: "Rampa instalada conforme solicitado",
    },
    {
      id: 2,
      item: "Funcionamento de equipamentos médicos básicos",
      category: "Equipamentos",
      originalObservation: "Equipamentos precisam de calibração",
      correctionDate: "2024-01-13",
      rtComment: "Equipamentos verificados e calibrados",
    },
    {
      id: 3,
      item: "Disponibilidade de álcool gel e materiais de higiene",
      category: "Higiene",
      originalObservation: "Falta álcool gel nos dispensers da recepção",
      correctionDate: "2024-01-14",
      rtComment: "Dispensers reabastecidos e mantidos em dia",
    },
    {
      id: 4,
      item: "Limpeza e desinfecção de ambientes",
      category: "Higiene",
      originalObservation: "Protocolo de limpeza sendo seguido corretamente",
      correctionDate: "2024-01-14",
      rtComment: "Verificado pelo fiscal na visita",
    },
  ];

  const handleExportPDF = () => {
    // Create printable content
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Fiscalização - ${fiscalizationData.institution}</title>
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
            <p><strong>Instituição:</strong> ${fiscalizationData.institution}</p>
            <p><strong>Fiscal Responsável:</strong> ${fiscalizationData.fiscal}</p>
            <p><strong>Data da Fiscalização:</strong> ${new Date(fiscalizationData.date).toLocaleDateString("pt-BR")}</p>
            <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
          </div>
          
          <h2>Itens Corrigidos</h2>
          ${correctedItems.map(item => `
            <div class="item">
              <div class="item-header">${item.item}</div>
              <div class="item-category">Categoria: ${item.category}</div>
              <div class="item-row">
                <span class="item-label">Observação Original:</span>
                <span class="item-value">${item.originalObservation}</span>
              </div>
              <div class="item-row">
                <span class="item-label">Correção Realizada:</span>
                <span class="item-value">${item.rtComment}</span>
              </div>
              <div class="item-row">
                <span class="item-label">Data da Correção:</span>
                <span class="item-value">${new Date(item.correctionDate).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          `).join("")}
          
          <div class="summary">
            <div class="summary-title">Resumo</div>
            <p>Total de itens corrigidos: ${correctedItems.length}</p>
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Relatório de Fiscalização</h2>
            <p className={styles.modalSubtitle}>{fiscalizationData.institution}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X />
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.infoSection}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fiscal Responsável</span>
              <span className={styles.infoValue}>{fiscalizationData.fiscal}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Data da Fiscalização</span>
              <span className={styles.infoValue}>
                {new Date(fiscalizationData.date).toLocaleDateString("pt-BR")}
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
              <div className={styles.summaryValue}>{correctedItems.length}</div>
              <div className={styles.summaryLabel}>Itens Corrigidos</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryCardInfo}`}>
              <FileText className={styles.summaryIcon} />
              <div className={styles.summaryValue}>100%</div>
              <div className={styles.summaryLabel}>Conformidade</div>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Itens Corrigidos</h3>
          <div className={styles.itemsList}>
            {correctedItems.map((item) => (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <h4 className={styles.itemTitle}>{item.item}</h4>
                  <span className={styles.itemCategory}>{item.category}</span>
                </div>
                <div className={styles.itemDetails}>
                  <div className={styles.itemRow}>
                    <AlertCircle className={styles.itemRowIcon} />
                    <div>
                      <span className={styles.itemRowLabel}>Observação Original:</span>
                      <p className={styles.itemRowValue}>{item.originalObservation}</p>
                    </div>
                  </div>
                  <div className={styles.itemRow}>
                    <CheckCircle className={`${styles.itemRowIcon} ${styles.itemRowIconSuccess}`} />
                    <div>
                      <span className={styles.itemRowLabel}>Correção Realizada:</span>
                      <p className={styles.itemRowValue}>{item.rtComment}</p>
                    </div>
                  </div>
                  <div className={styles.itemDate}>
                    Corrigido em {new Date(item.correctionDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            ))}
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
