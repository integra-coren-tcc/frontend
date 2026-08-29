import { useState } from "react";
import { MessageCircle, Send, ChevronDown, ChevronUp } from "lucide-react";
import { ChecklistItem } from "@/@types/ChecklistItem";
import { checklistItemsService } from "@/services/checklistItemsService";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";
import styles from "./InternalNotePanel.module.css";

interface InternalNotePanelProps {
  inspectionId: string;
  item: ChecklistItem;
  onSent: () => void | Promise<void>;
}

const InternalNotePanel = ({ inspectionId, item, onSent }: InternalNotePanelProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const notes = (item.comments ?? []).filter((c) => c.isInternalNote);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      await checklistItemsService.createComment(
        inspectionId,
        item.publicId,
        trimmed,
        undefined,
        true
      );
      setText("");
      await onSent();
    } catch (err: unknown) {
      console.error("Erro ao enviar nota interna:", err);
      toast.error(getErrorMessage(err, "Não foi possível enviar a nota."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MessageCircle size={14} />
        <span>Notas internas{notes.length > 0 ? ` (${notes.length})` : ""}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className={styles.body}>
          <p className={styles.hint}>
            Espaço para combinar detalhes com o fiscal/RT deste item — não aparece no relatório.
          </p>

          {notes.length > 0 && (
            <div className={styles.list}>
              {notes.map((note) => (
                <div key={note.publicId} className={styles.note}>
                  <div className={styles.noteHeader}>
                    <span className={styles.noteAuthor}>{note.user.name}</span>
                    <span className={styles.noteTime}>
                      {new Date(note.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className={styles.noteText}>{note.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className={styles.composer}>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva uma mensagem..."
              rows={2}
            />
            <button
              type="button"
              className={styles.sendButton}
              onClick={handleSend}
              disabled={sending || !text.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalNotePanel;
