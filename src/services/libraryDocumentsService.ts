import { axiosPrivate } from '@/api/api'
import type { LibraryCategory, LibraryDocument } from '@/@types/Documents'

const BASE_PATH = '/library-documents'

export const libraryDocumentsService = {
    async list(params?: { search?: string; category?: LibraryCategory }): Promise<LibraryDocument[]> {
        const response = await axiosPrivate.get(BASE_PATH, { params })
        return response.data.documents || []
    },

    /**
     * Admin: cria um documento com arquivo (campo `file`) OU link externo (`externalUrl`)
     */
    async create(data: {
        title: string
        category: LibraryCategory
        description?: string
        keywords?: string
        externalUrl?: string
        file?: File | null
    }): Promise<LibraryDocument> {
        const form = new FormData()
        form.append('title', data.title)
        form.append('category', data.category)
        if (data.description) form.append('description', data.description)
        if (data.keywords) form.append('keywords', data.keywords)
        if (data.externalUrl) form.append('externalUrl', data.externalUrl)
        if (data.file) form.append('file', data.file)

        const response = await axiosPrivate.post(BASE_PATH, form)
        return response.data.document
    },

    async delete(id: string): Promise<void> {
        await axiosPrivate.delete(`${BASE_PATH}/${id}`)
    },
}
