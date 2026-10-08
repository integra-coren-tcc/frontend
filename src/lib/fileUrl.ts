import { BASE_URL } from '@/api/api'

// Arquivos enviados são servidos pelo backend em /uploads/...
export function fileUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return `${BASE_URL.replace(/\/$/, '')}${path}`
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
