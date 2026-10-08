import { axiosPrivate } from '@/api/api'
import type { InstitutionDocument, InstitutionDocumentType } from '@/@types/Documents'

const BASE_PATH = '/institution-documents'

export const institutionDocumentsService = {
    /**
     * RT e representante legal: sempre a própria instituição (institutionId é ignorado).
     * Fiscal e admin: informar o institutionId (id público da instituição).
     */
    async list(institutionId?: string): Promise<InstitutionDocument[]> {
        const response = await axiosPrivate.get(BASE_PATH, { params: { institutionId } })
        return response.data.documents || []
    },

    /**
     * RT (própria instituição) ou admin (informando institutionId)
     */
    async create(data: {
        type: InstitutionDocumentType
        title: string
        file: File
        validUntil?: string // AAAA-MM-DD
        institutionId?: string
    }): Promise<InstitutionDocument> {
        const form = new FormData()
        form.append('type', data.type)
        form.append('title', data.title)
        if (data.validUntil) form.append('validUntil', data.validUntil)
        if (data.institutionId) form.append('institutionId', data.institutionId)
        form.append('file', data.file)

        const response = await axiosPrivate.post(BASE_PATH, form)
        return response.data.document
    },

    async delete(id: string): Promise<void> {
        await axiosPrivate.delete(`${BASE_PATH}/${id}`)
    },
}
