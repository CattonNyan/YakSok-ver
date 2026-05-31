const INTERNAL_AUTH_DOMAIN = 'users.yaksok.local'
const USERNAME_PATTERN = /^[a-z0-9_]{4,20}$/
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(normalizeUsername(username))
}

export function usernameToAuthEmail(username: string) {
  return `${normalizeUsername(username)}@${INTERNAL_AUTH_DOMAIN}`
}

export function isStrongPassword(password: string) {
  return PASSWORD_PATTERN.test(password)
}

export const usernameRuleMessage = '아이디는 영문 소문자, 숫자, 밑줄(_)만 사용해 4~20자로 입력해 주세요.'
export const passwordRuleMessage = '비밀번호는 대문자, 소문자, 특수문자를 포함해 8자 이상이어야 합니다.'
