import {
  BarChart3,
  Boxes,
  Home,
  Package2,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingCart,
  Truck,
  ArrowUpDown,
  LogOut,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

type AsideProps = {
  collapsed: boolean
  onToggle: () => void
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, to: '/dashboard' },
  { id: 'products', label: 'Products', icon: Boxes, to: '/products' },
  { id: 'stock-movements', label: 'Stock Movements', icon: ArrowUpDown, to: '/stock-movements' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart, to: '/purchase-orders' },
  { id: 'delivery', label: 'Delivery', icon: Truck, to: '/delivery' },
  { id: 'reports', label: 'Reports', icon: BarChart3, to: '/reports' },
  { id: 'settings', label: 'Settings', icon: Settings, to: '/settings' },
]

export default function Aside({ collapsed, onToggle }: AsideProps) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <aside
      className={`flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="rounded-lg bg-green-50 p-2 text-green-600">
            <Package2 size={20} />
          </div>
          {!collapsed && <p className="text-2xl font-semibold leading-7 text-gray-900">Props Inventory</p>}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <li key={item.id}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon size={17} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-10 flex w-full items-center gap-2 rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={17} />
          {!collapsed && <span className="ml-1">Logout</span>}
        </button>
      </nav>
    </aside>
  )
}
