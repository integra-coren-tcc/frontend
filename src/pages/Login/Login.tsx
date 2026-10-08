import React from "react";
import { Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Login.module.css";

const isCpf = (value: string) => !value.includes("@") && value.replace(/\D/g, "").length === 11;

const loginSchema = z.object({
  login: z
    .string()
    .trim()
    .refine(
      (value) => isCpf(value) || z.string().email().safeParse(value).success,
      "Informe um e-mail válido ou um CPF com 11 dígitos"
    ),
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
    // Trim to remove accidental whitespace; the backend accepts the CPF with or without mask
    const cleanData = {
      login: data.login.trim(),
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
                <label htmlFor="login" className={styles.label}>
                  E-mail ou CPF
                </label>
                <input
                  id="login"
                  type="text"
                  placeholder="seu@email.com ou 000.000.000-00"
                  {...register("login")}
                  className={`${styles.input} ${errors.login ? styles.inputError : ""}`}
                  autoComplete="username"
                />
                {errors.login && (
                  <span className={styles.fieldError}>{errors.login.message}</span>
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
