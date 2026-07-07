# 🧪 Cypress E2E Testing

## 📚 O que foi configurado

- ✅ Cypress instalado e configurado
- ✅ Scripts no `package.json` para rodar os testes
- ✅ Estrutura de pastas criada
- ✅ Comandos customizados (`commands.ts`)
- ✅ Teste exemplo para a página de **Tournaments** ([tournaments.cy.ts](cypress/e2e/tournaments.cy.ts))

---

## 🚀 Como rodar os testes

### 1️⃣ **Modo Interativo** (recomendado para desenvolvimento)

Abra o Cypress UI para ver e rodar testes visualmente:

```bash
pnpm dev
```

Em outro terminal:

```bash
pnpm cypress
```

Isso abrirá a interface do Cypress onde você pode:
- Ver todos os testes
- Clicar para executar individualmente
- Ver o navegador em tempo real
- Usar o Time Travel Debugger

### 2️⃣ **Modo Headless** (para CI/CD)

Para rodar todos os testes no terminal sem abrir o navegador:

```bash
pnpm dev
```

Em outro terminal:

```bash
pnpm cypress:headless
```

### 3️⃣ **Rodar tudo automaticamente**

*Nota: Requer instalar `start-server-and-test` primeiro:*

```bash
pnpm add -D start-server-and-test
```

Depois:

```bash
pnpm test:e2e           # Modo interativo
pnpm test:e2e:headless  # Modo headless
```

---

## 📝 Teste Exemplo: Tournaments

O arquivo [tournaments.cy.ts](cypress/e2e/tournaments.cy.ts) testa:

### ✅ Carregamento inicial
- Título e descrição da página
- Estatísticas (Total de Torneios, Jogadores Ativos)
- Presença de filtros

### ✅ Funcionalidade de filtros
- Filtro por tipo de torneio (Iniciante/Regular)
- Filtro por nome de jogador
- Filtro por deck
- Filtro por mês

### ✅ Limpeza de filtros
- Botão "Limpar Filtros" funciona corretamente

### ✅ Visualização de torneios
- Cards de torneios são exibidos
- Navegação para detalhes funciona

### ✅ Responsividade
- Layout funciona em mobile (375px)
- Layout funciona em tablet (768px)

---

## 🎯 Sua próxima missão: Página de **Players**

Agora é sua vez! Crie um teste para a página de **Players** (Ranking de Jogadores).

### 📍 Arquivo a criar:
`cypress/e2e/players.cy.ts`

### 🧩 O que testar:

**1. Carregamento inicial**
- [ ] Título "Jogadores" está visível
- [ ] Descrição da página está presente
- [ ] Estatísticas são exibidas (Total de Jogadores, Média de Pontos)
- [ ] Verifica se há filtros disponíveis

**2. Filtros**
- [ ] Filtro por nome de jogador funciona
- [ ] Filtro por tier (S, A, B, C) funciona
- [ ] Botão "Limpar Filtros" reseta tudo

**3. Visualização de jogadores**
- [ ] Cards de jogadores são exibidos
- [ ] Imagens dos jogadores carregam (ou placeholder)
- [ ] Badges de tier aparecem
- [ ] Estatísticas de cada jogador estão visíveis (vitórias, pontos, etc)

**4. Responsividade**
- [ ] Mobile (375px)
- [ ] Tablet (768px)

### 💡 Dicas:

1. Use o teste de tournaments como base - a estrutura é similar
2. Use `cy.contains()` para buscar textos
3. Use `cy.get()` para selecionar elementos por classe/atributo
4. Use `cy.wait()` para aguardar filtros aplicarem (500ms é suficiente)
5. Use `describe()` para agrupar testes relacionados
6. Use `it()` para cada teste individual

### 📖 Exemplo de início:

```typescript
/// <reference types="cypress" />

describe('Players Page', () => {
  beforeEach(() => {
    cy.visit('/players')
    cy.wait(1000)
  })

  describe('Carregamento inicial', () => {
    it('deve carregar a página e exibir título', () => {
      cy.contains('h2', 'Jogadores').should('be.visible')
      // Adicione mais testes aqui...
    })
  })

  // Continue com os outros testes...
})
```

---

## 🔍 Comandos Cypress úteis

| Comando | O que faz |
|---------|-----------|
| `cy.visit('/path')` | Navega para uma URL |
| `cy.get('selector')` | Busca elemento por seletor CSS |
| `cy.contains('text')` | Busca elemento por texto |
| `cy.click()` | Clica em elemento |
| `cy.type('texto')` | Digita em input |
| `cy.should('be.visible')` | Verifica se está visível |
| `cy.wait(1000)` | Aguarda 1 segundo |
| `cy.url()` | Pega a URL atual |
| `cy.viewport(375, 667)` | Muda tamanho da tela |

---

## 📚 Documentação

- [Cypress Docs](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Assertions](https://docs.cypress.io/guides/references/assertions)

---

## 🎓 Próximos passos após Players

Depois de terminar o teste de Players, você pode testar:

1. **Decks Page** - Listagem de decks
2. **Ranking Page** - Rankings gerais
3. **Stats Page** - Página de estatísticas (mais complexa, com gráficos)

Boa sorte! 🚀
