# Yu-Gi-Oh! Event Manager 🏆

Sistema completo de gerenciamento de torneios de Yu-Gi-Oh! desenvolvido com Next.js 15, Supabase, TypeScript e Tailwind CSS.

## 📖 Sobre o Projeto

O Yu-Gi-Oh! Event Manager é uma plataforma web projetada para organizar e acompanhar torneios de Yu-Gi-Oh! de forma profissional e intuitiva. O sistema oferece controle total sobre jogadores, eventos e estatísticas, permitindo que organizadores de torneios locais gerenciem suas competições com eficiência.

### ✨ Principais Recursos

**Área Pública:**
- Visualização de torneios realizados com classificação final (1º ao 4º lugar)
- Listagem de jogadores com estatísticas de desempenho (participações, TOPs e taxa de aproveitamento)
- Ranking baseado em performance (% de colocações no TOP 4)
- Dashboard de estatísticas com gráficos interativos e filtros por período:
  - Melhor taxa de desempenho dos jogadores
  - Jogadores com mais TOPs
  - Participação em torneios
  - Distribuição de colocações por jogador
  - Evolução temporal de torneios

**Área Administrativa:**
- CRUD completo de jogadores e torneios
- Upload de imagens (local ou URL) com armazenamento no Supabase Storage
- Registro de resultados com top 4 de cada torneio
- Sistema de permissões com dois níveis:
  - **Admin**: Acesso completo (criar, editar, excluir)
  - **Sub-Admin**: Apenas criação de novos registros

### 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15 (App Router), TypeScript, React 19
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **UI/UX**: Tailwind CSS, Shadcn/ui components
- **Gráficos**: Recharts com interatividade completa
- **Notificações**: Sonner (toast messages)

### 🎯 Objetivo

Facilitar a organização de torneios locais de Yu-Gi-Oh!, oferecendo uma plataforma moderna para registro de eventos, acompanhamento de desempenho de jogadores e visualização de estatísticas detalhadas, promovendo transparência e engajamento na comunidade de duelistas.

---

**Happy Dueling! 🎴**
