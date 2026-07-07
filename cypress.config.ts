import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false, // Desabilita vídeos para economizar espaço
    screenshotOnRunFailure: true,
    // Timeouts aumentados para Next.js com Server Components
    defaultCommandTimeout: 10000, // 10 segundos para comandos
    pageLoadTimeout: 60000, // 60 segundos para carregar página
    requestTimeout: 10000, // 10 segundos para requests
  },
})
