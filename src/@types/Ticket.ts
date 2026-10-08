export type TicketStatus = 'OPEN' | 'CLOSED'

export interface TicketPerson {
  id: string
  name: string
  role: string
}

export interface TicketMessage {
  id: string
  text: string
  user: TicketPerson
  createdAt: string
}

export interface Ticket {
  id: string
  subject: string
  status: TicketStatus
  institution: { id: string; name: string }
  rt: TicketPerson
  inspector: TicketPerson
  lastMessage: TicketMessage | null
  messages?: TicketMessage[]
  createdAt: string
  updatedAt: string
}

// Pessoa com quem o usuário pode abrir chamado (fiscal para o RT, RT para o fiscal)
export interface TicketContact {
  id: string
  name: string
  role: 'RT' | 'INSPECTOR'
  institution: { id: string; name: string }
}
