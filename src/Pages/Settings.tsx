import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import AppShell from '../UI/AppShell'
import { auth } from '../firebase'

export default function Settings() {
  const [adminEmail, setAdminEmail] = useState('Not logged in')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminEmail(user?.email ?? 'Not logged in')
    })

    return () => unsubscribe()
  }, [])

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <header className="mb-5">
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500">Logged in admin: {adminEmail}</p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-2xl font-semibold">Admin Settings</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">Display Name</span>
              <input
                type="text"
                defaultValue="Admin"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">Email</span>
              <input
                type="email"
                value={adminEmail}
                readOnly
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 outline-none"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">Notification Preference</span>
              <select className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600">
                <option>Email Only</option>
                <option>In App Only</option>
                <option>Email and In App</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">Session Timeout (mins)</span>
              <input
                type="number"
                defaultValue={60}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
              />
            </label>
          </div>

          <button
            type="button"
            className="mt-5 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Save Settings
          </button>
        </section>
      </div>
    </AppShell>
  )
}
