// @shared
import { jsx } from "@app/html-jsx"

// Рендерит секцию с примером кода
export function ExampleSection({ title, children, code, path }: {
  title: string
  children: any
  code?: string
  path?: string
}) {
  return (
    <section class="mb-16 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        {children}
        {code && (
          <div class="mt-6 border-t pt-6">
            <h3 class="text-sm font-mono text-gray-600 mb-2">{path || ''}</h3>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  )
}

// Рендерит карточку с примером
export function ExampleCard({ title, description, link, icon }: {
  title: string
  description: string
  link: string
  icon?: string
}) {
  return (
    <div class="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 p-6">
      <div class="flex items-start gap-4">
        {icon && (
          <div class="flex-shrink-0">
            <i class={`${icon} text-3xl text-blue-600`}></i>
          </div>
        )}
        <div class="flex-1">
          <h3 class="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p class="text-gray-600 text-sm leading-relaxed">{description}</p>
          <a href={link} class="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-mono mt-3">
            <span>{link}</span>
            <i class="fas fa-arrow-right ml-1"></i>
          </a>
        </div>
      </div>
    </div>
  )
}

// Рендерит навигацию по примерам
export function ExampleNav({ categories }: {
  categories: Array<{
    name: string
    items: Array<{
      name: string
      path: string
      description?: string
    }>
  }>
}) {
  return (
    <nav class="bg-white border border-gray-300 sticky top-4 rounded-lg shadow-md p-4 mb-8">
      <h3 class="font-bold text-gray-900 mb-3 flex items-center">
        <i class="fas fa-compass mr-2"></i>
        Навигация по примерам
      </h3>
      <div class="space-y-3">
        {categories.map(category => (
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wider">
              {category.name}
            </h4>
            <ul class="space-y-1 ml-2">
              {category.items.map(item => (
                <li>
                  <a href={item.path} class="flex hover:bg-blue-50 rounded transition-colors py-1 px-2 text-sm">
                    <i class="fas fa-chevron-right text-gray-400 mr-2 text-xs mt-1"></i>
                    <span class="text-gray-700 hover:text-blue-600">{item.name}</span>
                  </a>
                  {item.description && (
                    <p class="text-xs text-gray-500 ml-5 mt-1">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}

// Компонент для отображения статуса
export function StatusBadge({ status, children }: {
  status: 'success' | 'warning' | 'error' | 'info'
  children: any
}) {
  const colors = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  }

  return (
    <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}>
      {children}
    </span>
  )
}

// Карточка с результатом API
export function ApiResultCard({ 
  title, 
  method, 
  endpoint, 
  response, 
  error 
}: {
  title: string
  method: string
  endpoint: string
  response?: any
  error?: string
}) {
  return (
    <div class="border border-gray-200 rounded-lg overflow-hidden">
      <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h4 class="font-semibold text-gray-900">{title}</h4>
          <span class={`px-2 py-1 text-xs font-bold uppercase rounded ${
            method === 'GET' ? 'bg-green-100 text-green-800' :
            method === 'POST' ? 'bg-blue-100 text-blue-800' :
            method === 'DELETE' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {method}
          </span>
        </div>
        <code class="text-sm text-gray-600 mt-1">{endpoint}</code>
      </div>
      <div class="p-4">
        {error ? (
          <div class="text-red-600 text-sm">
            <strong>Ошибка:</strong> {error}
          </div>
        ) : response ? (
          <pre class="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        ) : (
          <div class="text-gray-400 text-sm">Нет данных</div>
        )}
      </div>
    </div>
  )
}