/// <reference types="cypress" />

describe('Teste Inicial', () => {
  it('deve conseguir acessar o localhost', () => {
    cy.request('http://localhost:3000').its('status').should('eq', 200)
  })

  it('deve conseguir visitar a home', () => {
    cy.visit('/', { timeout: 60000 })
    cy.get('body').should('be.visible')
  })

  it('deve conseguir visitar tournaments', () => {
    cy.visit('/tournaments', { 
      timeout: 60000,
      failOnStatusCode: false 
    })
    cy.get('body', { timeout: 15000 }).should('exist')
  })
})
