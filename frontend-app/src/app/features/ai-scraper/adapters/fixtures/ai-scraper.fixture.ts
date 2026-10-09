/**
 * Fixtures versionados del backend `ai_scraper_executor` (`R-C-8`). Reproducen
 * respuestas reales de `/api/v1` para probar el adapter sin backend en vivo.
 */

export const BACKEND_JOB_CAMEL = {
  id: 'job-1',
  url: 'https://tienda.example/',
  instruction: 'Obtén los productos',
  status: 'COMPLETED',
  aiProvider: 'openrouter',
  aiModel: 'openrouter/free',
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:02:00.000Z',
  limits: { maxPages: 5, maxDepth: 2, maxItems: 50 },
};

export const BACKEND_JOB_SNAKE = {
  id: 'job-2',
  url: 'https://tienda.example/',
  instruction: 'Extrae precios',
  status: 'QUEUED',
  ai_provider: 'custom',
  ai_model: 'llama3.1:8b',
  created_at: '2026-10-09T09:00:00.000Z',
  updated_at: '2026-10-09T09:00:01.000Z',
  limits: { max_pages: '10', max_runtime_sec: '300' },
};

export const BACKEND_JOB_LIST = {
  items: [BACKEND_JOB_CAMEL, BACKEND_JOB_SNAKE],
  nextCursor: 'job-2',
};

export const BACKEND_JOB_RESULTS = {
  jobId: 'job-1',
  status: 'COMPLETED',
  count: 2,
  items: [
    {
      name: 'Laptop Pro',
      price: '1299.99',
      _source: {
        url: 'https://tienda.example/laptop',
        selector: '.product-card h2',
        scrapedAt: '2026-10-09T10:01:00.000Z',
        confidence: 0.92,
      },
    },
    { name: 'Mouse', price: 25 },
  ],
};

export const BACKEND_JOB_EXECUTION = {
  jobId: 'job-1',
  status: 'COMPLETED',
  commands: [
    { id: 'cmd-1', type: 'EXTRACT_LIST', status: 'DONE', createdAt: '2026-10-09T10:00:10.000Z' },
  ],
  pages: [{ id: 'page-1', url: 'https://tienda.example/', title: 'Home', depth: 0 }],
  errors: [],
};

export const BACKEND_INTERACTIONS = {
  jobId: 'job-1',
  provider: 'openrouter',
  model: 'openrouter/free',
  count: 1,
  calls: [
    {
      id: 'ai-1',
      provider: 'openrouter',
      model: 'openrouter/free',
      kind: 'plan',
      tokens: 1234,
      latencyMs: 850,
      createdAt: '2026-10-09T10:00:05.000Z',
    },
  ],
};

export const BACKEND_SESSION = {
  id: 'sess-1',
  url: 'https://tienda.example/',
  domain: 'tienda.example',
  status: 'RADIOGRAPHY',
  error: null,
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z',
};

export const BACKEND_SESSION_LIST = [
  BACKEND_SESSION,
  { id: 'sess-2', url: 'https://otra.example/', domain: 'otra.example', status: 'READY' },
];

export const BACKEND_SESSION_DETAIL = {
  ...BACKEND_SESSION,
  status: 'READY',
  messages: [
    { id: 'm-1', role: 'user', content: 'Obtén los productos' },
    {
      id: 'm-2',
      role: 'assistant',
      content: 'Analizando la página…',
      jobId: 'job-1',
      jobStatus: 'COMPLETED',
      results: [{ name: 'Laptop Pro', price: '1299.99' }],
    },
  ],
  profile: {
    domain: 'tienda.example',
    isJavaScriptHeavy: true,
    selectors: { list: '.product-card' },
    stats: { totalJobs: 3, successfulJobs: 2 },
  },
};

export const BACKEND_SESSION_STATUS = { id: 'sess-1', status: 'READY', error: null };

export const BACKEND_SEND_MESSAGE = {
  message: { id: 'm-3', role: 'assistant', content: 'Analizando la página…', jobId: 'job-3' },
  jobId: 'job-3',
  jobStatus: 'QUEUED',
};

export const BACKEND_RADIOGRAPHY = {
  domain: 'tienda.example',
  profileId: 'prof-1',
  discovered: 12,
  radiography: { pages: 12, jsHeavy: true },
};

export const BACKEND_LEARNED_PROFILE = {
  shouldUseBrowser: true,
  recommendedSelectors: { list: '.product-card' },
  profile: { domain: 'tienda.example' },
};

export const BACKEND_METRICS = {
  instance: 'api-1',
  uptimeSec: 3600,
  store: 'prisma',
  queue: 'bullmq',
  pendingJobs: 2,
  stats: {
    jobsTotal: 10,
    jobsByStatus: { COMPLETED: 7, FAILED: 1, QUEUED: 2 },
    resultsTotal: 120,
    pagesTotal: 40,
    commandsTotal: 90,
    commandsRecovered: 9,
    aiCallsTotal: 30,
    aiTokensTotal: 45000,
  },
  aiRecoveryRate: 0.1,
  process: {},
  distributed: { jobs_created_total: 10 },
};

export const BACKEND_HEALTH = {
  status: 'ok',
  service: 'api',
  time: '2026-10-09T10:00:00.000Z',
  checks: { store: 'prisma', queue: 'bullmq' },
};
