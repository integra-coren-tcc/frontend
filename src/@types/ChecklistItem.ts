// Enums baseados no schema Prisma do backend
export enum ItemType {
    ILEGALIDADE = 'ILEGALIDADE',
    IRREGULARIDADE = 'IRREGULARIDADE',
    INFRACAO_ETICA = 'INFRACAO_ETICA',
    QUESTAO_TRABALHISTA = 'QUESTAO_TRABALHISTA',
}

export enum ItemStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    VERIFIED = 'VERIFIED',
    NOT_APPLICABLE = 'NOT_APPLICABLE',
    NON_COMPLIANT = 'NON_COMPLIANT',
    AWAITING_ANALYSIS = 'AWAITING_ANALYSIS',
    AWAITING_CORRECTION = 'AWAITING_CORRECTION', // RT needs to resubmit after fiscal rejection
    COMPLIANT = 'COMPLIANT',
}

// Attachment type
export interface Attachment {
    id: number
    publicId: string
    originalName: string | null
    fileName: string | null
    mimeType: string | null
    size: number | null
    path: string | null
    url: string | null
    createdAt: string
}

// Comment type
export interface ChecklistComment {
    id: number
    publicId: string
    text: string
    createdAt: string
    user: {
        id: number
        name: string
        role: string
    }
    attachments: Attachment[]
}

// Interface baseada no InspectionPresenter.toHTTP() do backend
export interface ChecklistItem {
    id: string
    publicId: string
    itemCode: string
    itemType: ItemType
    selected: boolean
    deadline: string | null
    notification: string
    justification?: string
    status: ItemStatus
    resolvedAt: string | null
    createdAt: string
    updatedAt: string
    comments?: ChecklistComment[]
}

// Tipos para requests
export interface UpdateChecklistItemRequest {
    status?: ItemStatus
    justification?: string
}

export interface CreateChecklistCommentRequest {
    text: string
    file?: File
}
