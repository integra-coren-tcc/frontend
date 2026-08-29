import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/contexts/SocketContext";
import { notificationsService } from "@/services/notificationsService";
import { AppNotification } from "@/@types/Notification";

const NotificationBell = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Erro ao buscar contagem de notificações:", err);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsService.getAll(1, 10);
      setNotifications(data);
    } catch (err) {
      console.error("Erro ao buscar notificações:", err);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (payload: AppNotification) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (notification.read) return;
    try {
      await notificationsService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma notificação por aqui.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex-col items-start gap-0.5 whitespace-normal py-2 ${!notification.read ? "bg-muted/50" : ""}`}
              >
                <span className="text-sm font-medium">{notification.title}</span>
                <span className="text-xs text-muted-foreground">{notification.message}</span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {new Date(notification.createdAt).toLocaleString("pt-BR")}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
