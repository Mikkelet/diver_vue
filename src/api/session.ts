import axios from 'axios'

/** Mirrors diver_auth's User model. */
export interface SessionUser {
    subject: string
    email?: string | null
    displayName?: string | null
    photoUrl?: string | null
    provider?: string | null
    createdAt: number
    lastLoginAt: number
}

export interface TokenPair {
    accessToken: string
    refreshToken: string
    /** Access token lifetime in seconds. */
    expiresIn: number
    user: SessionUser
}

const authApi = axios.create({
    baseURL: import.meta.env.VITE_AUTH_BASE_URL,
    headers: {'Content-Type': 'application/json'},
})

/** diver_auth answers failures with a plain-text body; surface it verbatim. */
function toError(e: unknown, fallback: string): Error {
    const detail = (e as {response?: {data?: unknown}})?.response?.data
    return new Error(
        typeof detail === 'string' && detail.trim() ? detail : fallback,
    )
}

export const register = (email: string, password: string, displayName?: string) =>
    authApi
        .post<SessionUser>('/register', {email, password, displayName})
        .then(r => r.data)
        .catch(e => {
            throw toError(e, 'Could not create your account. Try again.')
        })

export const login = (email: string, password: string) =>
    authApi
        .post<TokenPair>('/login', {email, password})
        .then(r => r.data)
        .catch(e => {
            throw toError(e, 'Could not sign you in.')
        })

export const refresh = (refreshToken: string) =>
    authApi
        .post<TokenPair>('/refresh', {refreshToken})
        .then(r => r.data)
        .catch(e => {
            throw toError(e, 'Session expired. Please sign in again.')
        })

/** Best-effort revocation; a failed logout still clears local state. */
export const logout = (refreshToken: string) =>
    authApi.post('/logout', {refreshToken}).catch(() => undefined)
