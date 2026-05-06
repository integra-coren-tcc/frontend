/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
import { useUserStore } from '../stores/userStore'

export const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333'

export const axiosPublic = axios.create({
  baseURL: BASE_URL,
})

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Flag de controle de debug (Mude para true para ativar o debug das requisições)
const ENABLE_REQUEST_DEBUG = false

// Interceptor de Request (habilitável)
const onRequest = (config: any) => {
  if (ENABLE_REQUEST_DEBUG) {
    console.log('📤 Requisição iniciada:')
    console.log('🔗 URL:', config?.url)
    console.log('📦 Body:', config?.data)
    console.log('🔎 Params:', config?.params)
  }

  // Injetar token de autenticação se disponível
  const accessToken = useUserStore.getState().accessToken
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  // CRITICAL: Remove Content-Type header for FormData to let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
}

// Interceptor de Response
const onResponseError = (error: any) => {
  console.error('❌ Erro na resposta HTTP:')
  if (axios.isAxiosError(error)) {
    console.log('🔗 URL:', error.config?.url)
    console.log('📄 Status:', error.response?.status)
    console.log('📥 Data:', error.response?.data)
    console.log('📢 Mensagem:', error.message)
  } else {
    console.log('⚠️ Erro inesperado:', error)
  }
  return Promise.reject(error)
}

axiosPublic.interceptors.request.use(onRequest, Promise.reject)
axiosPublic.interceptors.response.use(undefined, onResponseError)

axiosPrivate.interceptors.request.use(onRequest, Promise.reject)
axiosPrivate.interceptors.response.use(undefined, onResponseError)
