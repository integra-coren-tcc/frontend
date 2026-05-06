import { useState, useRef, useEffect } from "react";
import { Menu, X, Building2, Users, FileText, Calendar, TrendingUp, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface MobileMenuProps {
  userType: "admin" | "inspector" | "rt";
}

const MobileMenu = ({ userType }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getMenuItems = () => {
    switch (userType) {
      case "admin":
        return [
          { icon: Building2, label: "Dashboard", path: "/dashboard/admin" },
          { icon: Building2, label: "Gerenciar Instituições", path: "/admin/institutions" },
          { icon: Users, label: "Gerenciar Fiscais", path: "/admin/fiscals" },
          { icon: Users, label: "Gerenciar RTs", path: "/admin/rts" },
          { icon: FileText, label: "Relatórios Gerais", path: "/admin/reports" },
          { icon: Building2, label: "Nova Instituição", path: "/admin/institutions/new" },
          { icon: Users, label: "Novo Fiscal", path: "/admin/fiscals/new" },
          { icon: Users, label: "Novo RT", path: "/admin/rts/new" },
        ];
      case "inspector":
        return [
          { icon: TrendingUp, label: "Dashboard", path: "/dashboard/fiscal" },
          { icon: Calendar, label: "Agendar Fiscalização", path: "/fiscal/schedule" },
          { icon: ClipboardCheck, label: "Checklist", path: "/checklist" },
          { icon: FileText, label: "Meus Relatórios", path: "/fiscal/reports" },
        ];
      case "rt":
        return [
          { icon: TrendingUp, label: "Dashboard", path: "/dashboard/rt" },

        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="py-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={index}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors ${isActive ? "bg-muted text-primary font-medium" : "text-foreground"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;