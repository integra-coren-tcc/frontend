import { useNavigate } from "react-router-dom";
import { User, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import MobileMenu from "./MobileMenu";
import NotificationBell from "./NotificationBell";
import { useUserStore } from "@/stores/userStore";

interface HeaderProps {
  userType?: "admin" | "inspector" | "rt"; // Optional now, or remove if store has it
  userName?: string; // Optional now
}

const Header = (_props: HeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const getUserTypeLabel = (role: string | undefined) => {
    switch (role) {
      case "ADMIN":
        return "Administrador";
      case "INSPECTOR":
        return "Fiscal";
      case "RT":
        return "Responsável Técnico";
      case "LEGAL_REPRESENTATIVE":
        return "Representante Legal";
      default:
        return "";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Safe access to role, converting it to lowercase for MobileMenu if needed or refactoring MobileMenu
  const userRole = user?.role || "RT";
  const userTypeForMenu =
    userRole === "ADMIN"
      ? "admin"
      : userRole === "INSPECTOR"
        ? "inspector"
        : userRole === "LEGAL_REPRESENTATIVE"
          ? "legalRepresentative"
          : "rt";

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu and Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu */}
          <MobileMenu userType={userTypeForMenu} />

          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">IntegraCoren</h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Fiscalização de Instituições de Saúde
            </p>
          </div>
        </div>

        {/* Right Side - User Menu */}
        <div className="flex items-center gap-4">
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{user?.name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground">
                    {getUserTypeLabel(user?.role)}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;