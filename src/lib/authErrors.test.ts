import { describe, expect, it } from 'vitest'
import { authErrorCode, authErrorMessage } from './authErrors'
import { cleanEnv } from './firebaseConfig'

describe('cleanEnv', () => {
  it('firebaseConfig 에서 복사하며 섞인 따옴표·쉼표·공백을 걷어낸다', () => {
    expect(cleanEnv('"AIzaSyABC",')).toBe('AIzaSyABC')
    expect(cleanEnv("  'wedding-log-ab8be' ")).toBe('wedding-log-ab8be')
    expect(cleanEnv('1:105:web:42e1')).toBe('1:105:web:42e1')
    expect(cleanEnv(undefined)).toBe('')
  })
})

describe('authErrors', () => {
  it('Firebase 오류 객체에서 코드를 꺼낸다', () => {
    expect(authErrorCode({ code: 'auth/invalid-credential' })).toBe('auth/invalid-credential')
    expect(authErrorCode(new Error('x'))).toBe('unknown')
  })

  it('API 키 오류를 따로 안내한다', () => {
    expect(authErrorMessage('auth/api-key-not-valid.-please-pass-a-valid-api-key.')).toContain('API 키')
  })

  it('비밀번호 오류와 알 수 없는 오류를 구분한다', () => {
    expect(authErrorMessage('auth/invalid-credential')).toContain('비밀번호')
    expect(authErrorMessage('auth/something-new')).toBe('로그인에 실패했어요.')
  })
})
