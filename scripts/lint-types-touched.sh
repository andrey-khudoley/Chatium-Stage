#!/usr/bin/env bash
# Прогон tsc --noEmit только для tsconfig.json, соответствующих переданным путям.
# Для каждого пути ищется ближайший tsconfig.json при обходе каталогов вверх до корня репозитория.
#
# Использование (из корня workspace):
#   bash scripts/lint-types-touched.sh p/some/app/lib/foo.ts inner/bar.ts
#   npm run ts-lint:touched -- p/some/app/lib/foo.ts
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ $# -lt 1 ]]; then
  echo "Укажите хотя бы один путь к файлу или каталогу внутри репозитория." >&2
  echo "Пример: bash scripts/lint-types-touched.sh p/my-app/index.tsx" >&2
  exit 2
fi

TSC=(npx -p typescript@5 --yes tsc --noEmit)

resolve_nearest_tsconfig() {
  local target="$1"
  if [[ ! -e "$target" ]]; then
    echo "lint-types-touched: путь не существует, пропуск: $target" >&2
    return 1
  fi
  local d
  if [[ -f "$target" ]]; then
    d="$(cd "$(dirname "$target")" && pwd)"
  else
    d="$(cd "$target" && pwd)"
  fi
  case "$d" in
    "$ROOT"|"$ROOT"/*) ;;
    *)
      echo "lint-types-touched: путь вне репозитория, пропуск: $target" >&2
      return 1
      ;;
  esac
  while true; do
    if [[ -f "$d/tsconfig.json" ]]; then
      echo "$d/tsconfig.json"
      return 0
    fi
    if [[ "$d" == "$ROOT" ]]; then
      return 1
    fi
    local parent
    parent="$(dirname "$d")"
    if [[ "$parent" == "$d" ]]; then
      return 1
    fi
    d="$parent"
  done
}

TMP_LIST=""
for raw in "$@"; do
  if [[ "$raw" != /* ]]; then
    raw="$ROOT/${raw#./}"
  fi
  cfg="$(resolve_nearest_tsconfig "$raw" || true)"
  [[ -z "$cfg" ]] && continue
  TMP_LIST+="$cfg"$'\n'
done

mapfile -t UNIQUE < <(printf '%s' "$TMP_LIST" | sed '/^$/d' | sort -u)

if [[ ${#UNIQUE[@]} -eq 0 ]]; then
  echo "lint-types-touched: не удалось сопоставить ни одного tsconfig.json с переданными путями." >&2
  echo "Запустите полную проверку: npm run ts-lint" >&2
  exit 1
fi

echo "К проверке отобрано ${#UNIQUE[@]} конфиг(ов) по затронутым путям:"
printf '  - %s\n' "${UNIQUE[@]}"

PASSED=()
FAILED=()

for cfg in "${UNIQUE[@]}"; do
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
echo "Успешно: ${#PASSED[@]} / ${#UNIQUE[@]}"
for cfg in "${PASSED[@]}"; do
  echo "  ok   $cfg"
done
echo "С ошибками: ${#FAILED[@]} / ${#UNIQUE[@]}"
for cfg in "${FAILED[@]}"; do
  echo "  FAIL $cfg"
done

if [[ ${#FAILED[@]} -gt 0 ]]; then
  exit 1
fi

echo ""
echo "lint-types-touched: все выбранные конфиги завершились успешно."
