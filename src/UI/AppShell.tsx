import { useState, type ReactNode } from 'react'
import Aside from './Aside'

type AppShellProps = {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [isAsideCollapsed, setIsAsideCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Aside collapsed={isAsideCollapsed} onToggle={() => setIsAsideCollapsed((current) => !current)} />
      <main className="flex-1 overflow-x-auto p-6 md:p-7">{children}</main>
    </div>
  )
}
