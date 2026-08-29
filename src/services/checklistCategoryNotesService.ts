import { axiosPrivate } from '@/api/api'
import { ItemType } from '@/@types/ChecklistItem'

export interface CategoryNote {
    id: string
    itemType: ItemType
    text: string
    user: {
        id: string
        name: string
        role: string
    }
    createdAt: string
}

export const checklistCategoryNotesService = {
    async list(inspectionId: string, itemType: ItemType): Promise<CategoryNote[]> {
        const response = await axiosPrivate.get(
            `/inspections/${inspectionId}/category-notes`,
            { params: { itemType } }
        )
        return response.data.notes || []
    },

    async create(inspectionId: string, itemType: ItemType, text: string): Promise<CategoryNote> {
        const response = await axiosPrivate.post(
            `/inspections/${inspectionId}/category-notes`,
            { itemType, text }
        )
        return response.data.note
    },
}
