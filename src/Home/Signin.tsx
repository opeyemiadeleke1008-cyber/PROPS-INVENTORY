import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { getAdminEmails, seedAdmins } from '../data/adminStore'

type AuthMode = 'signin' | 'signup'

export default function Signin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let unsubscribe: (() => void) | undefined

    const setup = async () => {
      await seedAdmins()
      const emails = await getAdminEmails()
      if (mounted) {
        setAdminEmails(emails)
      }

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user?.email) {
          const normalized = user.email.toLowerCase()
          const currentAllowedEmails = mounted ? emails : await getAdminEmails()

          if (currentAllowedEmails.includes(normalized)) {
            setCurrentAdmin(normalized)
            navigate('/')
            return
          }

          await signOut(auth)
        }

        setCurrentAdmin(null)
      })
    }

    void setup()

    return () => {
      mounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [navigate])

  const handleSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password.trim()) {
      setError('Email and password are required.')
      setMessage('')
      return
    }

    if (!adminEmails.includes(normalizedEmail)) {
      setError('Access denied. This email is not on the admin allowlist.')
      setMessage('')
      return
    }

    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password)
      setError('')
      setMessage('Signed in successfully.')
      setPassword('')
      navigate('/')
    } catch {
      setError('Invalid email or password.')
      setMessage('')
    }
  }

  const handleFirstTimeSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password.trim()) {
      setError('Email and password are required.')
      setMessage('')
      return
    }

    if (!adminEmails.includes(normalizedEmail)) {
      setError('Signup denied. This email is not on the admin allowlist.')
      setMessage('')
      return
    }

    try {
      await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      await signOut(auth)
      setError('')
      setMessage('Signup successful. You can now sign in.')
      setPassword('')
      setMode('signin')
    } catch {
      setError('Signup failed. This admin may already be registered.')
      setMessage('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (mode === 'signup') {
      await handleFirstTimeSignup()
      return
    }

    await handleSignIn()
  }

  const handleSwitchMode = () => {
    setMode((currentMode) => (currentMode === 'signin' ? 'signup' : 'signin'))
    setError('')
    setMessage('')
    setPassword('')
  }

  const handleLogout = async () => {
    await signOut(auth)
    setCurrentAdmin(null)
    setEmail('')
    setPassword('')
    setError('')
    setMessage('You have been signed out.')
  }

  if (currentAdmin) {
    return (
      <div className="min-h-screen bg-stone-100 py-10">
        <div className="mx-auto w-11/12 max-w-xl rounded-xl bg-white p-6 shadow-lg">
          <h1 className="text-center text-3xl font-bold uppercase italic text-green-700">Admin Session Active</h1>
          <p className="mt-3 text-center text-sm font-semibold text-green-700">Logged in as {currentAdmin}</p>
          {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-md bg-green-600 p-2 text-sm font-semibold uppercase tracking-widest text-white transition-colors duration-200 hover:bg-green-700"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100 py-10">
      <h1 className="text-center text-3xl font-bold uppercase italic text-green-700">
        Welcome <span className="text-green-600">Admin</span>
      </h1>
      <p className="text-center font-semibold italic text-green-700">
        {mode === 'signin' ? 'Please sign in to continue' : 'First-time admin signup'}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-10 flex w-11/12 max-w-xl flex-col gap-4 rounded-lg bg-white p-4 shadow-md"
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border-0 border-b border-green-600 p-2 font-semibold text-black outline-none placeholder:font-semibold focus:border-b-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border-0 border-b border-green-600 p-2 font-semibold text-black outline-none placeholder:font-semibold focus:border-b-2"
        />

        {error && <p className="rounded-md bg-red-100 p-2 text-sm font-medium text-red-700">{error}</p>}
        {message && <p className="rounded-md bg-green-100 p-2 text-sm font-medium text-green-700">{message}</p>}

        <button
          type="submit"
          className="mt-3 rounded-md bg-green-600 p-2 text-sm font-semibold uppercase tracking-widest text-white transition-colors duration-200 hover:bg-green-700"
        >
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>

        <button
          type="button"
          onClick={handleSwitchMode}
          className="rounded-md border border-green-600 bg-white p-2 text-sm font-semibold uppercase tracking-widest text-green-700 transition-colors duration-200 hover:bg-green-50"
        >
          {mode === 'signin' ? 'Sign up for the first time' : 'Back to sign in'}
        </button>

        <p className="text-center text-xs font-medium text-green-700">Allowed admins: {adminEmails.join(', ')}</p>
      </form>
    </div>
  )
}
