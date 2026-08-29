import { describe, it, expect } from 'vitest'
import { getErrorMessage, getErrorStatus } from './getErrorMessage'

describe('getErrorMessage', () => {
  it('extracts the message from an Axios-like error response', () => {
    const err = { response: { data: { message: 'Não encontrado' } } }
    expect(getErrorMessage(err, 'fallback')).toBe('Não encontrado')
  })

  it('falls back when the error has no response', () => {
    expect(getErrorMessage(new Error('network error'), 'fallback')).toBe('fallback')
  })

  it('falls back when the response has no message field', () => {
    const err = { response: { data: {} } }
    expect(getErrorMessage(err, 'fallback')).toBe('fallback')
  })

  it('falls back for non-object errors', () => {
    expect(getErrorMessage('just a string', 'fallback')).toBe('fallback')
    expect(getErrorMessage(null, 'fallback')).toBe('fallback')
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback')
  })
})

describe('getErrorStatus', () => {
  it('extracts the HTTP status from an Axios-like error response', () => {
    const err = { response: { status: 409 } }
    expect(getErrorStatus(err)).toBe(409)
  })

  it('returns undefined when there is no response', () => {
    expect(getErrorStatus(new Error('network error'))).toBeUndefined()
  })

  it('returns undefined for non-object errors', () => {
    expect(getErrorStatus('just a string')).toBeUndefined()
  })
})
