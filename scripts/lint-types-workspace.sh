#!/usr/bin/env bash
# Прогон tsc --noEmit по всем tsconfig.json в воркспэйсе, не исключённым через .gitignore.
# Источник списка — git ls-files (учитываются tracked + untracked, исключаются игноры).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Ошибка: каталог $ROOT не является git-репозиторием — нечем уважать .gitignore." >&2
  exit 2
fi

TSC=(npx -p typescript@5 --yes tsc --noEmit)

mapfile -t CONFIGS < <(
  git ls-files --cached --others --exclude-standard '*tsconfig.json' \
    | grep -v -E '(^|/)(node_modules|\.typings)(/|$)' \
    | sort -u
)

if [[ ${#CONFIGS[@]} -eq 0 ]]; then
  echo "Не найдено ни одного tsconfig.json для проверки." >&2
  exit 1
fi

echo "К проверке отобрано ${#CONFIGS[@]} конфигов:"
printf '  - %s\n' "${CONFIGS[@]}"

PASSED=()
FAILED=()

for cfg in "${CONFIGS[@]}"; do
  echo ""
  echo "== Typecheck: ${cfg} =="
  if "${TSC[@]}" -p "$cfg"; then
    PASSED+=("$cfg")
  else
    FAILED+=("$cfg")
  fi
done

echo ""
echo "================ ИТОГ ================"
echo "Успешно: ${#PASSED[@]} / ${#CONFIGS[@]}"
for cfg in "${PASSED[@]}"; do
  echo "  ok   $cfg"
done
echo "С ошибками: ${#FAILED[@]} / ${#CONFIGS[@]}"
for cfg in "${FAILED[@]}"; do
  echo "  FAIL $cfg"
done

if [[ ${#FAILED[@]} -gt 0 ]]; then
  exit 1
fi

echo ""
echo "ts-lint: все конфиги завершились успешно."
