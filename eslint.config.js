import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: true,
    vue: true,
  },
  {
    // src/shared is imported by both client and server, so it stays free of Node, DOM and Vue.
    files: ['src/shared/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { regex: '^node:', message: 'src/shared must not import Node built-ins.' },
          { group: ['fs', 'fs/*', 'path', 'os', 'crypto', 'url', 'util', 'stream', 'events', 'buffer', 'child_process', 'http', 'https', 'net', 'process', 'worker_threads'], message: 'src/shared must not import Node built-ins.' },
          { group: ['vue', 'vue-router', 'reka-ui', '@vue/*', '@vueuse/*'], message: 'src/shared must not import Vue or DOM libraries.' },
        ],
      }],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'process'],
    },
  },
)
