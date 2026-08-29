import { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { ItemType } from "@/@types/ChecklistItem";
import { CATEGORY_LABELS } from "@/constants/checklistCategories";
import { checklistCategoryNotesService, CategoryNote } from "@/services/checklistCategoryNotesService";
import { useSocket } from "@/contexts/SocketContext";
import { useUserStore } from "@/stores/userStore";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toast } from "sonner";
import styles from "./CategoryNotesPanel.module.css";

interface CategoryNotesPanelProps {
  inspectionId: string;
  itemType: ItemType;
}

const CategoryNotesPanel = ({ inspectionId, itemType }: CategoryNotesPanelProps) => {
  const { user } = useUserStore();
  const { socket } = useSocket();

  const [notes, setNotes] = useState<CategoryNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await checklistCategoryNotesService.list(inspectionId, itemType);
      setNotes(data);
    } catch (err) {
      console.error("Erro ao carregar notas internas:", err);
    } finally {
      setLoading(false);
    }
  }, [inspectionId, itemType]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNote = (payload: CategoryNote & { inspectionId: string }) => {
      if (payload.inspectionId !== inspectionId || payload.itemType !== itemType) return;
      setNotes((prev) => [...prev, payload]);
    };

    socket.on("category-note:new", handleNewNote);
    return () => {
      socket.off("category-note:new", handleNewNote);
    };
  }, [socket, itemType]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [notes]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      const note = await checklistCategoryNotesService.create(inspectionId, itemType, trimmed);
      setNotes((prev) => [...prev, note]);
      setText("");
    } catch (err) {
      console.error("Erro ao enviar nota interna:", err);
      toast.error(getErrorMessage(err, "Não foi possível enviar a mensagem."));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <MessageCircle size={16} />
        <div>
          <p className={styles.title}>Notas internas</p>
          <p className={styles.subtitle}>{CATEGORY_LABELS[itemType]} · não entra no relatório</p>
        </div>
      </div>

      <div className={styles.list} ref={listRef}>
        {loading ? (
          <p className={styles.hint}>Carregando...</p>
        ) : notes.length === 0 ? (
          <p className={styles.hint}>
            Converse aqui com o fiscal/RT sobre dúvidas desta categoria — informal, sem
            aparecer no relatório final.
          </p>
        ) : (
          notes.map((note) => {
            const isOwn = note.user.id === user?.id;
            return (
              <div key={note.id} className={`${styles.note} ${isOwn ? styles.noteOwn : ""}`}>
                <div className={styles.noteHeader}>
                  <span className={styles.noteAuthor}>{note.user.name}</span>
                  <span className={styles.noteRole}>
                    {note.user.role === "RT" ? "RT" : note.user.role === "INSPECTOR" ? "Fiscal" : note.user.role}
                  </span>
                </div>
                <p className={styles.noteText}>{note.text}</p>
                <span className={styles.noteTime}>
                  {new Date(note.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.composer}>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Mensagem sobre ${CATEGORY_LABELS[itemType]}...`}
          rows={2}
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={handleSend}
          disabled={sending || !text.trim()}
        >
          <Send size={16} />
        </button>
      </div>
    </aside>
  );
};

export default CategoryNotesPanel;
