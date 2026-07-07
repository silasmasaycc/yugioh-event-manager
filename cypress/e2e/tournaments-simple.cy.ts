/// <reference types="cypress" />

/**
 * Teste E2E simplificado para a página de Torneios
 */

describe('Tournaments Page - Básico', () => {
  beforeEach(() => {
    cy.visit('/tournaments', { timeout: 60000 })
    cy.get('body', { timeout: 10000 }).should('be.visible')
  })

  it('deve carregar a página corretamente', () => {
    // Verifica título
    cy.contains('Torneios', { timeout: 10000 }).should('be.visible')
    
    // Verifica estatísticas
    cy.contains('Total de Torneios', { timeout: 5000 }).should('be.visible')
    cy.contains('Jogadores Ativos').should('be.visible')
    
    // Verifica filtros
    cy.get('input[placeholder*="Buscar"]', { timeout: 5000 }).should('be.visible')
  })

  it('deve permitir digitar no campo de busca', () => {
    cy.get('input[placeholder*="Buscar"]').type('teste')
    cy.get('input[placeholder*="Buscar"]').should('have.value', 'teste')
  })
})
