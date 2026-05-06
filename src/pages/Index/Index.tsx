import React from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./Index.module.css";

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.indexContainer}>
      <div className={styles.indexContent}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <Heart className={styles.logoIcon} />
          </div>
        </div>
        <h1 className={styles.indexTitle}>FiscSaúde</h1>
        <p className={styles.indexSubtitle}>Sistema de Fiscalização de Unidades de Saúde</p>
        <p className={styles.indexDescription}>
          Plataforma completa para monitoramento e fiscalização de UBS
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className={styles.button}
        >
          Acessar Sistema
        </button>
      </div>
    </div>
  );
};

export default Index;