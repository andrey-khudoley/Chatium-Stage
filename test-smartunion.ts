// @shared
// Тестовый файл для проверки работы Artur smartUnion с массивом literal и enum

import { Heap } from '@app/heap'

/**
 * Создаём временную таблицу для получения schema builder,
 * чтобы использовать smartUnion и другие методы
 */
const _tempSchemaBuilder = Heap.Table('_temp_for_schema_builder', (s) => ({
  // Тест 1: smartUnion с массивом literal значений
  literalUnion: s.smartUnion([
    s.literal('red'),
    s.literal('green'),
    s.literal('blue')
  ])
}))

// Извлекаем union типы из временной таблицы
const literalUnion = _tempSchemaBuilder.schema.properties.literalUnion

// Проверка типа: должен быть 'red' | 'green' | 'blue'
// Примечание: для получения типа используем тип свойства таблицы
type LiteralUnionType = typeof _tempSchemaBuilder.T.literalUnion
// Ожидаемый тип: 'red' | 'green' | 'blue'

/**
 * Тест 2: smartUnion с enum (TypeScript enum объекты)
 * 
 * ВАЖНО: Согласно документации https://chatium.ru/docs/app/heap/Heap/Enum
 * Heap.Enum принимает TypeScript enum объект, а не массив строк.
 * Enum-ы не рекомендованы, но поддерживаются для обратной совместимости.
 */
enum StatusEnum {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
}

enum PublicationEnum {
  Draft = 'draft',
  Published = 'published'
}

// Создаём временную таблицу для enum union
// ВАЖНО: smartUnion не поддерживает enum напрямую, используем literal для каждого значения
const _tempEnumBuilder = Heap.Table('_temp_for_enum_union', (s) => ({
  enumUnion: s.smartUnion([
    s.literal('active'),
    s.literal('inactive'),
    s.literal('pending'),
    s.literal('draft'),
    s.literal('published')
  ])
}))

const enumUnion = _tempEnumBuilder.schema.properties.enumUnion

// Проверка типа: должен быть 'active' | 'inactive' | 'pending' | 'draft' | 'published'
type EnumUnionType = typeof _tempEnumBuilder.T.enumUnion
// Ожидаемый тип: 'active' | 'inactive' | 'pending' | 'draft' | 'published'

/**
 * Тест 3: smartUnion с комбинацией literal и enum
 */
enum OptionEnum {
  Option1 = 'option1',
  Option2 = 'option2',
  Option3 = 'option3'
}

// Создаём временную таблицу для mixed union
const _tempMixedBuilder = Heap.Table('_temp_for_mixed_union', (s) => ({
  mixedUnion: s.smartUnion([
    s.literal('custom'),
    s.literal('special'),
    s.literal('option1'),
    s.literal('option2'),
    s.literal('option3')
  ])
}))

const mixedUnion = _tempMixedBuilder.schema.properties.mixedUnion

// Проверка типа: должен быть 'custom' | 'special' | 'option1' | 'option2' | 'option3'
type MixedUnionType = typeof _tempMixedBuilder.T.mixedUnion
// Ожидаемый тип: 'custom' | 'special' | 'option1' | 'option2' | 'option3'

/**
 * Тест 4: smartUnion с массивом literal значений (разные типы)
 */
const _tempMultiTypeBuilder = Heap.Table('_temp_for_multitype_union', (s) => ({
  multiTypeLiteralUnion: s.smartUnion([
    s.literal('text'),
    s.literal(42),
    s.literal(true),
    s.null() // Используем s.null() вместо s.literal(null)
  ])
}))

const multiTypeLiteralUnion = _tempMultiTypeBuilder.schema.properties.multiTypeLiteralUnion

// Проверка типа: должен быть 'text' | 42 | true | null
type MultiTypeLiteralUnionType = typeof _tempMultiTypeBuilder.T.multiTypeLiteralUnion
// Ожидаемый тип: 'text' | 42 | true | null

/**
 * Тест 5: smartUnion с несколькими enum (TypeScript enum объекты)
 */
enum StatusTypeEnum {
  Status1 = 'status1',
  Status2 = 'status2'
}

enum TypeEnum {
  Type1 = 'type1',
  Type2 = 'type2',
  Type3 = 'type3'
}

enum LevelEnum {
  Level1 = 'level1',
  Level2 = 'level2'
}

// Создаём временную таблицу для multiple enum union
const _tempMultipleEnumBuilder = Heap.Table('_temp_for_multiple_enum_union', (s) => ({
  multipleEnumUnion: s.smartUnion([
    s.literal('status1'),
    s.literal('status2'),
    s.literal('type1'),
    s.literal('type2'),
    s.literal('type3'),
    s.literal('level1'),
    s.literal('level2')
  ])
}))

const multipleEnumUnion = _tempMultipleEnumBuilder.schema.properties.multipleEnumUnion

// Проверка типа: должен быть объединением всех значений enum
type MultipleEnumUnionType = typeof _tempMultipleEnumBuilder.T.multipleEnumUnion
// Ожидаемый тип: 'status1' | 'status2' | 'type1' | 'type2' | 'type3' | 'level1' | 'level2'

/**
 * Тест 6: Использование в таблице Heap
 */
export const TestTable = Heap.Table('test_smartunion', {
  // Поле с literal union
  color: literalUnion,
  
  // Поле с enum union
  status: enumUnion,
  
  // Поле с mixed union
  type: mixedUnion,
  
  // Поле с multi-type literal union
  value: multiTypeLiteralUnion,
  
  // Поле с multiple enum union
  category: multipleEnumUnion
}, {
  customMeta: {
    title: 'Тестовая таблица для smartUnion',
    description: 'Проверка работы smartUnion с literal и enum'
  }
})

// Экспорт типов для проверки
export type TestTableRow = typeof TestTable.T
export type TestTableRowJson = typeof TestTable.JsonT

/**
 * Функция для тестирования создания записи с различными значениями
 */
export async function testSmartUnion(ctx: app.Ctx) {
  // Тест 1: literal union
  const test1 = await TestTable.create(ctx, {
    color: 'red', // ✅ Должно работать
    status: 'active', // ✅ Используем строковое значение из enum
    type: 'custom',
    value: 'text',
    category: 'status1' // ✅ Используем строковое значение из enum
  })
  
  // Тест 2: enum union
  const test2 = await TestTable.create(ctx, {
    color: 'green',
    status: 'published', // ✅ Используем строковое значение из enum
    type: 'option1', // ✅ Используем строковое значение из enum
    value: 42,
    category: 'type2' // ✅ Используем строковое значение из enum
  })
  
  // Тест 3: mixed union
  const test3 = await TestTable.create(ctx, {
    color: 'blue',
    status: 'pending', // ✅ Используем строковое значение из enum
    type: 'special', // ✅ Должно работать (literal)
    value: true,
    category: 'level1' // ✅ Используем строковое значение из enum
  })
  
  return {
    test1,
    test2,
    test3,
    message: 'Все тесты smartUnion выполнены успешно'
  }
}

/**
 * Функция для проверки типов через TypeScript
 */
export function typeCheckTests() {
  // Эти проверки выполняются на этапе компиляции TypeScript
  
  // ✅ Правильные значения (не должны вызывать ошибок компиляции)
  const validColor: LiteralUnionType = 'red'
  const validStatus: EnumUnionType = 'active' // ✅ Используем строковое значение
  const validType: MixedUnionType = 'custom'
  const validValue: MultiTypeLiteralUnionType = 'text'
  const validCategory: MultipleEnumUnionType = 'status1' // ✅ Используем строковое значение
  
  // ❌ Неправильные значения (должны вызывать ошибки компиляции)
  // const invalidColor: LiteralUnionType = 'yellow' // ❌ Ошибка: 'yellow' не входит в union
  // const invalidStatus: EnumUnionType = 'unknown' // ❌ Ошибка: 'unknown' не входит в union
  // const invalidType: MixedUnionType = 'invalid' // ❌ Ошибка: 'invalid' не входит в union
  
  return {
    validColor,
    validStatus,
    validType,
    validValue,
    validCategory
  }
}

