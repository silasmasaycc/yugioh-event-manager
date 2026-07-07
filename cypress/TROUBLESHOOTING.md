# 🔧 Troubleshooting - Erros no Cypress

## ❌ Erro: "visitFailedByErr" ou "timedOutWaitingForPageLoad"

### Causa provável:
O servidor Next.js (`pnpm dev`) **não está rodando** ou ainda está iniciando.

### ✅ Solução:

**1. Certifique-se que o servidor está rodando:**

Abra um terminal e execute:
```bash
pnpm dev
```

Aguarde até ver:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

**2. Teste se o servidor está acessível:**

Abra o navegador e acesse manualmente:
```
http://localhost:3000/tournaments
```

Se a página carregar, o servidor está OK!

**3. Agora abra o Cypress:**

Em **OUTRO terminal** (mantendo o `pnpm dev` rodando):
```bash
pnpm cypress
```

**4. Execute os testes na ordem:**

1. `basic-test.cy.ts` - Testa conexão básica
2. `tournaments-fixed.cy.ts` - Versão simplificada
3. `tournaments-simple.cy.ts` - Versão básica
4. `tournaments.cy.ts` - Versão completa

---

## 🐛 Outros problemas comuns:

### Erro: "ECONNREFUSED"
- **Causa:** Servidor não está rodando
- **Solução:** Execute `pnpm dev` primeiro

### Erro: "baseUrl não definida"
- **Causa:** Configuração do Cypress
- **Solução:** Já está configurada em [cypress.config.ts](../cypress.config.ts)

### Timeout em testes específicos
- **Causa:** Banco de dados vazio ou consultas lentas
- **Solução:** Use os testes simplificados (`-simple.cy.ts` ou `-fixed.cy.ts`)

---

## 📋 Checklist rápido:

- [ ] `pnpm dev` está rodando?
- [ ] Página abre no navegador (http://localhost:3000)?
- [ ] Cypress abre em terminal separado?
- [ ] Tentou o `basic-test.cy.ts` primeiro?

---

## 🎯 Testes criados (do mais simples ao mais complexo):

1. **basic-test.cy.ts** ⭐ - Testa apenas conexão
2. **tournaments-fixed.cy.ts** - Versão com tratamento de erros
3. **tournaments-simple.cy.ts** - Versão básica funcional
4. **tournaments.cy.ts** - Versão completa (use após confirmar que os anteriores funcionam)

Comece sempre pelo `basic-test.cy.ts`!
