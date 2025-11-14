/**
 * ============================================================================
 *                     ЛАБОРАТОРНАЯ РАБОТА ПО JAVASCRIPT
 *              АСИНХРОННОЕ ПРОГРАММИРОВАНИЕ И РАБОТА С PROMISES
 * ============================================================================
 * 
 * Цель: Изучение продвинутых паттернов работы с асинхронностью в JavaScript
 * 
 * Задачи:
 *    1. Smart API Fetcher - умный запрос с retry и timeout
 *    2. Параллельная загрузка с лимитом конкурентности
 *    3. Кэширование с TTL и дедупликацией запросов
 *    4. Debounce для поисковых запросов
 *    5. Race condition - выбор самого быстрого источника
 * 
 * Подсказка: Все функции должны быть async или возвращать Promise
 */

// ============================================================================
//                        ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Вспомогательная функция для задержки выполнения
 * @param {number} ms - миллисекунды задержки
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
//                     ЗАДАНИЕ 1: SMART API FETCHER
// ============================================================================
/**
 * Цель: Создать умную функцию для выполнения API запросов с:
 *    - Таймаутом (если запрос длится слишком долго)
 *    - Автоматическими повторами при ошибке (retry)
 *    - Подсчётом времени и попыток
 * 
 * Требования:
 *    - Использовать Promise.race для таймаута
 *    - Повторять запрос при ошибке (с задержкой retryDelay)
 *    - Вернуть объект: { data, duration, attempts }
 *    - Бросить ошибку после исчерпания попыток
 * 
 * Подсказка: 
 *    Promise.race([fetchFn(), timeoutPromise]) - кто быстрее завершится
 *    При ошибке используйте цикл for и await delay() перед повтором
 * 
 * @param {Function} fetchFn - асинхронная функция для выполнения запроса
 * @param {Object} options - настройки
 * @param {number} options.timeout - максимальное время ожидания (мс)
 * @param {number} options.retries - количество попыток
 * @param {number} options.retryDelay - задержка между попытками (мс)
 * @returns {Promise<{data: any, duration: number, attempts: number}>}
 * 
 * Пример использования:
 * const result = await smartFetch(
 *   async () => fetch('/api/data'),
 *   { timeout: 5000, retries: 3, retryDelay: 100 }
 * );
 * // result = { data: {...}, duration: 1234, attempts: 1 }
 */
async function smartFetch(fetchFn, options = {}) {
  // TODO: Реализуйте функцию
  // 1. Деструктурируйте options с значениями по умолчанию
  // 2. Сохраните startTime = Date.now()
  // 3. В цикле for (let attempt = 1; attempt <= retries; attempt++)
  // 4. Создайте Promise.race между fetchFn() и timeoutPromise
  // 5. При успехе верните { data, duration, attempts }
  // 6. При ошибке: если не последняя попытка - await delay(retryDelay)
  // 7. После цикла бросьте ошибку
  
  throw new Error('Not implemented');
}

// ============================================================================
//                ЗАДАНИЕ 2: ПАРАЛЛЕЛЬНАЯ ЗАГРУЗКА С ЛИМИТОМ
// ============================================================================
/**
 * Цель: Выполнить массив задач параллельно, но не более N одновременно
 * 
 * Требования:
 *    - Выполнять максимум limit задач одновременно
 *    - Сохранить порядок результатов (как в исходном массиве)
 *    - Использовать паттерн "воркеры" (workers)
 * 
 * Подсказка:
 *    - Создайте массив results с нужной длиной
 *    - Используйте общий счётчик currentIndex
 *    - Каждый воркер берёт следующую задачу через currentIndex++
 *    - Запустите limit воркеров через Promise.all()
 * 
 * @param {Array<Function>} tasks - массив async функций
 * @param {number} limit - максимальное количество одновременных задач
 * @returns {Promise<Array>} результаты в исходном порядке
 * 
 * Пример использования:
 * const tasks = [
 *   async () => await fetch('/api/1'),
 *   async () => await fetch('/api/2'),
 *   async () => await fetch('/api/3')
 * ];
 * const results = await parallelLimit(tasks, 2); // max 2 параллельно
 */
async function parallelLimit(tasks, limit) {
  // TODO: Реализуйте функцию
  // 1. Создайте results = new Array(tasks.length)
  // 2. Создайте currentIndex = 0
  // 3. Создайте async функцию executeTask(), которая:
  //    - В цикле while (currentIndex < tasks.length)
  //    - Берёт index = currentIndex++
  //    - Выполняет results[index] = await tasks[index]()
  // 4. Создайте массив воркеров: Array(Math.min(limit, tasks.length)).fill().map(() => executeTask())
  // 5. await Promise.all(workers)
  // 6. Верните results
  
  throw new Error('Not implemented');
}

// ============================================================================
//                ЗАДАНИЕ 3: УМНОЕ КЭШИРОВАНИЕ ЗАПРОСОВ
// ============================================================================
/**
 * Цель: Обернуть функцию кэшированием с:
 *    - TTL (Time To Live) - время жизни кэша
 *    - Дедупликацией - если несколько одинаковых запросов идут одновременно
 * 
 * Требования:
 *    - Кэшировать результаты по сериализованным аргументам
 *    - Автоматически удалять из кэша через ttl миллисекунд
 *    - Если запрос уже в процессе - вернуть тот же Promise (дедупликация)
 *    - При ошибке НЕ кэшировать результат
 * 
 * Подсказка:
 *    - Используйте две Map: cache (готовые) и pending (в процессе)
 *    - Ключ: JSON.stringify(args)
 *    - После выполнения: cache.set + setTimeout для удаления
 *    - Не забудьте pending.delete() в then/catch
 * 
 * @param {Function} fn - функция для кэширования
 * @param {number} ttl - время жизни кэша в миллисекундах
 * @returns {Function} обёрнутая функция с кэшированием
 * 
 * Пример использования:
 * const cachedFetch = createCachedFunction(
 *   async (id) => fetch(`/api/users/${id}`),
 *   5000 // кэш на 5 секунд
 * );
 * await cachedFetch(1); // запрос к API
 * await cachedFetch(1); // из кэша
 */
function createCachedFunction(fn, ttl) {
  // TODO: Реализуйте функцию
  // 1. Создайте const cache = new Map() и const pending = new Map()
  // 2. Верните async function(...args)
  // 3. Создайте key = JSON.stringify(args)
  // 4. Проверьте cache.has(key) - если есть, верните cache.get(key)
  // 5. Проверьте pending.has(key) - если есть, верните pending.get(key)
  // 6. Создайте promise = fn(...args).then(...).catch(...)
  // 7. В then: cache.set, pending.delete, setTimeout для удаления из cache
  // 8. В catch: pending.delete, throw error
  // 9. pending.set(key, promise)
  // 10. Верните promise
  
  throw new Error('Not implemented');
}

// ============================================================================
//                    ЗАДАНИЕ 4: ПОИСК С DEBOUNCE
// ============================================================================
/**
 * Цель: Создать debounced версию поисковой функции
 *    - Пользователь вводит текст быстро
 *    - Запрос отправляется только после паузы в delayMs
 * 
 * Требования:
 *    - Отменять предыдущий таймаут при новом вызове
 *    - Выполнять запрос только после паузы
 *    - Каждый вызов должен вернуть новый Promise
 * 
 * Подсказка:
 *    - Храните timeoutId в замыкании
 *    - clearTimeout(timeoutId) при новом вызове
 *    - Верните new Promise((resolve, reject) => ...)
 *    - В setTimeout выполните searchFn и resolve/reject результат
 * 
 * @param {Function} searchFn - функция поиска
 * @param {number} delayMs - задержка в миллисекундах
 * @returns {Function} debounced версия функции
 * 
 * Пример использования:
 * const search = createDebouncedSearch(
 *   async (query) => fetch(`/api/search?q=${query}`),
 *   300 // 300ms задержка
 * );
 * search('a');    // отменится
 * search('ab');   // отменится
 * search('abc');  // выполнится через 300ms
 */
function createDebouncedSearch(searchFn, delayMs) {
  // TODO: Реализуйте функцию
  // 1. Создайте let timeoutId в замыкании
  // 2. Верните function(...args)
  // 3. Если timeoutId существует - clearTimeout(timeoutId)
  // 4. Верните new Promise((resolve, reject) => ...)
  // 5. timeoutId = setTimeout(async () => { ... }, delayMs)
  // 6. В setTimeout: try/catch с await searchFn(...args)
  // 7. resolve(result) при успехе, reject(error) при ошибке
  
  throw new Error('Not implemented');
}

// ============================================================================
//                  ЗАДАНИЕ 5: FASTEST RESPONSE WINS
// ============================================================================
/**
 * Цель: Запросить данные из нескольких источников и вернуть первый успешный
 * 
 * Требования:
 *    - Запустить все запросы параллельно
 *    - Вернуть первый успешный с индексом источника
 *    - Если все упали - бросить ошибку с массивом всех ошибок
 *    - Формат ответа: { data, source: index }
 * 
 * Подсказка:
 *    - Оберните каждую функцию: fn().then(data => ({ data, source: index }))
 *    - Используйте Promise.race() для первого результата
 *    - Если race выбросил ошибку, используйте Promise.allSettled()
 *    - Найдите первый fulfilled результат в allSettled
 * 
 * @param {Array<Function>} fetchFns - массив функций получения данных
 * @returns {Promise<{data: any, source: number}>}
 * 
 * Пример использования:
 * const result = await fetchFromFastest([
 *   async () => fetch('https://api1.com/data'),
 *   async () => fetch('https://api2.com/data'),
 *   async () => fetch('https://api3.com/data')
 * ]);
 * // result = { data: {...}, source: 1 } // api2 был самым быстрым
 */
async function fetchFromFastest(fetchFns) {
  // TODO: Реализуйте функцию
  // 1. Оберните каждую функцию: promises = fetchFns.map((fn, index) => fn().then(data => ({ data, source: index })))
  // 2. В try/catch: попробуйте Promise.race(promises)
  // 3. В catch: используйте Promise.allSettled(promises)
  // 4. Найдите первый fulfilled: results.find(r => r.status === 'fulfilled')
  // 5. Если нашли - верните successful.value
  // 6. Иначе соберите все ошибки и бросьте Error с полем errors
  
  throw new Error('Not implemented');
}

// ============================================================================
//                                ЭКСПОРТ
// ============================================================================

export {
  delay,
  smartFetch,
  parallelLimit,
  createCachedFunction,
  createDebouncedSearch,
  fetchFromFastest
};
