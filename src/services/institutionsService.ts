import { axiosPrivate } from '@/api/api'
import type { Institution } from '@/@types/Institution'

const BASE_PATH = '/institutions'

export interface InstitutionResponse {
    institutions: Institution[];
    totalPages: number;
}

export const institutionsService = {
    /**
     * Lista todas as instituições
     */
    async getAll(page = 1, limit = 100): Promise<InstitutionResponse> {
        const response = await axiosPrivate.get(BASE_PATH, {
            params: { page, limit }
        })
        return response.data
    },

    /**
     * Busca uma instituição pelo ID público
     */
    async getById(id: string): Promise<Institution> {
        const response = await axiosPrivate.get(`${BASE_PATH}/${id}`)
        return response.data.institution
    },

    /**
     * Cria uma nova instituição
     */
    async create(data: Partial<Institution>): Promise<Institution> {
        const response = await axiosPrivate.post(BASE_PATH, data)
        return response.data
    },

    /**
     * Atualiza uma instituição existente
     */
    async update(id: string, data: Partial<Institution>): Promise<Institution> {
        // Filter out empty strings to prevent schema validation errors
        const payload = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
        );
        const response = await axiosPrivate.patch(`${BASE_PATH}/${id}`, payload)
        return response.data
    },

    /**
     * Remove uma instituição (se possível)
     */
    async delete(id: string): Promise<void> {
        await axiosPrivate.delete(`${BASE_PATH}/${id}`)
    }
}
