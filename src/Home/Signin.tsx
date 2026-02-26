import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase'
import {
  DEFAULT_ADMINS,
  getAdminEmails,
  registerAdminAccount,
  seedAdmins,
  touchAdminSignin,
} from '../data/adminStore'

type AuthMode = 'signin' | 'signup'

export default function Signin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let unsubscribe: (() => void) | undefined

    const setup = async () => {
      try {
        await seedAdmins()
        const emails = await getAdminEmails()
        if (mounted) {
          setAdminEmails(emails)
        }
      } catch {
        if (mounted) {
          setError('Unable to load admin allowlist from Firebase. Check Firestore rules/connection.')
        }
      } finally {
        if (mounted) {
          setIsLoadingAdmins(false)
        }
      }

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user?.email) {
          const normalized = user.email.toLowerCase()
          const allowed = DEFAULT_ADMINS.includes(normalized)

          if (allowed) {
            try {
              await touchAdminSignin(normalized, user.uid)
            } catch {
              // Allow session to continue even if audit metadata write fails.
            }
            setCurrentAdmin(normalized)
            navigate('/dashboard')
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

    if (!DEFAULT_ADMINS.includes(normalizedEmail)) {
      setError('Access denied. This email is not on the admin allowlist.')
      setMessage('')
      return
    }

    try {
      setIsAuthenticating(true)
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
      try {
        await touchAdminSignin(normalizedEmail, credential.user.uid)
      } catch {
        // Don't block login if Firestore metadata write fails.
      }
      setError('')
      setMessage('Signed in successfully.')
      setPassword('')
      navigate('/dashboard')
    } catch (signinError: unknown) {
      if (signinError instanceof FirebaseError) {
        if (
          signinError.code === 'auth/user-not-found' ||
          signinError.code === 'auth/wrong-password' ||
          signinError.code === 'auth/invalid-credential' ||
          signinError.code === 'auth/invalid-login-credentials'
        ) {
          setError('Invalid email or password.')
          setMessage('')
          return
        }

        if (signinError.code === 'auth/too-many-requests') {
          setError('Too many attempts. Try again later.')
          setMessage('')
          return
        }

        setError(`Sign in failed (${signinError.code}).`)
        setMessage('')
        return
      }

      setError('Sign in failed. Please try again.')
      setMessage('')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleFirstTimeSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password.trim()) {
      setError('Email and password are required.')
      setMessage('')
      return
    }

    if (!DEFAULT_ADMINS.includes(normalizedEmail)) {
      setError('Signup denied. This email is not on the admin allowlist.')
      setMessage('')
      return
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      await registerAdminAccount(normalizedEmail, credential.user.uid)
      setError('')
      setMessage('Signup successful. Redirecting to dashboard...')
      setPassword('')
      navigate('/dashboard')
    } catch (signupError: unknown) {
      const isEmailInUse = signupError instanceof FirebaseError && signupError.code === 'auth/email-already-in-use'

      if (isEmailInUse) {
        setError('This admin is already registered. Please sign in.')
        setMessage('')
        setMode('signin')
        return
      }

      if (signupError instanceof FirebaseError && signupError.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.')
        setMessage('')
        return
      }

      setError('Signup failed. Please try again.')
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
          disabled={isLoadingAdmins || isAuthenticating}
          className="mt-3 rounded-md bg-green-600 p-2 text-sm font-semibold uppercase tracking-widest text-white transition-colors duration-200 hover:bg-green-700"
        >
          {isLoadingAdmins ? 'Loading Admins...' : isAuthenticating && mode === 'signin' ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
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
