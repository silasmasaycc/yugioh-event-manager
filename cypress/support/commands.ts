/// <reference types="cypress" />

// ***********************************************
// Custom commands para facilitar os testes
// ***********************************************

// Tipagem TypeScript dos comandos customizados
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
    }
  }
}

// Comando para fazer login (será útil depois)
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
})

// Make this file a module so `declare global` augmentation is allowed
export {}
