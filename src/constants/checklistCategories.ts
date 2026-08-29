import { ItemType } from "@/@types/ChecklistItem";

export const CATEGORY_LABELS: Record<ItemType, string> = {
    [ItemType.ILEGALIDADE]: "Ilegalidades",
    [ItemType.IRREGULARIDADE]: "Irregularidades",
    [ItemType.INFRACAO_ETICA]: "Infrações Éticas",
    [ItemType.QUESTAO_TRABALHISTA]: "Questões Trabalhistas",
};
