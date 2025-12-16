// @shared
import { jsx } from "@app/html-jsx"
import { requireRealUser } from '@app/auth'
import { Money } from "@app/heap"
import { writeWorkspaceEvent } from '@start/sdk'
import ProductsTable from './basic-crud.table'

//API эндпоинты для CRUD операций

//Список продуктов с фильтрацией и пагинацией
// @shared-route
export const apiProductsListRoute = app.get('/list', async (ctx, req) => {
  const { page = 1, limit = 20, search, category, status } = req.query as Record<string, string>
  
  const offset = (parseInt(page) - 1) * parseInt(limit)
  const where: any = {}
  
  if (search) {
    where.$or = [
      { title: { $icontains: search } },
      { description: { $icontains: search } }
    ]
  }
  
  if (category) {
    where.category = category
  }
  
  if (status) {
    where.status = status
  }
  
  const products = await ProductsTable.findAll(ctx, {
    where,
    limit: parseInt(limit),
    offset,
    order: [{ createdAt: 'desc' }]
  })
  
  const count = await ProductsTable.countBy(ctx, where)
  
  return {
    products: products.map(product => ({
      ...product,
      price: product.price?.format(ctx) || '0',
      createdBy: product.createdBy?.id || null
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / parseInt(limit))
    }
  }
})

// Детальная информация о продукте
// @shared-route  
export const apiProductRoute = app.get('/:id', async (ctx, req) => {
  const product = await ProductsTable.findById(ctx, req.params.id)
  
  if (!product) {
    ctx.resp.status(404)
    return { error: 'Product not found' }
  }
  
  return {
    ...product,
    price: product.price?.format(ctx) || '0',
    createdByInfo: product.createdBy ? await product.createdBy.get(ctx) : null
  }
})

// Создание нового продукта
// @shared-route
export const apiProductsCreateRoute = app.post('/create', async (ctx, req) => {
  requireRealUser(ctx)
  
  const { title, description, price, category, tags, status = 'active' } = req.body
  
  if (!title || !price) {
    ctx.resp.status(400)
    return { error: 'Title and price are required' }
  }
  
  const product = await ProductsTable.create(ctx, {
    title,
    description: description || '',
    price: new Money(parseFloat(price), 'RUB'),
    category: category || 'general',
    inStock: true,
    status,
    tags: tags || '',
    createdBy: ctx.user.id
  })
  
  // Записываем событие создания
  await writeWorkspaceEvent(ctx, 'product_created', {
    action_params: {
      productId: product.id,
      title: product.title,
      price: product.price.amount
    },
    user: {
      id: ctx.user.id,
      name: ctx.user.displayName
    }
  })
  
  return {
    ...product,
    price: product.price?.format(ctx) || '0'
  }
})

// Обновление продукта
// @shared-route
export const apiProductsUpdateRoute = app.post('/:id', async (ctx, req) => {
  requireRealUser(ctx)
  
  const { id } = req.params
  const { title, description, price, category, inStock, status, tags } = req.body
  
  const existingProduct = await ProductsTable.findById(ctx, id)
  if (!existingProduct) {
    ctx.resp.status(404)
    return { error: 'Product not found' }
  }
  
  const updateData: any = {}
  
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description  
  if (price !== undefined) updateData.price = new Money(parseFloat(price), 'RUB')
  if (category !== undefined) updateData.category = category
  if (inStock !== undefined) updateData.inStock = inStock
  if (status !== undefined) updateData.status = status
  if (tags !== undefined) updateData.tags = tags
  
  const updatedProduct = await ProductsTable.update(ctx, {
    id,
    ...updateData
  })
  
  return {
    ...updatedProduct,
    price: updatedProduct.price?.format(ctx) || '0'
  }
})

// Удаление продукта
// @shared-route
export const apiProductsDeleteRoute = app.delete('/:id', async (ctx, req) => {
  requireRealUser(ctx)
  
  const product = await ProductsTable.findById(ctx, req.params.id)
  if (!product) {
    ctx.resp.status(404)
    return { error: 'Product not found' }
  }
  
  await ProductsTable.delete(ctx, req.params.id)
  
  return { success: true, deletedProductId: req.params.id }
})

// Массовые операции
// @shared-route
export const apiProductsBulkRoute = app.post('/bulk', async (ctx, req) => {
  requireRealUser(ctx)
  
  const { action, productIds, data } = req.body
  
  if (!action || !productIds || !Array.isArray(productIds)) {
    ctx.resp.status(400)
    return { error: 'Action and productIds array are required' }
  }
  
  const results = []
  
  for (const productId of productIds) {
    try {
      if (action === 'delete') {
        await ProductsTable.delete(ctx, productId)
        results.push({ productId, success: true })
      } else if (action === 'update' && data) {
        await ProductsTable.update(ctx, { id: productId, ...data })
        results.push({ productId, success: true })
      }
    } catch (error) {
      results.push({ productId, success: false, error: error.message })
    }
  }
  
  return { results }
})

// Поиск и фильтрация
// @shared-route
export const apiProductsSearchRoute = app.post('/search', async (ctx, req) => {
  const { query, filters = {}, options = {} } = req.body
  
  const where: any = {}
  
  if (query) {
    where.$or = [
      { title: { $icontains: query } },
      { description: { $icontains: query } },
      { tags: { $icontains: query } }
    ]
  }
  
  if (filters.category) where.category = filters.category
  if (filters.status) where.status = filters.status
  if (filters.inStock !== undefined) where.inStock = filters.inStock
  if (filters.priceMin || filters.priceMax) {
    where.price = {}
    if (filters.priceMin) where.price.$gte = new Money(filters.priceMin, 'RUB')
    if (filters.priceMax) where.price.$lte = new Money(filters.priceMax, 'RUB')
  }
  
  const products = await ProductsTable.findAll(ctx, {
    where,
    limit: options.limit || 50,
    offset: options.offset || 0,
    order: options.order || [{ createdAt: 'desc' }]
  })
  
  return {
    products: products.map(product => ({
      ...product,
      price: product.price?.format(ctx) || '0'
    }))
  }
})

//Аналитика по продуктам
// @shared-route
export const apiProductsAnalyticsRoute = app.get('/analytics', async (ctx, req) => {
  
  // Количество продуктов по категориям
  const productsByCategory = await ProductsTable
    .select({
      category: 'category',
      count: { $count: ['id'] },
      avgPrice: { $avg: ['price'] },
      totalValue: { $sum: ['price'] }
    })
    .group(['category'])
    .run(ctx)
  
  // Количество продуктов по статусам
  const productsByStatus = await ProductsTable
    .select({
      status: 'status',
      count: { $count: ['id'] }
    })
    .group(['status'])
    .run(ctx)
  
  // Общие статистики
  const totalProducts = await ProductsTable.countBy(ctx)
  const activeProducts = await ProductsTable.countBy(ctx, { status: 'active' })
  const inStockProducts = await ProductsTable.countBy(ctx, { inStock: true })
  
  return {
    summary: {
      total: totalProducts,
      active: activeProducts,
      inStock: inStockProducts,
      outOfStock: totalProducts - inStockProducts
    },
    byCategory: productsByCategory,
    byStatus: productsByStatus
  }
})

// Управление интерфейсом для демонстрации CRUD
export const productsDemoRoute = app.html('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>CRUD Demo - Heap Tables</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com/3.4.16"></script>
        <script>{`
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#3b82f6',
                  secondary: '#8b5cf6',
                  success: '#10b981',
                  danger: '#ef4444',
                  warning: '#f59e0b'
                }
              }
            }
          }
        `}</script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" rel="stylesheet" />
      </head>
      <body class="bg-gray-50">
        <div class="min-h-screen">
          {/* Header */}
          <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold text-gray-900">
                  <i class="fas fa-database mr-2 text-primary"></i>
                  CRUD Demo - Heap Tables
                </h1>
                <div class="flex items-center space-x-4">
                  {ctx.user ? (
                    <span class="text-gray-600">
                      <i class="fas fa-user-circle mr-1"></i>
                      {ctx.user.displayName}
                    </span>
                  ) : (
                    <a href="/s/auth/signin?back=/" class="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600">
                      Войти
                    </a>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Sidebar - Analytics */}
              <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow p-6 sticky top-6" id="stats-panel">
                  <h3 class="text-lg font-semibold mb-4">
                    <i class="fas fa-chart-pie mr-2"></i>
                    Аналитика
                  </h3>
                  <div id="stats-content">
                    <div class="text-gray-500">Загрузка статистики...</div>
                  </div>
                </div>
              </div>

              {/* Main Content - Products */}
              <div class="lg:col-span-3">
                {/* Toolbar */}
                <div class="bg-white rounded-lg shadow mb-6 p-6">
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input 
                      type="text" 
                      id="search-input"
                      placeholder="Поиск продуктов..." 
                      class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <select id="category-filter" class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Все категории</option>
                    </select>
                    <select id="status-filter" class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Все статусы</option>
                      <option value="active">Активные</option>
                      <option value="inactive">Неактивные</option>
                    </select>
                    <button id="add-product-btn" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                      <i class="fas fa-plus mr-2"></i>
                      Добавить
                    </button>
                  </div>
                </div>

                {/* Products List */}
                <div class="bg-white rounded-lg shadow">
                  <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                      <h2 class="text-xl font-semibold">Список продуктов</h2>
                      <div class="text-gray-500">
                        <span id="total-count">0</span> продуктов
                      </div>
                    </div>
                    <div id="products-list" class="space-y-4">
                      <div class="text-gray-500 text-center py-8">
                        <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
                        <p>Загрузка продуктов...</p>
                      </div>
                    </div>
                    <div id="pagination" class="mt-6 flex justify-center"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Modal */}
          <div id="product-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 class="text-xl font-bold mb-6">
                <span id="modal-title">Добавление продукта</span>
              </h3>
              <form id="product-form" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                  <input type="text" name="title" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea name="description" rows="3" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Цена (RUB) *</label>
                  <input type="number" name="price" step="0.01" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                  <input type="text" name="category" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select name="status" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="active">Активный</option>
                    <option value="inactive">Неактивный</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Теги</label>
                  <input type="text" name="tags" placeholder="через запятую" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div class="flex justify-end space-x-4 pt-4">
                  <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                    Отмена
                  </button>
                  <button type="submit" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600">
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Notification Component */}
          <div id="notification" class="fixed top-4 right-4 z-50 hidden">
            <div class="bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-md">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <i id="notification-icon" class="text-2xl"></i>
                </div>
                <div class="ml-3 flex-1">
                  <p id="notification-message" class="text-sm font-medium"></p>
                </div>
                <button onclick="hideNotification()" class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <script>{`
          let currentPage = 1;
          let currentProductId = null;
          
          // Система уведомлений
          function showNotification(message, type = 'error') {
            const notification = document.getElementById('notification');
            const icon = document.getElementById('notification-icon');
            const messageEl = document.getElementById('notification-message');
            const container = notification.querySelector('div');
            
            // Настройка стиля в зависимости от типа
            if (type === 'success') {
              container.classList.remove('border-red-500', 'border-yellow-500');
              container.classList.add('border-green-500');
              icon.className = 'fas fa-check-circle text-green-500 text-2xl';
            } else if (type === 'warning') {
              container.classList.remove('border-red-500', 'border-green-500');
              container.classList.add('border-yellow-500');
              icon.className = 'fas fa-exclamation-triangle text-yellow-500 text-2xl';
            } else {
              container.classList.remove('border-green-500', 'border-yellow-500');
              container.classList.add('border-red-500');
              icon.className = 'fas fa-exclamation-circle text-red-500 text-2xl';
            }
            
            messageEl.textContent = message;
            notification.classList.remove('hidden');
            
            // Автоматически скрыть через 5 секунд
            setTimeout(() => hideNotification(), 5000);
          }
          
          function hideNotification() {
            document.getElementById('notification').classList.add('hidden');
          }
          
          // Загрузка статистики
          async function loadStats() {
            try {
              const response = await fetch('~/analytics'.replace('~', './api/products'));
              const stats = await response.json();
              
              document.getElementById('stats-content').innerHTML = \`
                <div class="space-y-4">
                  <div class="bg-blue-50 p-3 rounded">
                    <div class="text-blue-600 text-sm">Всего</div>
                    <div class="text-2xl font-bold text-blue-800">\${stats.summary.total}</div>
                  </div>
                  <div class="bg-green-50 p-3 rounded">
                    <div class="text-green-600 text-sm">Активных</div>
                    <div class="text-2xl font-bold text-green-800">\${stats.summary.active}</div>
                  </div>
                  <div class="bg-yellow-50 p-3 rounded">
                    <div class="text-yellow-600 text-sm">В наличии</div>
                    <div class="text-2xl font-bold text-yellow-800">\${stats.summary.inStock}</div>
                  </div>
                </div>
              \`;
              
              // Обновление фильтров категорий
              const categoryFilter = document.getElementById('category-filter');
              categories = stats.byCategory.map(item => \`<option value="\${item.category}">\${item.category}</option>\`);
              categories.unshift('<option value="">Все категории</option>');
              categoryFilter.innerHTML = categories.join('');
              
            } catch (error) {
              console.error('Error loading stats:', error);
            }
          }
          
          // Загрузка списка продуктов
          async function loadProducts(page = 1) {
            currentPage = page;
            
            const search = document.getElementById('search-input').value;
            const category = document.getElementById('category-filter').value;
            const status = document.getElementById('status-filter').value;
            
            const params = new URLSearchParams({
              page: page.toString(),
              limit: '20'
            });
            
            if (search) params.append('search', search);
            if (category) params.append('category', category);
            if (status) params.append('status', status);
            
            try {
              const response = await fetch(\`~list?\${params}\`.replace('~', './api/products'));
              const data = await response.json();
              
              renderProducts(data.products);
              renderPagination(data.pagination);
              document.getElementById('total-count').textContent = data.pagination.total;
              
            } catch (error) {
              console.error('Error loading products:', error);
              document.getElementById('products-list').innerHTML = \`
                <div class="text-red-500 text-center py-8">
                  <i class="fas fa-exclamation-circle text-3xl mb-4"></i>
                  <p>Ошибка загрузки продуктов</p>
                </div>
              \`;
            }
          }
          
          // Отрисовка списка продуктов
          function renderProducts(products) {
            const container = document.getElementById('products-list');
            
            if (products.length === 0) {
              container.innerHTML = \`
                <div class="text-gray-500 text-center py-8">
                  <i class="fas fa-inbox text-3xl mb-4"></i>
                  <p>Продукты не найдены</p>
                </div>
              \`;
              return;
            }
            
            container.innerHTML = products.map(product => \`
              <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="font-semibold text-lg text-gray-800">\${product.title}</h3>
                    <p class="text-gray-600 mt-1">\${product.description || 'Без описания'}</p>
                    <div class="flex items-center space-x-4 mt-2">
                      <span class="text-2xl font-bold text-green-600">\${product.price} ₽</span>
                      <span class="px-2 py-1 text-xs bg-gray-100 rounded">\${product.category}</span>
                      <span class="px-2 py-1 text-xs \${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded">
                        \${product.status === 'active' ? 'Активный' : 'Неактивный'}
                      </span>
                    </div>
                  </div>
                  <div class="flex space-x-2 ml-4">
                    <button onclick="editProduct('\${product.id}')" class="text-blue-600 hover:text-blue-800 p-2">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct('\${product.id}')" class="text-red-600 hover:text-red-800 p-2">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            \`).join('');
          }
          
          // Отрисовка пагинации
          function renderPagination(pagination) {
            const container = document.getElementById('pagination');
            
            if (pagination.pages <= 1) {
              container.innerHTML = '';
              return;
            }
            
            let html = '<div class="flex space-x-2">';
            
            // Previous button
            if (pagination.page > 1) {
              html += \`<button onclick="loadProducts(\${pagination.page - 1})" class="px-3 py-1 border rounded hover:bg-gray-100">←</button>\`;
            }
            
            // Page numbers
            const startPage = Math.max(1, pagination.page - 2);
            const endPage = Math.min(pagination.pages, pagination.page + 2);
            
            for (let i = startPage; i <= endPage; i++) {
              const isActive = i === pagination.page;
              html += \`
                <button 
                  onclick="loadProducts(\${i})" 
                  class="px-3 py-1 rounded \${isActive ? 'bg-primary text-white' : 'border hover:bg-gray-100'}"
                >
                  \${i}
                </button>
              \`;
            }
            
            // Next button
            if (pagination.page < pagination.pages) {
              html += \`<button onclick="loadProducts(\${pagination.page + 1})" class="px-3 py-1 border rounded hover:bg-gray-100">→</button>\`;
            }
            
            html += '</div>';
            container.innerHTML = html;
          }
          
          // Модальное окно
          function openModal(title = 'Добавление продукта', productId = null) {
            currentProductId = productId;
            document.getElementById('modal-title').textContent = title;
            document.getElementById('product-modal').classList.remove('hidden');
            
            if (productId) {
              // Загрузка данных продукта для редактирования
              fetch(\`~\${productId}\`.replace('~', './api/products'))
                .then(response => response.json())
                .then(product => {
                  document.forms['product-form'].title.value = product.title;
                  document.forms['product-form'].description.value = product.description || '';
                  document.forms['product-form'].price.value = parseFloat(product.price);
                  document.forms['product-form'].category.value = product.category || '';
                  document.forms['product-form'].status.value = product.status || 'active';
                  document.forms['product-form'].tags.value = product.tags || '';
                });
            } else {
              document.forms['product-form'].reset();
            }
          }
          
          function closeModal() {
            document.getElementById('product-modal').classList.add('hidden');
            currentProductId = null;
          }
          
          function editProduct(id) {
            openModal('Редактирование продукта', id);
          }
          
          async function deleteProduct(id) {
            if (!confirm('Вы уверены, что хотите удалить этот продукт?')) return;
            
            try {
              const response = await fetch(\`~\${id}\`.replace('~', './api/products'), {
                method: 'DELETE'
              });
              
              if (response.ok) {
                showNotification('Продукт успешно удален', 'success');
                loadProducts(currentPage);
                loadStats();
              } else {
                showNotification('Ошибка при удалении продукта', 'error');
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              showNotification('Ошибка при удалении продукта', 'error');
            }
          }
          
          // Обработчики событий
          document.getElementById('add-product-btn').addEventListener('click', () => openModal());
          
          document.getElementById('product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
              const url = currentProductId 
                ? \`~\${currentProductId}\`.replace('~', './api/products')
                : '~create'.replace('~', './api/products');
              
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
              });
              
              if (response.ok) {
                showNotification(currentProductId ? 'Продукт успешно обновлен' : 'Продукт успешно создан', 'success');
                closeModal();
                loadProducts(currentPage);
                loadStats();
              } else {
                const error = await response.json();
                showNotification(\`Ошибка: \${error.error}\`, 'error');
              }
            } catch (error) {
              console.error('Error saving product:', error);
              showNotification('Ошибка при сохранении продукта', 'error');
            }
          });
          
          // Поиск и фильтры
          let searchTimeout;
          document.getElementById('search-input').addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadProducts(1), 500);
          });
          
          document.getElementById('category-filter').addEventListener('change', () => loadProducts(1));
          document.getElementById('status-filter').addEventListener('change', () => loadProducts(1));
          
          // Закрытие модального окна по клику вне его
          document.getElementById('product-modal').addEventListener('click', (e) => {
            if (e.target.id === 'product-modal') {
              closeModal();
            }
          });
          
          // Инициализация
          document.addEventListener('DOMContentLoaded', () => {
            loadStats();
            loadProducts();
          });
        `}</script>
      </body>
    </html>
  )
})