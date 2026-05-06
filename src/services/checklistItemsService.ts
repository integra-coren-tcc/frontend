import { axiosPrivate } from '@/api/api'
import type {
    ChecklistItem,
    UpdateChecklistItemRequest,
} from '@/@types/ChecklistItem'

const BASE_PATH = '/checklist-items'

export const checklistItemsService = {
    /**
     * Atualiza o status de um item do checklist
     * IMPORTANTE: Para status NON_COMPLIANT, fiscalObservation é obrigatória
     */
    async updateStatus(
        publicId: string,
        data: UpdateChecklistItemRequest
    ): Promise<ChecklistItem> {
        const response = await axiosPrivate.patch(`${BASE_PATH}/${publicId}`, data)
        return response.data
    },

    /**
     * Obtém o histórico de um item do checklist
     */
    async getHistory(itemCode: string): Promise<any[]> {
        const response = await axiosPrivate.get(`${BASE_PATH}/${itemCode}/history`)
        return response.data.history || []
    },

    /**
     * Cria um comentário em um item do checklist (com suporte a múltiplos anexos)
     */
    async createComment(
        inspectionId: string,
        itemCode: string,
        text: string,
        files?: File[]
    ): Promise<any> {
        const formData = new FormData()
        formData.append('text', text)

        if (files && files.length > 0) {
            console.log('🔵 Frontend: Appending files to FormData:', files.length)
            files.forEach((file, idx) => {
                console.log(`   File ${idx}:`, file.name, file.type, file.size)
                formData.append('files', file)
            })
        }

        console.log('🔵 Frontend: FormData entries:')
        for (const [key, value] of formData.entries()) {
            console.log(`   ${key}:`, value)
        }

        // URL corrigida para bater com o backend: /inspections/:inspectionId/checklist-items/:itemCode/comments
        const response = await axiosPrivate.post(
            `/inspections/${inspectionId}${BASE_PATH}/${itemCode}/comments`,
            formData
        )

        return response.data
    },
}


