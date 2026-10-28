export interface FixedChecklistItem {
    code: string
    category: 'ILEGALIDADE' | 'IRREGULARIDADE' | 'INFRACAO_ETICA' | 'QUESTAO_TRABALHISTA'
    description: string
    defaultDeadlineDays: number
}

export const FIXED_CHECKLIST_ITEMS: FixedChecklistItem[] = [
    // 1. Categoria: ILEGALIDADES
    {
        code: 'ILEGAL_ENF_EXISTENCIA',
        category: 'ILEGALIDADE',
        description: 'Notif. 3.3 – Inexistência ou ausência de Enfermeiro em setor ou período em que são desenvolvidas atividades de Enfermagem.',
        defaultDeadlineDays: 15,
    },
    {
        code: 'ILEGAL_EXERCICIO_PROFISSIONAL',
        category: 'ILEGALIDADE',
        description: 'Notif. 3.5 – Exercício Ilegal/Irregular: Afastar trabalhadores sem inscrição, com inscrição suspensa ou que ultrapassem sua habilitação legal.',
        defaultDeadlineDays: 0,
    },
    {
        code: 'ILEGAL_SUPERVISAO',
        category: 'ILEGALIDADE',
        description: 'Notif. 3.12 – Supervisão: Impedir que técnicos e auxiliares trabalhem sem a supervisão e direção de um enfermeiro.',
        defaultDeadlineDays: 0,
    },

    // 2. Categoria: IRREGULARIDADES
    {
        code: 'IRREG_ART',
        category: 'IRREGULARIDADE',
        description: 'Notif. 3.6 – Anotação de Responsabilidade Técnica (ART): Providenciar ou regularizar a ART do Enfermeiro Responsável.',
        defaultDeadlineDays: 30,
    },
    {
        code: 'IRREG_REGISTRO_EMPRESA',
        category: 'IRREGULARIDADE',
        description: 'Notif. 3.7 – Registro de Empresa: Registrar a empresa no Conselho conforme legislação vigente.',
        defaultDeadlineDays: 30,
    },
    {
        code: 'IRREG_PLANEJAMENTO',
        category: 'IRREGULARIDADE',
        description: 'Notif. 3.0 – Inexistência ou inadequação de planejamento e programação da atividade de Enfermagem na unidade.',
        defaultDeadlineDays: 60,
    },
    {
        code: 'IRREG_DOCUMENTOS_GERENCIAIS',
        category: 'IRREGULARIDADE',
        description: 'Notif. 3.13 – Elaborar ou adequar normas, rotinas, protocolos e Procedimentos Operacionais Padrão (POP) do serviço.',
        defaultDeadlineDays: 30,
    },
    {
        code: 'IRREG_PRONTUARIOS',
        category: 'IRREGULARIDADE',
        description: 'Notif. 3.14 – Registros de Assistência: Garantir o registro das ações de Enfermagem e informações no prontuário do paciente.',
        defaultDeadlineDays: 15,
    },

    // 3. Categoria: INFRAÇÕES ÉTICAS
    {
        code: 'ETICA_DECISOES',
        category: 'INFRACAO_ETICA',
        description: 'Notif. 3.8 – Cumprimento de Decisões Éticas: Cumprir decisões disciplinares de suspensão ou cassação do exercício profissional.',
        defaultDeadlineDays: 0,
    },
    {
        code: 'ETICA_COMISSAO',
        category: 'INFRACAO_ETICA',
        description: 'Notif. 3.15 – Comissão de Ética: Implantar a Comissão de Ética de Enfermagem na instituição conforme legislação.',
        defaultDeadlineDays: 90,
    },

    // 4. Categoria: QUESTÕES TRABALHISTAS
    {
        code: 'TRAB_ESCALA',
        category: 'QUESTAO_TRABALHISTA',
        description: 'Notif. 3.13 – Escala de Serviço: Elaborar ou adequar escala constando nomes, registros e assinaturas em local visível.',
        defaultDeadlineDays: 5,
    },
    {
        code: 'TRAB_DIMENSIONAMENTO',
        category: 'QUESTAO_TRABALHISTA',
        description: 'Notif. 3.10 – Dimensionamento: Disponibilizar número adequado de profissionais de enfermagem em eventos ou unidades conforme a Lei.',
        defaultDeadlineDays: 0,
    }
];
