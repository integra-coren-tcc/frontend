import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Inbox,
  Lock,
  MessagesSquare,
  Plus,
  RotateCcw,
  Send,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { ticketsService } from "@/services/ticketsService";
import { useSocket } from "@/contexts/SocketContext";
import { useUserStore } from "@/stores/userStore";
import type { Ticket, TicketContact, TicketStatus } from "@/@types/Ticket";

type StatusFilter = "OPEN" | "CLOSED" | "ALL";

const SUBJECT_MAX_LENGTH = 150;

const roleLabel = (role: string) =>
  role === "RT" ? "RT" : role === "INSPECTOR" ? "Fiscal" : role;

const formatShortDate = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "2-digit" } : {}),
  });
};

const StatusBadge = ({ status }: { status: TicketStatus }) =>
  status === "OPEN" ? (
    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Aberto</Badge>
  ) : (
    <Badge variant="secondary">Encerrado</Badge>
  );

const Tickets = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket } = useSocket();
  const { user } = useUserStore();
  const isRT = user?.role === "RT";

  const selectedId = searchParams.get("id");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("OPEN");

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [contacts, setContacts] = useState<TicketContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [newCounterpartId, setNewCounterpartId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  selectedIdRef.current = selectedId;

  const counterpartOf = useCallback(
    (t: Ticket) => (isRT ? t.inspector : t.rt),
    [isRT]
  );

  // ---------- Carregamento ----------

  const loadTickets = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingList(true);
      const data = await ticketsService.list();
      setTickets(data);
    } catch (err) {
      console.error("Erro ao carregar chamados:", err);
      toast.error(getErrorMessage(err, "Não foi possível carregar os chamados."));
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, []);

  const loadTicket = useCallback(async (id: string, silent = false) => {
    try {
      if (!silent) setLoadingTicket(true);
      const data = await ticketsService.getById(id);
      // Ignora respostas de um chamado que não está mais aberto na tela
      if (selectedIdRef.current === id) setTicket(data);
    } catch (err) {
      console.error("Erro ao carregar chamado:", err);
      if (selectedIdRef.current === id) {
        toast.error(getErrorMessage(err, "Não foi possível abrir o chamado."));
        setTicket(null);
      }
    } finally {
      if (!silent && selectedIdRef.current === id) setLoadingTicket(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    setText("");
    if (!selectedId) {
      setTicket(null);
      setLoadingTicket(false);
      return;
    }
    setTicket(null);
    loadTicket(selectedId);
  }, [selectedId, loadTicket]);

  // ---------- Tempo real ----------

  useEffect(() => {
    if (!socket) return;

    const handleTicketUpdated = (payload: { ticketId: string }) => {
      loadTickets(true);
      if (payload?.ticketId && payload.ticketId === selectedIdRef.current) {
        loadTicket(payload.ticketId, true);
      }
    };

    socket.on("ticket:updated", handleTicketUpdated);
    return () => {
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, [socket, loadTickets, loadTicket]);

  // ---------- Auto-scroll ----------

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [ticket?.messages?.length, ticket?.id]);

  // ---------- Ações ----------

  const openTicket = (id: string) => {
    setSearchParams({ id });
  };

  const closeConversation = () => {
    setSearchParams({});
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!ticket || !trimmed || sending) return;

    try {
      setSending(true);
      const message = await ticketsService.addMessage(ticket.id, trimmed);
      setTicket((prev) =>
        prev && prev.id === ticket.id
          ? { ...prev, messages: [...(prev.messages ?? []), message], lastMessage: message }
          : prev
      );
      setText("");
      loadTickets(true);
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      toast.error(getErrorMessage(err, "Não foi possível enviar a mensagem."));
      loadTicket(ticket.id, true);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    try {
      setUpdatingStatus(true);
      await ticketsService.updateStatus(ticket.id, status);
      setTicket((prev) => (prev && prev.id === ticket.id ? { ...prev, status } : prev));
      toast.success(status === "CLOSED" ? "Chamado encerrado." : "Chamado reaberto.");
      loadTickets(true);
    } catch (err) {
      console.error("Erro ao atualizar chamado:", err);
      toast.error(
        getErrorMessage(
          err,
          status === "CLOSED"
            ? "Não foi possível encerrar o chamado."
            : "Não foi possível reabrir o chamado."
        )
      );
    } finally {
      setUpdatingStatus(false);
      setConfirmCloseOpen(false);
    }
  };

  // ---------- Novo chamado ----------

  const resetNewForm = () => {
    setNewCounterpartId("");
    setNewSubject("");
    setNewMessage("");
  };

  const openNewDialog = async () => {
    resetNewForm();
    setNewOpen(true);
    try {
      setLoadingContacts(true);
      const data = await ticketsService.listContacts();
      setContacts(data);
    } catch (err) {
      console.error("Erro ao carregar contatos:", err);
      toast.error(getErrorMessage(err, "Não foi possível carregar os contatos."));
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const canCreate =
    !!newCounterpartId && !!newSubject.trim() && !!newMessage.trim() && !creating;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    try {
      setCreating(true);
      const created = await ticketsService.create({
        counterpartId: newCounterpartId,
        subject: newSubject.trim(),
        message: newMessage.trim(),
      });
      toast.success("Chamado aberto.");
      setNewOpen(false);
      resetNewForm();
      setFilter((prev) => (prev === "CLOSED" ? "OPEN" : prev));
      await loadTickets(true);
      openTicket(created.id);
    } catch (err) {
      console.error("Erro ao abrir chamado:", err);
      toast.error(getErrorMessage(err, "Não foi possível abrir o chamado."));
    } finally {
      setCreating(false);
    }
  };

  // ---------- Derivados ----------

  const filteredTickets = useMemo(
    () => (filter === "ALL" ? tickets : tickets.filter((t) => t.status === filter)),
    [tickets, filter]
  );

  const sortedMessages = useMemo(
    () =>
      [...(ticket?.messages ?? [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [ticket?.messages]
  );

  const emptyContactsText = isRT
    ? "Nenhum fiscal enviou uma fiscalização da sua instituição ainda. Assim que uma fiscalização for enviada a você, poderá abrir chamados com o fiscal responsável."
    : "Você ainda não enviou fiscalização a nenhuma instituição com RT cadastrado. Após enviar uma fiscalização, você poderá abrir chamados com o RT da instituição.";

  // ---------- Render ----------

  const renderList = () => {
    if (loadingList) {
      return (
        <div className="p-3 space-y-3" aria-busy="true" aria-label="Carregando chamados">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-md border p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (filteredTickets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-2 py-12 px-4 text-muted-foreground">
          <Inbox className="w-10 h-10" aria-hidden="true" />
          <p className="font-medium text-foreground">Nenhum chamado por aqui</p>
          <p className="text-sm">
            {filter === "CLOSED"
              ? "Chamados encerrados aparecerão nesta lista."
              : "Use o botão \"Novo chamado\" para iniciar uma conversa."}
          </p>
        </div>
      );
    }

    return (
      <ul className="divide-y" aria-label="Lista de chamados">
        {filteredTickets.map((t) => {
          const active = t.id === selectedId;
          const counterpart = counterpartOf(t);
          const preview = t.lastMessage
            ? `${t.lastMessage.user.id === user?.id ? "Você: " : ""}${t.lastMessage.text}`
            : "Sem mensagens";
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => openTicket(t.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "w-full text-left p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted",
                  active && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm text-foreground line-clamp-1">{t.subject}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatShortDate(t.lastMessage?.createdAt ?? t.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {counterpart.name} · {t.institution.name}
                  </p>
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{preview}</p>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderConversation = () => {
    if (!selectedId) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center gap-2 p-8 text-muted-foreground">
          <MessagesSquare className="w-12 h-12" aria-hidden="true" />
          <p className="font-medium text-foreground">Selecione um chamado</p>
          <p className="text-sm">Escolha um chamado na lista ou abra um novo.</p>
        </div>
      );
    }

    if (loadingTicket || !ticket) {
      return (
        <div className="flex flex-1 flex-col p-4 gap-4" aria-busy="true" aria-label="Carregando conversa">
          {loadingTicket ? (
            <>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex-1 space-y-3 pt-4">
                <Skeleton className="h-14 w-3/5" />
                <Skeleton className="h-14 w-3/5 ml-auto" />
                <Skeleton className="h-14 w-2/5" />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center gap-3 text-muted-foreground">
              <p>Não foi possível carregar este chamado.</p>
              <Button variant="outline" onClick={() => loadTicket(selectedId)}>
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      );
    }

    const counterpart = counterpartOf(ticket);
    const isClosed = ticket.status === "CLOSED";

    return (
      <>
        <div className="flex items-start gap-3 border-b p-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={closeConversation}
            aria-label="Voltar para a lista de chamados"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground break-words">{ticket.subject}</h2>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" aria-hidden="true" />
                {counterpart.name} ({roleLabel(counterpart.role)})
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" aria-hidden="true" />
                {ticket.institution.name}
              </span>
            </div>
          </div>
          {!isClosed && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setConfirmCloseOpen(true)}
              disabled={updatingStatus}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">Encerrar chamado</span>
              <span className="sm:hidden">Encerrar</span>
            </Button>
          )}
        </div>

        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20"
          role="log"
          aria-live="polite"
          aria-label="Mensagens do chamado"
        >
          {sortedMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma mensagem neste chamado ainda.
            </p>
          ) : (
            sortedMessages.map((m) => {
              const isOwn = m.user.id === user?.id;
              return (
                <div key={m.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 shadow-sm",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-card border rounded-bl-none"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 text-xs mb-1",
                        isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      <span className="font-medium">{isOwn ? "Você" : m.user.name}</span>
                      <span>· {roleLabel(m.user.role)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                    <p
                      className={cn(
                        "text-[11px] mt-1 text-right",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {new Date(m.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {isClosed ? (
          <div className="border-t p-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/40">
            <p className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
              Este chamado foi encerrado. Reabra-o para enviar novas mensagens.
            </p>
            <Button
              variant="outline"
              onClick={() => handleStatusChange("OPEN")}
              disabled={updatingStatus}
            >
              <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
              Reabrir chamado
            </Button>
          </div>
        ) : (
          <form
            className="border-t p-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Label htmlFor="ticket-reply" className="sr-only">
              Mensagem
            </Label>
            <Textarea
              id="ticket-reply"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva sua mensagem... (Ctrl+Enter para enviar)"
              rows={2}
              className="resize-none min-h-[60px]"
              disabled={sending}
            />
            <Button type="submit" disabled={sending || !text.trim()}>
              <Send className="w-4 h-4 sm:mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">{sending ? "Enviando..." : "Enviar"}</span>
              <span className="sr-only sm:hidden">Enviar</span>
            </Button>
          </form>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Chamados</h1>
              <p className="text-muted-foreground mt-1">
                Canal direto entre o RT da instituição e o fiscal do COREN, independente de uma
                fiscalização específica
              </p>
            </div>
          </div>
          <Button onClick={openNewDialog} className="self-start sm:self-auto">
            <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
            Novo chamado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={cn(
              "md:col-span-1 flex flex-col overflow-hidden md:h-[calc(100vh-14rem)] md:min-h-[480px]",
              selectedId ? "hidden md:flex" : "flex"
            )}
          >
            <div className="p-3 border-b">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
                <TabsList className="grid w-full grid-cols-3" aria-label="Filtrar chamados por status">
                  <TabsTrigger value="OPEN">Abertos</TabsTrigger>
                  <TabsTrigger value="CLOSED">Encerrados</TabsTrigger>
                  <TabsTrigger value="ALL">Todos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 overflow-y-auto">{renderList()}</div>
          </Card>

          <Card
            className={cn(
              "md:col-span-2 flex-col overflow-hidden h-[calc(100vh-12rem)] min-h-[480px] md:h-[calc(100vh-14rem)]",
              selectedId ? "flex" : "hidden md:flex"
            )}
          >
            {renderConversation()}
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar chamado?</AlertDialogTitle>
            <AlertDialogDescription>
              Ninguém poderá enviar novas mensagens enquanto o chamado estiver encerrado. Ele pode
              ser reaberto a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingStatus}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={updatingStatus}
              onClick={(e) => {
                e.preventDefault();
                handleStatusChange("CLOSED");
              }}
            >
              {updatingStatus ? "Encerrando..." : "Encerrar chamado"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={newOpen}
        onOpenChange={(open) => {
          if (!creating) setNewOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo chamado</DialogTitle>
            <DialogDescription>
              {isRT
                ? "Abra uma conversa direta com um fiscal que já enviou uma fiscalização da sua instituição."
                : "Abra uma conversa direta com o RT de uma instituição a quem você já enviou uma fiscalização."}
            </DialogDescription>
          </DialogHeader>

          {loadingContacts ? (
            <div className="space-y-3" aria-busy="true" aria-label="Carregando contatos">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-2 py-6 text-muted-foreground">
              <Inbox className="w-10 h-10" aria-hidden="true" />
              <p className="text-sm">{emptyContactsText}</p>
              <DialogFooter className="w-full pt-2">
                <Button variant="outline" onClick={() => setNewOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-counterpart">{isRT ? "Fiscal" : "RT"}</Label>
                <Select value={newCounterpartId} onValueChange={setNewCounterpartId}>
                  <SelectTrigger id="ticket-counterpart">
                    <SelectValue placeholder={isRT ? "Selecione o fiscal" : "Selecione o RT"} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={`${c.id}-${c.institution.id}`} value={c.id}>
                        {c.name} — {c.institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket-subject">Assunto</Label>
                <Input
                  id="ticket-subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  maxLength={SUBJECT_MAX_LENGTH}
                  placeholder="Ex.: Dúvida sobre o prazo de correção"
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {newSubject.length}/{SUBJECT_MAX_LENGTH}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket-message">Mensagem</Label>
                <Textarea
                  id="ticket-message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Descreva sua dúvida ou solicitação..."
                  rows={5}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!canCreate}>
                  {creating ? "Abrindo..." : "Abrir chamado"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tickets;
