import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Search, 
  GitBranch, 
  Clock, 
  Briefcase, 
  Settings,
  Shield
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Incident Explorer', href: '/incidents', icon: Search },
  { name: 'Entity Graph', href: '/entities', icon: GitBranch },
  { name: 'Timeline', href: '/timeline', icon: Clock },
  { name: 'Case Builder', href: '/cases', icon: Briefcase },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export const Sidebar = () => {
  return (
    <div className="bg-gray-900 text-white w-64 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-lg font-semibold">Intel Fusion</h1>
            <p className="text-xs text-gray-400">London Crime Demo</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <p>Version 1.0.0</p>
          <p>Demo Environment</p>
        </div>
      </div>
    </div>
  )
}