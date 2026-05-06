import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import styles from "./NotFound.module.css";

const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className={styles.notFoundContainer}>
      <div className={styles.notFoundContent}>
        <h1 className={styles.notFoundTitle}>404</h1>
        <p className={styles.notFoundMessage}>Oops! Página não encontrada</p>
        <Link to="/" className={styles.notFoundLink}>
          Voltar para o Início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;