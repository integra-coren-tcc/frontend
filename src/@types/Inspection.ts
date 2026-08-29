import { ChecklistItem } from './ChecklistItem'

// Enums baseados no schema Prisma
export enum InspectionStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    IN_PROGRESS_INSPECTOR = 'IN_PROGRESS_INSPECTOR',
    AWAITING_CORRECTION = 'AWAITING_CORRECTION',
    COMPLETED = 'COMPLETED',
}

export enum Priority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum InstitutionType {
    HOSPITAL = 'HOSPITAL',
    CLINIC = 'CLINIC',
    HEALTH_CENTER = 'HEALTH_CENTER',
    LABORATORY = 'LABORATORY',
}

// Tipos auxiliares
export interface Institution {
    id: string
    name: string
    cnpj: string
    type: InstitutionType
    address?: string
}

export interface Inspector {
    id: string
    cpf: string
    user: {
        id: string
        name: string
        email: string
    }
}

export interface ResponsibleTechnician {
    id: string
    crm: string
    user: {
        id: string
        name: string
        email: string
    }
}

// Interface principal baseada no InspectionPresenter.toHTTP()
export interface Inspection {
    id: string
    date: string
    observations: string | null
    priority: Priority
    status: InspectionStatus
    startedAt: string | null
    completedAt: string | null
    createdAt: string
    updatedAt: string
    institution?: Institution
    inspector?: Inspector
    responsibleTechnician?: ResponsibleTechnician
    manualRtName?: string | null
    manualRtCrm?: string | null
    checklistItems: ChecklistItem[]
}

// Tipos para requests
export interface CreateInspectionRequest {
    date: string
    observations?: string
    priority: Priority
    institutionPublicId: string
    inspectorPublicId?: string
    responsibleTechnicianPublicId?: string
}

export interface UpdateInspectionRequest {
    date?: string
    observations?: string
    priority?: Priority
    status?: InspectionStatus
    startedAt?: string
    completedAt?: string
    manualRtName?: string
    manualRtCrm?: string
}

// Tipos para responses
export interface InspectionStats {
    total: number
    scheduled: number
    inProgress: number
    awaitingCorrection: number
    completed: number
}

export interface PendingByInstitutionGroup {
    institution: {
        publicId: string
        name: string
    }
    nearDeadlineCount: number
    inspections: Array<{
        id: string
        date: string
        status: InspectionStatus
        priority: Priority
        nearDeadlineItems: Array<{
            itemCode: string
            notification: string
            deadline: string
        }>
    }>
}

export interface DashboardData {
    upcomingInspections: Inspection[]
    stats: InspectionStats
    totalInspections?: number
    completedThisMonth?: number
    activeFiscalizations?: number
}
