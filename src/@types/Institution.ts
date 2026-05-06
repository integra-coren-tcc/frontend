export interface InstitutionRT {
    id: string
    name: string
    email: string
}

export interface Institution {
    id: string
    cnpj: string
    name: string
    type: string
    capacity?: number
    address?: string
    createdAt: string
    updatedAt: string
    rts?: InstitutionRT[]
}
