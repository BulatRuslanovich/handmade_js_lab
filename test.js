const {
  delay,
  smartFetch,
  parallelLimit,
  createCachedFunction,
  createDebouncedSearch,
  fetchFromFastest
} = require('./lab.js');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.totalPassed = 0;
    this.totalFailed = 0;
  }

  describe(suiteName, fn) {
    this.currentSuite = { name: suiteName, tests: [] };
    this.suites.push(this.currentSuite);
    fn();
    this.currentSuite = null;
  }

  test(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name, fn });
    }
  }

  async run() {
    console.clear();
    
    for (const suite of this.suites) {
      console.log(`\n${colors.bright}${suite.name}${colors.reset}`);
      
      let suitePassed = 0;
      let suiteFailed = 0;
      
      for (const { name, fn } of suite.tests) {
        try {
          await fn();
          suitePassed++;
          this.totalPassed++;
          console.log(`  ${colors.green}✓${colors.reset} ${colors.gray}${name}${colors.reset}`);
        } catch (error) {
          suiteFailed++;
          this.totalFailed++;
          console.log(`  ${colors.red}✗${colors.reset} ${name}`);
          console.log(`    ${colors.red}→ ${error.message}${colors.reset}`);
        }
      }
    }
    
    const total = this.totalPassed + this.totalFailed;
    const successRate = Math.round((this.totalPassed / total) * 100);
    
    console.log('\n' + '─'.repeat(65));
    
    if (this.totalFailed === 0) {
      console.log(`${colors.green}${colors.bright} Все ок ${colors.reset}`);
    } else {
      console.log(`${colors.yellow}  Не все ок ${colors.reset}`);
    }
    
    console.log('─'.repeat(65));
    console.log(`  Пройдено:  ${colors.green}${this.totalPassed}${colors.reset} / ${total}`);
    console.log(`  Процент:   ${successRate >= 80 ? colors.green : colors.yellow}${successRate}%${colors.reset}`);
    console.log('─'.repeat(65) + '\n');
    
    process.exit(this.totalFailed > 0 ? 1 : 0);
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertThrows(fn, errorMessage) {
  return fn().then(
    () => { throw new Error('Expected function to throw'); },
    (error) => {
      if (errorMessage && !error.message.includes(errorMessage)) {
        throw new Error(`Expected error message to contain "${errorMessage}", got "${error.message}"`);
      }
    }
  );
}

const runner = new TestRunner();

runner.describe(' Задание 1: Smart API Fetcher', () => {
  
  runner.test('Выполнение успешного запроса', async () => {
    const fetchFn = async () => ({ message: 'success' });
    const result = await smartFetch(fetchFn);
    
    assertEqual(result.data.message, 'success');
    assert(result.attempts === 1, 'Должна быть 1 попытка');
    assert(result.duration >= 0, 'Должно быть положительное время выполнения');
  });

  runner.test('Повтор запроса при ошибке', async () => {
    let attempts = 0;
    const fetchFn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return { message: 'success after retries' };
    };
    
    const result = await smartFetch(fetchFn);
    assertEqual(result.data.message, 'success after retries');
    assert(result.attempts === 3, 'Должно быть 3 попытки');
  });

  runner.test('Ошибка после исчерпания попыток', async () => {
    const fetchFn = async () => { throw new Error('always fails'); };
    await assertThrows(() => smartFetch(fetchFn, { retries: 2 }), 'always fails');
  });

  runner.test('Применение таймаута', async () => {
    const fetchFn = async () => {
      await delay(200);
      return { message: 'too slow' };
    };
    await assertThrows(() => smartFetch(fetchFn, { timeout: 100, retries: 1 }), 'Timeout');
  });
  
});

runner.describe(' Задание 2: Параллельная загрузка с лимитом', () => {
  
  runner.test('Выполнение всех задач', async () => {
    const tasks = [
      async () => 1,
      async () => 2,
      async () => 3
    ];
    
    const results = await parallelLimit(tasks, 2);
    assertEqual(results, [1, 2, 3]);
  });

  runner.test('Ограничение одновременных задач', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    
    const createTask = (value) => async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await delay(50);
      concurrent--;
      return value;
    };
    
    const tasks = Array(10).fill(0).map((_, i) => createTask(i));
    await parallelLimit(tasks, 3);
    
    assert(maxConcurrent === 3, `Должно быть max 3 одновременных, было ${maxConcurrent}`);
  });

  runner.test('Сохранение порядка результатов', async () => {
    const tasks = [
      async () => { await delay(100); return 'first'; },
      async () => { await delay(10); return 'second'; },
      async () => { await delay(50); return 'third'; }
    ];
    
    const results = await parallelLimit(tasks, 3);
    assertEqual(results, ['first', 'second', 'third']);
  });
  
});

runner.describe(' Задание 3: Умное кэширование запросов', () => {
  
  runner.test('Кэширование результатов', async () => {
    let callCount = 0;
    const fn = async (x) => {
      callCount++;
      await delay(10);
      return x * 2;
    };
    
    const cached = createCachedFunction(fn, 1000);
    
    const result1 = await cached(5);
    const result2 = await cached(5);
    
    assert(result1 === 10 && result2 === 10);
    assert(callCount === 1, `Функция должна вызваться 1 раз, вызвана ${callCount}`);
  });

  runner.test('Различие разных аргументов', async () => {
    let callCount = 0;
    const fn = async (x) => {
      callCount++;
      return x * 2;
    };
    
    const cached = createCachedFunction(fn, 1000);
    await cached(5);
    await cached(10);
    
    assert(callCount === 2, 'Должно быть 2 вызова для разных аргументов');
  });

  runner.test('Очистка кэша после TTL', async () => {
    let callCount = 0;
    const fn = async (x) => {
      callCount++;
      return x * 2;
    };
    
    const cached = createCachedFunction(fn, 100);
    await cached(5);
    await delay(150);
    await cached(5);
    
    assert(callCount === 2, 'Кэш должен истечь через TTL');
  });

  runner.test('Дедупликация одновременных запросов', async () => {
    let callCount = 0;
    const fn = async (x) => {
      callCount++;
      await delay(50);
      return x * 2;
    };
    
    const cached = createCachedFunction(fn, 1000);
    const [r1, r2, r3] = await Promise.all([cached(5), cached(5), cached(5)]);
    
    assert(r1 === 10 && r2 === 10 && r3 === 10);
    assert(callCount === 1, 'Одновременные запросы должны дедуплицироваться');
  });
  
});


runner.describe(' Задание 4: Поиск с debounce', () => {
  
  runner.test('Выполнение поиска только один раз', async () => {
    let callCount = 0;
    const searchFn = async (query) => {
      callCount++;
      return `results for ${query}`;
    };
    
    const debouncedSearch = createDebouncedSearch(searchFn, 100);
    
    debouncedSearch('a');
    debouncedSearch('ab');
    const promise = debouncedSearch('abc');
    
    const result = await promise;
    
    assert(callCount === 1, 'Должен быть только 1 вызов');
    assert(result === 'results for abc', 'Должен использовать последний аргумент');
  });

  runner.test('Повторный вызов после паузы', async () => {
    let callCount = 0;
    const searchFn = async (query) => {
      callCount++;
      return `results for ${query}`;
    };
    
    const debouncedSearch = createDebouncedSearch(searchFn, 100);
    
    await debouncedSearch('first');
    await delay(150);
    await debouncedSearch('second');
    
    assert(callCount === 2, 'Должно быть 2 вызова после паузы');
  });
  
});


runner.describe(' Задание 5: Fastest Response Wins', () => {
  
  runner.test('Возврат самого быстрого результата', async () => {
    const fetchFns = [
      async () => { await delay(100); return 'slow'; },
      async () => { await delay(10); return 'fast'; },
      async () => { await delay(200); return 'slowest'; }
    ];
    
    const result = await fetchFromFastest(fetchFns);
    assert(result.data === 'fast', 'Должен вернуть самый быстрый');
    assert(result.source === 1, 'Должен вернуть индекс источника');
  });

  runner.test('Пропуск неудачных запросов', async () => {
    const fetchFns = [
      async () => { await delay(50); throw new Error('fail1'); },
      async () => { await delay(100); return 'success'; },
      async () => { await delay(10); throw new Error('fail2'); }
    ];
    
    const result = await fetchFromFastest(fetchFns);
    assert(result.data === 'success');
  });

  runner.test('Ошибка если все упали', async () => {
    const fetchFns = [
      async () => { throw new Error('error1'); },
      async () => { throw new Error('error2'); }
    ];
    
    await assertThrows(() => fetchFromFastest(fetchFns), 'All sources failed');
  });
  
});


runner.run();

