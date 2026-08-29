import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import styles from "@/pages/ChecklistFiscal/Checklist.module.css";

interface ManualRtModalProps {
  open: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: (name: string, crm: string) => void;
}

const ManualRtModal = ({ open, submitting, onCancel, onConfirm }: ManualRtModalProps) => {
  const [name, setName] = useState("");
  const [crm, setCrm] = useState("");

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && crm.trim().length > 0;

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm(name.trim(), crm.trim());
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <AlertTriangle className={styles.modalIcon} style={{ color: "#f59e0b" }} />
        <h2 className={styles.modalTitle}>Responsável Técnico não cadastrado</h2>
        <p className={styles.modalDescription}>
          Esta instituição não possui um RT cadastrado no sistema. Informe o nome e o
          registro no COREN do responsável técnico presente na fiscalização para continuar.
        </p>

        <div style={{ textAlign: "left", marginTop: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: 4 }}>
            Nome do RT
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            className={styles.textarea}
            style={{ minHeight: "auto" }}
          />

          <label style={{ fontSize: 14, fontWeight: 500, display: "block", margin: "12px 0 4px" }}>
            COREN
          </label>
          <input
            type="text"
            value={crm}
            onChange={(e) => setCrm(e.target.value)}
            placeholder="Número de registro no COREN"
            className={styles.textarea}
            style={{ minHeight: "auto" }}
          />
        </div>

        <div className={styles.modalActions} style={{ gap: 10, marginTop: 20 }}>
          <button
            className={`${styles.button} ${styles.buttonOutline}`}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleConfirm}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Salvando..." : "Confirmar e Iniciar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualRtModal;
