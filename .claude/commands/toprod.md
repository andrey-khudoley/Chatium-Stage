---
description: Копирует ассистента (k/assistant) из dev-workspace s.chtm.khudoley.pro в prod-workspace p.chtm.khudoley.pro.
allowed-tools: Bash(ls:*), Bash(rm:*), Bash(cp:*)
---

# /toprod

Деплой ассистента из dev в prod. Это **исключение** из общего правила «не изменять p.chtm.khudoley.pro» — разрешено только для этой команды.

## Шаги (строго в этом порядке)

### 1. Проверь, что обе папки существуют

```bash
ls -la "/home/aley/.cursor-server/data/User/globalStorage/chatium.chatium-sync/s.chtm.khudoley.pro/k" \
  && ls -la "/home/aley/.cursor-server/data/User/globalStorage/chatium.chatium-sync/p.chtm.khudoley.pro/k"
```

Если хотя бы одна не существует — **остановись** и сообщи пользователю, не пытайся создавать.

### 2. Удали текущий prod-каталог ассистента

```bash
rm -rf "/home/aley/.cursor-server/data/User/globalStorage/chatium.chatium-sync/p.chtm.khudoley.pro/k/assistant"
```

### 3. Скопируй ассистента из dev в prod

```bash
cp -a "/home/aley/.cursor-server/data/User/globalStorage/chatium.chatium-sync/s.chtm.khudoley.pro/k/assistant" \
      "/home/aley/.cursor-server/data/User/globalStorage/chatium.chatium-sync/p.chtm.khudoley.pro/k/assistant"
```

### 4. Проверь результат

```bash
ls -la "/home/aley/.cursor-server/data/User/globalStorage/chatium.chatium-sync/p.chtm.khudoley.pro/k/assistant"
```

## Важно

- Используй **только** Bash и **только** перечисленные команды.
- Не запускай дополнительные исследования папок — это деструктивная операция, действуй точно.
- Если шаг 1 показал несоответствие (одна из папок отсутствует) — не продолжай.
- После шага 4 кратко сообщи пользователю результат: «Ассистент скопирован, файлов в prod: <N>».
