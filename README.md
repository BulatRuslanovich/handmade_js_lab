# Лабораторная работа: Асинхронное программирование в JavaScript

Практическая работа по изучению продвинутых паттернов работы с асинхронностью, промисами и конкурентностью в JavaScript.

## Установка

```bash
npm install
```

## Запуск тестов

```bash
# Запустить все тесты
npm test

# Запустить в режиме watch (автоматический перезапуск)
npm run test:watch

# Запустить с покрытием кода
npm run test:coverage
```

## Структура проекта

- `lab.js` - файл с заданиями (здесь пишете код)
- `lab.test.js` - тесты на Jest

## Задания

### Задание 1: Smart API Fetcher

Реализуйте умную функцию для выполнения API запросов с поддержкой:
- Таймаута (отмена запроса если он длится слишком долго)
- Автоматических повторов при ошибке (retry logic)
- Подсчёта времени выполнения и количества попыток


**Сигнатура:**
```javascript
async function smartFetch(fetchFn, options = {})
// options: { timeout, retries, retryDelay }
// возвращает: { data, duration, attempts }
```

### Задание 2: Параллельная загрузка с лимитом

Выполните массив задач параллельно, но с ограничением на количество одновременных операций.

**Сигнатура:**
```javascript
async function parallelLimit(tasks, limit)
// tasks: массив async функций
// limit: максимум одновременных задач
// возвращает: массив результатов в исходном порядке
```

**Пример использования:**
```javascript
const tasks = [
  async () => fetch('/api/1'),
  async () => fetch('/api/2'),
  async () => fetch('/api/3')
];
// Выполнить максимум 2 параллельно
const results = await parallelLimit(tasks, 2);
```

### Задание 3: Умное кэширование запросов

Создайте обёртку для функций с кэшированием результатов.

**Сигнатура:**
```javascript
function createCachedFunction(fn, ttl)
// fn: функция для кэширования
// ttl: время жизни кэша в миллисекундах
// возвращает: обёрнутую функцию
```

**Пример использования:**
```javascript
const cachedFetch = createCachedFunction(
  async (id) => fetch(`/api/users/${id}`),
  5000 // кэш на 5 секунд
);

await cachedFetch(1); // запрос к API
await cachedFetch(1); // из кэша
await cachedFetch(2); // новый запрос (другой аргумент)
```

### Задание 4: Поиск с debounce

Реализуйте debounced версию поисковой функции для оптимизации запросов.


**Сигнатура:**
```javascript
function createDebouncedSearch(searchFn, delayMs)
// searchFn: функция поиска
// delayMs: задержка в миллисекундах
// возвращает: debounced версию функции
```

**Пример использования:**
```javascript
const search = createDebouncedSearch(
  async (query) => fetch(`/api/search?q=${query}`),
  300
);

// Пользователь быстро вводит текст:
search('a');    // отменится
search('ab');   // отменится
search('abc');  // выполнится через 300ms после последнего ввода
```

### Задание 5: Fastest Response Wins

Запросите данные из нескольких источников параллельно и верните первый успешный результат.

**Сигнатура:**
```javascript
async function fetchFromFastest(fetchFns)
// fetchFns: массив функций получения данных
// возвращает: { data, source: index }
```

**Пример использования:**
```javascript
const result = await fetchFromFastest([
  async () => fetch('https://api1.com/data'),
  async () => fetch('https://api2.com/data'),
  async () => fetch('https://api3.com/data')
]);
// result = { data: {...}, source: 1 } // api2 был самым быстрым
```

## Подсказки

### Promise.race()
Возвращает промис, который завершится как только завершится первый из переданных промисов:
```javascript
const fastest = await Promise.race([promise1, promise2, promise3]);
```

### Promise.allSettled()
Ждёт завершения всех промисов (успех или ошибка):
```javascript
const results = await Promise.allSettled([promise1, promise2]);
// results = [
//   { status: 'fulfilled', value: ... },
//   { status: 'rejected', reason: ... }
// ]
```

### Паттерн Worker Pool
```javascript
let currentIndex = 0;
async function worker() {
  while (currentIndex < tasks.length) {
    const index = currentIndex++;
    results[index] = await tasks[index]();
  }
}
// Запустить N воркеров параллельно
await Promise.all(Array(limit).fill().map(() => worker()));
```

### Кэширование с дедупликацией
```javascript
const cache = new Map();      // готовые результаты
const pending = new Map();    // запросы в процессе

if (cache.has(key)) return cache.get(key);
if (pending.has(key)) return pending.get(key);

const promise = fn(...args);
pending.set(key, promise);
// после выполнения: pending.delete(), cache.set()
```

## Критерии оценки

- Все тесты должны проходить
- Код должен быть читаемым и хорошо структурированным
- Правильная обработка ошибок
- Корректная работа с асинхронностью