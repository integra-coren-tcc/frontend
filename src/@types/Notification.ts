export interface AppNotification {
    id: string
    type: string
    title: string
    message: string
    read: boolean
    createdAt: string
    data?: Record<string, unknown>
}
