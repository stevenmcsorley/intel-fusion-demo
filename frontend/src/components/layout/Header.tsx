import { Bell, User, Search } from 'lucide-react'

export const Header = () => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search incidents, entities, or cases..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* User actions */}
        <div className="flex items-center space-x-4">
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">Analyst Demo</p>
              <p className="text-xs text-slate-400">analyst@demo.com</p>
            </div>
            <button className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
              <User className="h-5 w-5 text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}