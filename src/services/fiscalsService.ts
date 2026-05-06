import { axiosPrivate } from '@/api/api'
import type { User } from '@/@types/User'

const BASE_PATH = '/inspectors'

export interface Inspector {
    id: string
    cpf: string
    user: User
    userId: number
}

export interface InspectorResponse {
    inspectors: Inspector[];
    totalPages: number;
}

export const fiscalsService = {
    /**
     * Lista todos os fiscais
     */
    async getAll(page = 1, limit = 100): Promise<InspectorResponse> {
        const response = await axiosPrivate.get(BASE_PATH, {
            params: { page, limit }
        })
        return response.data
    },

    /**
     * Busca um fiscal pelo ID público
     */
    async getById(id: string): Promise<Inspector> {
        const response = await axiosPrivate.get(`${BASE_PATH}/${id}`)
        return response.data.inspector
    },

    /**
     * Cria um novo fiscal
     */
    async create(data: Partial<Inspector> & { name: string; email: string; password?: string, cpf: string }): Promise<Inspector> {
        const response = await axiosPrivate.post(BASE_PATH, data)
        return response.data
    },

    /**
     * Atualiza um fiscal existente
     */
    async update(id: string, data: Partial<Inspector> & { name?: string; email?: string }): Promise<Inspector> {
        // Filter out empty strings to prevent schema validation errors
        const payload = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
        );
        const response = await axiosPrivate.patch(`${BASE_PATH}/${id}`, payload)
        return response.data
    },

    /**
     * Deleta um fiscal
     */
    async delete(id: string): Promise<void> {
        await axiosPrivate.delete(`${BASE_PATH}/${id}`)
    }
}
