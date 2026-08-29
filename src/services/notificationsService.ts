import { axiosPrivate } from '@/api/api'
import type { AppNotification } from '@/@types/Notification'

const BASE_PATH = '/notifications'

export const notificationsService = {
    async getAll(page = 1, limit = 10): Promise<{ data: AppNotification[]; total: number; pages: number }> {
        const response = await axiosPrivate.get(BASE_PATH, { params: { page, limit } })
        return {
            data: response.data.data || [],
            total: response.data.pagination?.total ?? 0,
            pages: response.data.pagination?.pages ?? 0,
        }
    },

    async getUnreadCount(): Promise<number> {
        const response = await axiosPrivate.get(`${BASE_PATH}/unread-count`)
        return response.data.count || 0
    },

    async markAsRead(notificationId: string): Promise<void> {
        await axiosPrivate.patch(`${BASE_PATH}/${notificationId}/read`)
    },

    async markAllAsRead(): Promise<void> {
        await axiosPrivate.patch(`${BASE_PATH}/read-all`)
    },
}
