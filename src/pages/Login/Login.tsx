import React from "react";
import { Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Login.module.css";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { authenticate, isPending, getRouteByRole } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Trim email to remove accidental whitespace
    const cleanData = {
      email: data.email.trim(),
      password: data.password
    };

    await authenticate(
      cleanData,
      (name, error) => setError(name as keyof LoginFormData | "root", error),
      reset
    );
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginWrapper}>
        {/* Header */}
        <div className={styles.loginHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <Heart className={styles.logoIcon} />
            </div>
          </div>
          <h1 className={styles.loginTitle}>IntegraCoren</h1>
          <p className={styles.loginSubtitle}>Sistema de Fiscalização de Unidades de Saúde</p>
        </div>

        {/* Login Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Acesso ao Sistema</h2>
            <p className={styles.cardDescription}>
              Faça login para acessar o sistema de fiscalização
            </p>
          </div>
          <div className={styles.cardContent}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              {/* Root error message */}
              {errors.root && (
                <div className={styles.errorMessage}>
                  {errors.root.message}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  autoComplete="email"
                />
                {errors.email && (
                  <span className={styles.fieldError}>{errors.email.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                  autoComplete="current-password"
                />
                {errors.password && (
                  <span className={styles.fieldError}>{errors.password.message}</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.button}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className={styles.buttonSpinner} />
                    Entrando...
                  </>
                ) : (
                  "Entrar no Sistema"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
