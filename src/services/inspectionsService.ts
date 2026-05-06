import { axiosPrivate } from '@/api/api'
import type {
    Inspection,
    CreateInspectionRequest,
    UpdateInspectionRequest,
    DashboardData,
    InspectionStats,
} from '@/@types/Inspection'

const BASE_PATH = '/inspections'

export const inspectionsService = {
    /**
     * Lista todas as inspeções
     */
    async getAll(params?: { inspectorId?: string; institutionId?: string; status?: string }): Promise<Inspection[]> {
        const response = await axiosPrivate.get(BASE_PATH, { params })
        return response.data.data || []
    },

    /**
     * Busca uma inspeção específica por ID (com checklist items populados)
     */
    async getById(publicId: string): Promise<Inspection> {
        const response = await axiosPrivate.get(`${BASE_PATH}/${publicId}`)
        return response.data.inspection
    },

    /**
     * Obtém dados do dashboard (inspeções próximas + estatísticas)
     */
    async getDashboard(): Promise<DashboardData> {
        const response = await axiosPrivate.get(`${BASE_PATH}/dashboard`)
        return response.data
    },

    /**
     * Obtém estatísticas de uma inspeção específica
     */
    async getStats(publicId: string): Promise<InspectionStats> {
        const response = await axiosPrivate.get(`${BASE_PATH}/${publicId}/stats`)
        return response.data
    },

    /**
     * Cria uma nova inspeção
     */
    async create(data: CreateInspectionRequest): Promise<Inspection> {
        const response = await axiosPrivate.post(BASE_PATH, data)
        return response.data.inspection
    },

    /**
     * Atualiza uma inspeção (incluindo mudanças de status)
     * IMPORTANTE: Ao mudar status para IN_PROGRESS_INSPECTOR, o backend
     * automaticamente cria os 17 itens fixos (Self-healing)
     */
    async update(
        publicId: string,
        data: UpdateInspectionRequest
    ): Promise<Inspection> {
        const response = await axiosPrivate.patch(`${BASE_PATH}/${publicId}`, data)
        return response.data.inspection
    },

    /**
     * Deleta uma inspeção
     */
    async delete(publicId: string): Promise<void> {
        await axiosPrivate.delete(`${BASE_PATH}/${publicId}`)
    },
}
