
import React, { useState } from "react";
import { User, Mail, Phone, Save } from "lucide-react";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "@/hooks/use-toast";
import { axiosPrivate } from "@/api/api";
import { z } from "zod";

const passwordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { toast } = useToast();
  const [userType] = useState<"admin" | "inspector" | "rt">(
    user?.role === 'ADMIN' ? 'admin' :
      user?.role === 'RT' ? 'rt' : 'inspector'
  );

  const [profileData, setProfileData] = useState({
    name: user?.name || "Usuário",
    email: user?.email || "",
    phone: user?.phone || "",
    registration: user?.inspectorPublicId || "N/A",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleSave = () => {
    toast({ title: "Funcionalidade de editar perfil em desenvolvimento." });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPassword(true);

    try {
      const validation = passwordSchema.safeParse(passwordData);
      if (!validation.success) {
        toast({
          title: "Erro de validação",
          description: validation.error.errors[0].message,
          variant: "destructive"
        });
        return;
      }

      await axiosPrivate.patch("/password", {
        oldPassword: passwordData.oldPassword || undefined,
        newPassword: passwordData.newPassword
      });

      toast({ title: "Senha atualizada com sucesso!" });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao atualizar senha",
        description: "Verifique sua senha atual e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className={styles.profileContainer}>
      <Header userType={userType} userName={profileData.name} />

      <div className={styles.pageContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1>Meu Perfil</h1>
            <p>Gerencie suas informações pessoais e de segurança</p>
          </div>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonOutline}`}
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
        </div>

        <div className={styles.profileGrid} style={{ gridTemplateColumns: "1fr" }}>
          {/* Profile Form */}
          <div className={styles.profileMain}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Informações Pessoais</h2>
                <p className={styles.cardDescription}>
                  Mantenha seus dados atualizados.
                </p>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>Nome Completo</label>
                    <input
                      id="name"
                      type="text"
                      className={styles.input}
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>E-mail</label>
                    <input
                      id="email"
                      type="email"
                      className={styles.input}
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>Telefone</label>
                    <input
                      id="phone"
                      type="tel"
                      className={styles.input}
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Registro / ID</label>
                    <input
                      type="text"
                      className={`${styles.input} bg-gray-100 cursor-not-allowed`}
                      value={profileData.registration}
                      readOnly
                    />
                  </div>
                </div>

                <div className={styles.separator} />

                <div className={styles.formFooter}>
                  <button
                    type="button"
                    onClick={handleSave}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    <Save className={styles.buttonIcon} />
                    Salvar Dados Pessoais
                  </button>
                </div>
              </div>
            </div>

            {/* Security Settings - Password Change */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Alterar Senha</h2>
                <p className={styles.cardDescription}>
                  Atualize sua senha de acesso.
                </p>
              </div>
              <div className={styles.cardContent}>
                <form onSubmit={handlePasswordChange} className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Senha Atual</label>
                    <input
                      type="password"
                      className={styles.input}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nova Senha</label>
                    <input
                      type="password"
                      className={styles.input}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Confirmar Nova Senha</label>
                    <input
                      type="password"
                      className={styles.input}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ justifyContent: 'flex-end' }}>
                    <label className={styles.label} style={{ visibility: 'hidden' }}>Botão</label>
                    <button
                      type="submit"
                      disabled={loadingPassword}
                      className={`${styles.button} ${styles.buttonPrimary}`}
                      style={{ width: '100%', height: '42px' }} // Match input height roughly
                    >
                      {loadingPassword ? "Atualizando..." : "Atualizar Senha"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;