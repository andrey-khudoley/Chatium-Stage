// @shared
import { jsx } from "@app/html-jsx"

// Компонент модального окна
export function Modal({ isOpen, onClose, title, children, size = 'medium' }: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: any
  size?: 'small' | 'medium' | 'large'
}) {
  if (!isOpen) return null

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl'
  }

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4 max-h-screen overflow-y-auto`}>
        <div class="flex items-center justify-between p-6 border-b">
          <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div class="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// Компонент вкладок
export function Tabs({ tabs, activeTab, onTabChange }: {
  tabs: Array<{ id: string, label: string, content?: any }>
  activeTab: string
  onTabChange: (tabId: string) => void
}) {
  return (
    <div>
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              class={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div class="mt-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}

// Компонент карточки загрузки
export function LoadingCard({ title, description }: {
  title?: string
  description?: string
}) {
  return (
    <div class="bg-white rounded-lg shadow border p-6">
      <div class="flex flex-col items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        {title && <h3 class="text-lg font-medium text-gray-900 mb-2">{title}</h3>}
        {description && <p class="text-sm text-gray-600 text-center">{description}</p>}
      </div>
    </div>
  )
}

// Компонент пустого состояния
export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction 
}: {
  icon?: string
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}) {
  return (
    <div class="text-center py-12">
      {icon && <i class={`${icon} text-4xl text-gray-400 mb-4`}></i>}
      <h3 class="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && <p class="text-gray-600 mb-4">{description}</p>}
      {actionText && onAction && (
        <button 
          onClick={onAction}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {actionText}
        </button>
      )}
    </div>
  )
}

// Компонент индикатора прогресса
export function ProgressBar({ value, max = 100, color = 'blue', showLabel = true }: {
  value: number
  max?: number
  color?: 'blue' | 'green' | 'yellow' | 'red'
  showLabel?: boolean
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  }

  return (
    <div>
      {showLabel && (
        <div class="flex justify-between mb-1">
          <span class="text-sm font-medium text-gray-700">Прогресс</span>
          <span class="text-sm font-medium text-gray-700">{value}/{max}</span>
        </div>
      )}
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}