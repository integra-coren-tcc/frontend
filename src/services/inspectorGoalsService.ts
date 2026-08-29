import { axiosPrivate } from '@/api/api'
import type { InspectorGoal, GoalProgressResponse } from '@/@types/InspectorGoal'

const BASE_PATH = '/inspector-goals'

export const inspectorGoalsService = {
    /**
     * Cria ou atualiza a meta de um mês/ano específico (upsert)
     */
    async upsert(month: number, year: number, targetCount: number): Promise<InspectorGoal> {
        const response = await axiosPrivate.put(BASE_PATH, { month, year, targetCount })
        return response.data.goal
    },

    /**
     * Progresso (meta x realizado) mês a mês para um ano
     */
    async getProgress(year: number): Promise<GoalProgressResponse> {
        const response = await axiosPrivate.get(`${BASE_PATH}/progress`, { params: { year } })
        return response.data
    },
}
