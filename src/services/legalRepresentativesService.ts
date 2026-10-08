import { axiosPrivate } from '@/api/api'

const BASE_PATH = '/legal-representatives'

export interface LegalRepresentative {
    id: string
    cpf: string
    user: { id: string; name: string; email: string }
    institution: { id: string; name: string }
}

export const legalRepresentativesService = {
    async list(): Promise<LegalRepresentative[]> {
        const response = await axiosPrivate.get(BASE_PATH)
        return response.data.legalRepresentatives || []
    },

    async create(data: {
        name: string
        email: string
        password: string
        cpf: string
        institutionId: string
        phone?: string
    }): Promise<void> {
        await axiosPrivate.post(BASE_PATH, data)
    },

    async delete(id: string): Promise<void> {
        await axiosPrivate.delete(`${BASE_PATH}/${id}`)
    },
}
