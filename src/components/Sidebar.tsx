import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Wheat, 
  Calendar, 
  Pill, 
  Stethoscope,
  Sprout,
  User
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Crop Diagnosis', href: '/crop-diagnosis', icon: Stethoscope },
  { name: 'My Crops', href: '/crops', icon: Wheat },
  { name: 'Schedules', href: '/schedules', icon: Calendar },
  { name: 'Pesticides', href: '/pesticides', icon: Pill },
  { name: 'Profile', href: '/profile', icon: User },
]

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex w-16 hover:w-64 flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out group">
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                FarmCare
              </span>
            </div>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors relative ${
                    isActive
                      ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 h-5 w-5 ${
                      isActive
                        ? 'text-green-500 dark:text-green-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`}
                  />
                  <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item.name}
                  </span>
                  {/* Tooltip for when sidebar is collapsed */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}