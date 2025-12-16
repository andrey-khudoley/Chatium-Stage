import { Heap } from '@app/heap'

export const ChatMessagesTable = Heap.Table('chat_messages', {
  userId: Heap.String({
    customMeta: { title: 'ID пользователя' }
  }),
  chainKey: Heap.String({
    customMeta: { title: 'Ключ цепочки диалога' }
  }),
  agentId: Heap.String({
    customMeta: { title: 'ID агента' }
  }),
  agentKey: Heap.String({
    customMeta: { title: 'Ключ агента' }
  }),
  role: Heap.String({
    customMeta: { title: 'Роль (user/assistant/system)' }
  }),
  content: Heap.String({
    customMeta: { title: 'Содержимое сообщения' }
  }),
  isVisible: Heap.Boolean({
    customMeta: { title: 'Видимо в чате' },
    defaultValue: true
  }),
  isContextReset: Heap.Boolean({
    customMeta: { title: 'Маркер сброса контекста' },
    defaultValue: false
  }),
  isAgentChange: Heap.Boolean({
    customMeta: { title: 'Маркер смены агента' },
    defaultValue: false
  })
})

export default ChatMessagesTable

