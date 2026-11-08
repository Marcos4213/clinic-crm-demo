import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { authRedirectUrl } from '../config'
import { useAuth } from '../state/AuthProvider'

function Shell({ title, children }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-emerald uppercase">Convertize</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-[13px] leading-5 text-muted">O Convertize agenda. A sua equipe fecha.</p>
      <div className="mt-6 rounded-2xl border border-line bg-surface p-4">{children}</div>
    </main>
  )
}

function Feedback({ error, notice }) {
  return (
    <>
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-ink">
          {error}
        </p>
      )}
      {notice && <p className="mt-3 text-[13px] text-muted">{notice}</p>}
    </>
  )
}

export function LoginScreen() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (auth.session) return <Navigate to="/app" replace />

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    if (!auth.configured) {
      setError('A chave publicável do Supabase não está nesta build.')
      return
    }
    setPending(true)
    const { error: signInError } = await auth.signIn(email.trim(), password)
    setPending(false)
    if (signInError) setError(signInError.message || 'Não foi possível entrar.')
  }

  return (
    <Shell title="Entrar">
      {!auth.configured && (
        <p className="mb-3 text-[13px] leading-5 text-muted">
          Esta build não tem a chave publicável. A demonstração local continua disponível e não grava em clínica nenhuma.
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-[12px] font-semibold text-muted" htmlFor="login-email">
          E-mail
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[14px] text-ink"
          />
        </label>
        <label className="block text-[12px] font-semibold text-muted" htmlFor="login-password">
          Senha
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[14px] text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 w-full rounded-lg bg-emerald text-[13px] font-semibold text-[#080F1C] disabled:opacity-60"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <Feedback error={error} />
      <div className="mt-4 flex flex-col gap-2 text-[13px] font-semibold">
        <Link to="/cadastro" className="text-info">
          Criar clínica
        </Link>
        <Link to="/demo" className="text-emerald">
          Abrir demonstração local
        </Link>
      </div>
    </Shell>
  )
}

export function SignupScreen() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  if (auth.session) return <Navigate to="/app" replace />

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!auth.configured || !auth.client) {
      setError('Cadastro real indisponível até a chave publicável estar nesta build.')
      return
    }
    setPending(true)
    const { data, error: signUpError } = await auth.signUp(email.trim(), password, authRedirectUrl())
    setPending(false)
    if (signUpError) {
      setError(signUpError.message || 'Não foi possível criar a conta.')
      return
    }
    if (!data?.session) {
      setNotice('Conta criada. Se a confirmação de e-mail estiver ligada, abra a mensagem enviada para este endereço. Nenhum outro e-mail foi disparado.')
    }
  }

  return (
    <Shell title="Criar clínica">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-[12px] font-semibold text-muted" htmlFor="signup-email">
          E-mail
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[14px] text-ink"
          />
        </label>
        <label className="block text-[12px] font-semibold text-muted" htmlFor="signup-password">
          Senha
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[14px] text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 w-full rounded-lg bg-emerald text-[13px] font-semibold text-[#080F1C] disabled:opacity-60"
        >
          {pending ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
      <Feedback error={error} notice={notice} />
      <Link to="/" className="mt-4 inline-flex text-[13px] font-semibold text-info">
        Já tenho conta
      </Link>
    </Shell>
  )
}
