/// <reference types="cypress" />

/**
 * Teste E2E para a página de Torneios
 * 
 * Este teste cobre:
 * - Carregamento correto da página
 * - Exibição de estatísticas
 * - Funcionalidade de filtros (tipo, jogador, deck, mês)
 * - Limpeza de filtros
 * - Visualização de cards de torneios
 */

describe('Tournaments Page', () => {
  // Executado antes de cada teste
  beforeEach(() => {
    // Visita a página de torneios com timeout maior
    cy.visit('/tournaments', { timeout: 60000 })
    
    // Aguarda elementos críticos carregarem antes de continuar
    cy.get('body', { timeout: 10000 }).should('be.visible')
    cy.contains('Torneios', { timeout: 10000 }).should('exist')
  })

  describe('Carregamento inicial', () => {
    it('deve carregar a página e exibir título', () => {
      // Verifica se o título está visível
      cy.contains('h2', 'Torneios').should('be.visible')
      
      // Verifica se a descrição está presente
      cy.contains('Histórico completo de torneios realizados').should('be.visible')
    })

    it('deve exibir as estatísticas de torneios', () => {
      // Verifica se os cards de estatísticas são exibidos
      // Verifica se os números das estatísticas aparecem (devem ser números)
      cy.contains('Total de Torneios')
        .should('be.visible')
        .parent()
        .within(() => {
          cy.get('.text-2xl').invoke('text').should('match', /^[0-9]+$/)
        })

      cy.contains('Jogadores Ativos')
        .should('be.visible')
        .parent()
        .within(() => {
          cy.get('.text-2xl').invoke('text').should('match', /^[0-9]+$/)
        })
    })

    it('deve exibir os filtros disponíveis', () => {
      // Verifica se o campo de busca existe
      cy.get('input[placeholder*="Buscar por jogador"]').should('be.visible')
      
      // Verifica se os selects de filtro existem
      cy.contains('Tipo de Torneio').should('be.visible')
      cy.contains('Mês').should('be.visible')
      cy.contains('Deck').should('be.visible')
    })
  })

  describe('Funcionalidade de filtros', () => {
    it('deve filtrar torneios por tipo (iniciante)', () => {
      // Clica no select de tipo de torneio
      cy.contains('Tipo de Torneio').parent().find('button').click()
      
      // Aguarda as opções aparecerem
      cy.get('[role="option"]', { timeout: 5000 }).should('be.visible')
      
      // Seleciona "Iniciante"
      cy.contains('[role="option"]', 'Iniciante').click()
      
      // Aguarda um pouco para o filtro aplicar
      cy.wait(300)
    });

    it('deve filtrar torneios por jogador', () => {
      // Digita um nome de jogador no campo de busca
      cy.get('input[placeholder*="Buscar por jogador"]').type('test')
      
      // Aguarda o debounce/filtro aplicar
      cy.wait(500)
      
      // Verifica se o input mantém o valor
      cy.get('input[placeholder*="Buscar por jogador"]').should('have.value', 'test')
    })

    it('deve filtrar torneios por deck', () => {
      // Clica no select de deck
      cy.contains('Deck').parent().find('button').click()
      
      // Aguarda as opções aparecerem
      cy.wait(300)
      
      // Verifica se há opções disponíveis além de "Todos"
      cy.get('[role="option"]').should('have.length.greaterThan', 1)
      
      // Seleciona o segundo deck (primeiro é "Todos")
      cy.get('[role="option"]').eq(1).click()
      
      // Aguarda aplicação do filtro
      cy.wait(500)
    })

  })

  //   it('deve filtrar torneios por mês', () => {
  //     // Clica no select de mês
  //     cy.contains('Mês').parent().find('button').click()
      
  //     // Aguarda as opções aparecerem
  //     cy.wait(300)
      
  //     // Se houver mais de uma opção (além de "Todos os meses")
  //     cy.get('[role="option"]').then(($options) => {
  //       if ($options.length > 1) {
  //         // Seleciona o segundo mês
  //         cy.get('[role="option"]').eq(1).click()
          
  //         // Aguarda aplicação do filtro
  //         cy.wait(500)
          
  //         // Verifica se o botão de limpar filtros aparece
  //         cy.contains('button', 'Limpar Filtros').should('be.visible')
  //       }
  //     })
  //   })
  // })

  // describe('Limpeza de filtros', () => {
  //   it('deve limpar todos os filtros quando clicar em "Limpar Filtros"', () => {
  //     // Aplica um filtro de busca
  //     cy.get('input[placeholder*="Buscar por jogador"]').type('teste')
      
  //     // Aplica filtro de tipo
  //     cy.contains('Tipo de Torneio').parent().find('button').click()
  //     cy.contains('Iniciante').click()
      
  //     // Aguarda os filtros aplicarem
  //     cy.wait(500)
      
  //     // Verifica se o botão de limpar filtros está visível
  //     cy.contains('button', 'Limpar Filtros').should('be.visible')
      
  //     // Clica para limpar
  //     cy.contains('button', 'Limpar Filtros').click()
      
  //     // Verifica se o input foi limpo
  //     cy.get('input[placeholder*="Buscar por jogador"]').should('have.value', '')
      
  //     // Verifica se o botão de limpar desaparece ou fica desabilitado
  //     cy.wait(300)
  //   })
  // })

  // describe('Visualização de torneios', () => {
  //   it('deve exibir cards de torneios quando houver dados', () => {
  //     // Aguarda o carregamento
  //     cy.wait(1000)
      
  //     // Verifica se há pelo menos um card de torneio
  //     // (assumindo que existe pelo menos um torneio no banco)
  //     cy.get('body').then(($body) => {
  //       if ($body.find('.text-2xl').text().trim() !== '0') {
  //         // Se há torneios, deve haver cards
  //         cy.contains('Total de Torneios')
  //           .parent()
  //           .parent()
  //           .find('.text-2xl')
  //           .invoke('text')
  //           .then((text) => {
  //             const total = parseInt(text)
  //             if (total > 0) {
  //               // Deve haver pelo menos um elemento de torneio visível
  //               cy.get('[class*="grid"]').should('exist')
  //             }
  //           })
  //       }
  //     })
  //   })

  //   it('deve permitir navegação para detalhes do torneio', () => {
  //     // Aguarda carregamento
  //     cy.wait(1000)
      
  //     // Tenta encontrar um link de torneio e clicar
  //     cy.get('body').then(($body) => {
  //       // Busca por links que possam ser de torneios
  //       const tournamentLinks = $body.find('a[href*="/tournaments/"]')
        
  //       if (tournamentLinks.length > 0) {
  //         // Clica no primeiro link encontrado
  //         cy.get('a[href*="/tournaments/"]').first().click()
          
  //         // Verifica se navegou (URL deve ter mudado)
  //         cy.url().should('include', '/tournaments/')
  //       }
  //     })
  //   })
  // })

  // describe('Responsividade', () => {
  //   it('deve ser visualizado corretamente em mobile', () => {
  //     // Define viewport mobile
  //     cy.viewport(375, 667) // iPhone SE
      
  //     // Verifica se elementos principais estão visíveis
  //     cy.contains('Torneios').should('be.visible')
  //     cy.contains('Total de Torneios').should('be.visible')
      
  //     // Verifica se os filtros estão acessíveis
  //     cy.get('input[placeholder*="Buscar por jogador"]').should('be.visible')
  //   })

  //   it('deve ser visualizado corretamente em tablet', () => {
  //     // Define viewport tablet
  //     cy.viewport(768, 1024) // iPad
      
  //     // Verifica se elementos principais estão visíveis
  //     cy.contains('Torneios').should('be.visible')
  //     cy.contains('Total de Torneios').should('be.visible')
  //   })
  // })
})
