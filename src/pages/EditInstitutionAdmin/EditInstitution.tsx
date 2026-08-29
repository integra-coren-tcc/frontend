import React, { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import Header from "@/components/layout/Header";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./EditInstitutionAdmin.module.css";
import { institutionsService } from "@/services/institutionsService";
import { useToast } from "@/hooks/use-toast";

const EditInstitution: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Select dropdowns state
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    responsibleTechnician: "",
    rtEmail: "",
    rtPhone: "",
    rtCrm: "",
    type: "",
    capacity: "",
    description: "",
  });

  useEffect(() => {
    if (id) {
      loadInstitutionData(id);
    }
  }, [id]);

  const loadInstitutionData = async (institutionId: string) => {
    try {
      const institution = await institutionsService.getById(institutionId);

      // Parse address if possible: "Address, Neighborhood, City - State, Zip"
      const parsedAddress = {
        address: institution.address || "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: ""
      };

      if (institution.address) {
        const parts = institution.address.split(", ");
        if (parts.length >= 2) {
          // Try to find the "City - State" part
          const lastPart = parts[parts.length - 1]; // "Zip"
          const secondLastPart = parts[parts.length - 2]; // "City - State"?

          if (lastPart && /^\d{5}-?\d{3}$/.test(lastPart)) {
            parsedAddress.zipCode = lastPart;

            if (secondLastPart && secondLastPart.includes(" - ")) {
              const [city, state] = secondLastPart.split(" - ");
              parsedAddress.city = city;
              parsedAddress.state = state.toLowerCase();

              // Neighborhood is likely the part before City - State
              if (parts.length >= 3) {
                parsedAddress.neighborhood = parts[parts.length - 3];
                // Address is everything before neighborhood
                parsedAddress.address = parts.slice(0, parts.length - 3).join(", ");
              }
            }
          }
        }
      }

      setFormData({
        name: institution.name,
        cnpj: institution.cnpj,
        address: parsedAddress.address,
        neighborhood: parsedAddress.neighborhood,
        city: parsedAddress.city,
        state: parsedAddress.state,
        zipCode: parsedAddress.zipCode,
        phone: "",
        email: "",
        responsibleTechnician: "",
        rtEmail: "",
        rtPhone: "",
        rtCrm: "",
        type: institution.type,
        capacity: institution.capacity ? String(institution.capacity) : "",
        description: "",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados da instituição.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsLoading(true);

    try {
      // Reconstruct address
      const fullAddress = `${formData.address}${formData.neighborhood ? `, ${formData.neighborhood}` : ""}${formData.city ? `, ${formData.city}` : ""}${formData.state ? ` - ${formData.state.toUpperCase()}` : ""}${formData.zipCode ? `, ${formData.zipCode}` : ""}`;

      await institutionsService.update(id, {
        name: formData.name,
        address: fullAddress,
        type: formData.type,
        capacity: Number(formData.capacity) || undefined
      });

      toast({
        title: "Instituição atualizada",
        description: "Dados salvos com sucesso.",
      });
      navigate("/admin/institutions");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (value: string) => {
    switch (value) {
      case "HOSPITAL":
        return "Hospital";
      case "CLINIC":
        return "Clínica";
      case "HEALTH_CENTER":
        return "Centro de Saúde/UBS";
      case "LABORATORY":
        return "Laboratório";
      default:
        return "Selecione o tipo";
    }
  };

  const getStateLabel = (value: string) => {
    switch (value) {
      case "sp":
        return "São Paulo";
      case "rj":
        return "Rio de Janeiro";
      case "mg":
        return "Minas Gerais";
      default:
        return "UF";
    }
  };

  if (isLoadingData) {
    return (
      <div className={styles.editInstitutionContainer}>
        <Header />
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingText}>Carregando dados da instituição...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editInstitutionContainer}>
      <Header />

      <div className={styles.pageContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/admin/institutions")}
          >
            <ArrowLeft className={styles.backButtonIcon} />
          </button>
          <div className={styles.headerContent}>
            <h1>Editar Instituição</h1>
            <p>Atualize os dados da instituição</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Basic Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Informações Básicas</h2>
              <p className={styles.cardDescription}>Dados gerais da instituição</p>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    Nome da Instituição *
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={styles.input}
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: UBS Vila Nova"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="cnpj" className={styles.label}>
                    CNPJ *
                  </label>
                  <input
                    id="cnpj"
                    type="text"
                    className={styles.input}
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    disabled // CNPJ usually not editable
                  />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label htmlFor="type" className={styles.label}>
                    Tipo da Unidade *
                  </label>
                  <div className={styles.select}>
                    <button
                      type="button"
                      className={styles.selectTrigger}
                      onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                      onBlur={() => setTimeout(() => setTypeDropdownOpen(false), 200)}
                    >
                      <span className={formData.type ? "" : styles.selectPlaceholder}>
                        {getTypeLabel(formData.type)}
                      </span>
                    </button>
                    <div
                      className={`${styles.selectDropdown} ${!typeDropdownOpen ? styles.selectHidden : ""
                        }`}
                    >
                      <div
                        className={styles.selectOption}
                        onClick={() => {
                          handleInputChange("type", "HOSPITAL");
                          setTypeDropdownOpen(false);
                        }}
                      >
                        Hospital
                      </div>
                      <div
                        className={styles.selectOption}
                        onClick={() => {
                          handleInputChange("type", "CLINIC");
                          setTypeDropdownOpen(false);
                        }}
                      >
                        Clínica
                      </div>
                      <div
                        className={styles.selectOption}
                        onClick={() => {
                          handleInputChange("type", "HEALTH_CENTER");
                          setTypeDropdownOpen(false);
                        }}
                      >
                        Centro de Saúde/UBS
                      </div>
                      <div
                        className={styles.selectOption}
                        onClick={() => {
                          handleInputChange("type", "LABORATORY");
                          setTypeDropdownOpen(false);
                        }}
                      >
                        Laboratório
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="capacity" className={styles.label}>
                    Capacidade de Atendimento
                  </label>
                  <input
                    id="capacity"
                    type="text"
                    className={styles.input}
                    value={formData.capacity}
                    onChange={(e) => handleInputChange("capacity", e.target.value)}
                    placeholder="Ex: 500 pacientes/mês"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Descrição
                </label>
                <textarea
                  id="description"
                  className={styles.textarea}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descreva os serviços oferecidos pela unidade..."
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Endereço</h2>
              <p className={styles.cardDescription}>Localização da instituição</p>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.formGroup}>
                <label htmlFor="address" className={styles.label}>
                  Endereço Completo *
                </label>
                <input
                  id="address"
                  type="text"
                  className={styles.input}
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Rua, número, complemento"
                  required
                  maxLength={30}
                />
              </div>

              <div className={styles.formGrid3}>
                <div className={styles.formGroup}>
                  <label htmlFor="neighborhood" className={styles.label}>
                    Bairro *
                  </label>
                  <input
                    id="neighborhood"
                    type="text"
                    className={styles.input}
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    Cidade *
                  </label>
                  <input
                    id="city"
                    type="text"
                    className={styles.input}
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="state" className={styles.label}>
                    Estado *
                  </label>
                  <div className={styles.select}>
                    <button
                      type="button"
                      className={styles.selectTrigger}
                      onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                      onBlur={() => setTimeout(() => setStateDropdownOpen(false), 200)}
                    >
                      <span className={formData.state ? "" : styles.selectPlaceholder}>
                        {getStateLabel(formData.state)}
                      </span>
                    </button>
                    <div
                      className={`${styles.selectDropdown} ${!stateDropdownOpen ? styles.selectHidden : ""
                        }`}
                    >
                      <div
                        className={styles.selectOption}
                        onClick={() => {
                          handleInputChange("state", "sp");
                          setStateDropdownOpen(false);
                        }}
                      >
                        São Paulo
                      </div>
                      <div
                        className={styles.selectOption}
                        onClick={() => {
                          handleInputChange("state", "rj");
                          setStateDropdownOpen(false);
                        }}
                      >
                        Rio de Janeiro
                      </div>
                      <div
                        className={styles.selectOption}
                        onClick={() => {
                          handleInputChange("state", "mg");
                          setStateDropdownOpen(false);
                        }}
                      >
                        Minas Gerais
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label htmlFor="zipCode" className={styles.label}>
                    CEP
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    className={styles.input}
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>
                    Telefone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={styles.input}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contato@ubs.com.br"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonOutline}`}
              onClick={() => navigate("/admin/institutions")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {isLoading ? (
                "Salvando..."
              ) : (
                <>
                  <Save className={styles.buttonIcon} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInstitution;