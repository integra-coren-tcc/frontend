import { axiosPrivate } from '@/api/api'
import type { Ticket, TicketContact, TicketMessage, TicketStatus } from '@/@types/Ticket'

const BASE_PATH = '/tickets'

export const ticketsService = {
    async list(): Promise<Ticket[]> {
        const response = await axiosPrivate.get(BASE_PATH)
        return response.data.tickets || []
    },

    /**
     * Chamado com todas as mensagens
     */
    async getById(id: string): Promise<Ticket> {
        const response = await axiosPrivate.get(`${BASE_PATH}/${id}`)
        return response.data.ticket
    },

    async listContacts(): Promise<TicketContact[]> {
        const response = await axiosPrivate.get(`${BASE_PATH}/contacts`)
        return response.data.contacts || []
    },

    async create(data: { counterpartId: string; subject: string; message: string }): Promise<Ticket> {
        const response = await axiosPrivate.post(BASE_PATH, data)
        return response.data.ticket
    },

    async addMessage(id: string, text: string): Promise<TicketMessage> {
        const response = await axiosPrivate.post(`${BASE_PATH}/${id}/messages`, { text })
        return response.data.message
    },

    async updateStatus(id: string, status: TicketStatus): Promise<void> {
        await axiosPrivate.patch(`${BASE_PATH}/${id}`, { status })
    },
}
