import { axiosPrivate } from '@/api/api'
import type { User } from '@/@types/User'
import type { Institution } from '@/@types/Institution'

const BASE_PATH = '/rts'

export interface RT {
    id: string
    crm: string
    user: User
    userId: number
    institutionId: number
    institution?: Institution
}

export interface RTResponse {
    rts: RT[];
    totalPages: number;
}

export const rtsService = {
    /**
     * Lista todos os RTs
     */
    async getAll(page = 1, limit = 100): Promise<RTResponse> {
        const response = await axiosPrivate.get(BASE_PATH, {
            params: { page, limit }
        })
        return response.data
    },

    /**
     * Busca um RT pelo ID público
     */
    async getById(id: string): Promise<RT> {
        const response = await axiosPrivate.get(`${BASE_PATH}/${id}`)
        return response.data.rt
    },

    /**
     * Cria um novo RT
     */
    async create(data: Partial<RT> & { name: string; email: string; password?: string, crm: string, institutionId: string }): Promise<RT> {
        const response = await axiosPrivate.post(BASE_PATH, data)
        return response.data
    },

    /**
     * Atualiza um RT existente
     */
    async update(id: string, data: Partial<RT> & { name?: string; email?: string, phone?: string, institutionId?: string }): Promise<RT> {
        // Filter out empty strings to prevent schema validation errors (e.g. invalid email "")
        const payload = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
        );
        const response = await axiosPrivate.patch(`${BASE_PATH}/${id}`, payload)
        return response.data
    },

    /**
     * Deleta um RT
     */
    async delete(id: string): Promise<void> {
        await axiosPrivate.delete(`${BASE_PATH}/${id}`)
    }
}
