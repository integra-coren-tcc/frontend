export type LibraryCategory =
  | 'LEGISLACAO'
  | 'MANUAL'
  | 'INSTRUMENTO_ADMINISTRATIVO'
  | 'MODELO_DOCUMENTO'
  | 'ORIENTACAO'

export const LIBRARY_CATEGORY_LABELS: Record<LibraryCategory, string> = {
  LEGISLACAO: 'Legislação',
  MANUAL: 'Manuais',
  INSTRUMENTO_ADMINISTRATIVO: 'Instrumentos administrativos',
  MODELO_DOCUMENTO: 'Modelos de documentos',
  ORIENTACAO: 'Orientações e pareceres',
}

// Documento da biblioteca: ou um arquivo enviado (path) ou um link externo (externalUrl)
export interface LibraryDocument {
  id: string
  title: string
  description: string | null
  category: LibraryCategory
  keywords: string | null
  externalUrl: string | null
  originalName: string | null
  mimeType: string | null
  size: number | null
  path: string | null
  createdAt: string
}

export type InstitutionDocumentType =
  | 'REGIMENTO_INTERNO'
  | 'DIMENSIONAMENTO'
  | 'PRS'
  | 'PROTOCOLO_POP'
  | 'ESCALA'
  | 'OUTRO'

export const INSTITUTION_DOCUMENT_TYPE_LABELS: Record<InstitutionDocumentType, string> = {
  REGIMENTO_INTERNO: 'Regimento interno',
  DIMENSIONAMENTO: 'Dimensionamento de pessoal',
  PRS: 'PRS',
  PROTOCOLO_POP: 'Protocolos / POPs',
  ESCALA: 'Escala de trabalho',
  OUTRO: 'Outro',
}

export interface InstitutionDocument {
  id: string
  type: InstitutionDocumentType
  title: string
  validUntil: string | null
  originalName: string
  mimeType: string
  size: number
  path: string
  uploadedBy: { id: string; name: string }
  createdAt: string
}
