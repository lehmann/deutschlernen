import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environmentMatchGlobs: [
      ['tests/unit/**', 'jsdom'],
      ['tests/server/**', 'node'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/store/**', 'src/data/**', 'server/**'],
      exclude: ['server/index.js', 'server/scheduler.js', 'scripts/**'],
    },
  },
})
