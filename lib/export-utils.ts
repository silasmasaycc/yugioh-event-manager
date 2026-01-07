import html2canvas from 'html2canvas'

interface PlayerData {
  name: string
  points: number
  tier: string | null
  position: number
  totalTops: number
}

interface PenaltyData {
  name: string
  totalPenalties: number
  penaltyRate: number
  totalTournaments: number
}

interface ExportData {
  players: PlayerData[]
  totalPlayers: number
  top10Average: number
  penaltyStats?: PenaltyData[]
}

export async function exportRankingAsImage(
  data: ExportData,
  fileName: string = 'ranking'
): Promise<void> {
  try {
    // Criar elemento temporário com o layout personalizado
    const exportElement = createExportElement(data)
    document.body.appendChild(exportElement)

    // Aguardar renderização
    await new Promise(resolve => setTimeout(resolve, 500))

    // Capturar o elemento como canvas
    const canvas = await html2canvas(exportElement, {
      backgroundColor: '#ffffff',
      scale: 3, // Alta qualidade
      logging: false,
      useCORS: true,
      allowTaint: true,
    })

    // Remover elemento temporário
    document.body.removeChild(exportElement)

    // Converter para blob e fazer download
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Erro ao gerar imagem')
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/png')
  } catch (error) {
    console.error('Erro ao exportar imagem:', error)
    throw error
  }
}

function createExportElement(data: ExportData): HTMLElement {
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 900px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1a202c;
  `

  const now = new Date()
  
  // Contar jogadores por tier
  const tierCount = data.players.reduce((acc, p) => {
    const tier = p.tier || 'Sem Tier'
    acc[tier] = (acc[tier] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const tiers = ['S', 'A', 'B', 'C', 'D']
  const tierColors: Record<string, string> = {
    'S': '#ef4444',
    'A': '#eab308',
    'B': '#22c55e',
    'C': '#3b82f6',
    'D': '#6b7280'
  }

  container.innerHTML = `
    <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 3px solid #667eea; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 38px; font-weight: 800; color: #667eea; margin-bottom: 8px;">
          🏆 RANKING OFICIAL
        </div>
        <div style="font-size: 15px; color: #64748b; margin-top: 8px;">
          Yugioh Event Manager
        </div>
      </div>

      <!-- Estatísticas Gerais -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <div style="font-size: 20px; font-weight: 700; color: #1e40af; margin-bottom: 16px;">
          📊 Estatísticas Gerais
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div style="text-align: center; background: white; padding: 20px; border-radius: 8px;">
            <div style="font-size: 32px; font-weight: 800; color: #3b82f6;">${data.totalPlayers}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 6px;">Total de Jogadores</div>
          </div>
          <div style="text-align: center; background: white; padding: 20px; border-radius: 8px;">
            <div style="font-size: 32px; font-weight: 800; color: #8b5cf6;">${data.top10Average}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 6px;">Média Top 10</div>
          </div>
        </div>
      </div>

      <!-- Top 10 -->
      <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <div style="font-size: 20px; font-weight: 700; color: #92400e; margin-bottom: 20px;">
          🥇 Top 10
        </div>
        ${data.players.slice(0, 10).map((player, index) => {
          const medals = ['🥇', '🥈', '🥉']
          const medal = index < 3 ? medals[index] : `${index + 1}º`
          const tierColor = player.tier ? tierColors[player.tier] : '#94a3b8'
          
          return `
            <div style="height: 60px; display: flex; align-items: center; margin-bottom: 8px; background: #ffffff; border-left: 4px solid ${tierColor}; border-radius: 8px;">
              <div style="width: 60px; font-size: 18px; font-weight: 700; text-align: center; flex-shrink: 0;">${medal}</div>
              <div style="flex: 1; font-size: 16px; font-weight: 600; color: #1e293b;">${player.name}</div>
              <div style="style="flex-shrink: 0; font-size: 12px; font-weight: 700;">
                ${player.tier ? `<span style="display:block; background: ${tierColor}; padding: 6px; margin-top: 10px; border-radius: 4px; color: #ffffff;">${player.tier}</span>` : ''}
              </div>
              <div style="width: 90px; text-align: center; flex-shrink: 0;">
                <div style="font-size: 16px; font-weight: 800; color: #7c3aed;">${player.points}</div>
                <div style="font-size: 10px; color: #64748b;">pts</div>
              </div>
              <div style="width: 90px; text-align: center; flex-shrink: 0;">
                <div style="font-size: 16px; font-weight: 800; color: #eab308;">${player.totalTops}</div>
                <div style="font-size: 10px; color: #64748b;">TOPs</div>
              </div>
            </div>
          `
        }).join('')}
      </div>

      <!-- Top 5 Double Loss -->
      ${data.penaltyStats && data.penaltyStats.length > 0 ? `
      <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <div style="font-size: 20px; font-weight: 700; color: #991b1b; margin-bottom: 20px;">
          ⚠️ Top 5 - Double Loss
        </div>
        ${data.penaltyStats.slice(0, 5).map((player, index) => {
          const medals = ['🥇', '🥈', '🥉']
          const medal = index < 3 ? medals[index] : `#${index + 1}`
          
          return `
            <div style="height: 60px; display: flex; align-items: center; margin-bottom: 8px; background: #ffffff; border-left: 4px solid #ef4444; border-radius: 8px;">
              <div style="width: 60px; font-size: 18px; font-weight: 700; text-align: center; flex-shrink: 0; color: #ef4444;">${medal}</div>
              <div style="flex: 1; font-size: 16px; font-weight: 600; color: #1e293b;">${player.name}</div>
              <div style="width: 100px; text-align: center; flex-shrink: 0;">
                <div style="font-size: 16px; font-weight: 800; color: #ef4444;">${player.totalPenalties}</div>
                <div style="font-size: 10px; color: #64748b;">Double Loss</div>
              </div>
              <div style="width: 90px; text-align: center; flex-shrink: 0;">
                <div style="font-size: 16px; font-weight: 800; color: #f97316;">${player.penaltyRate.toFixed(0)}%</div>
                <div style="font-size: 10px; color: #64748b;">Taxa</div>
              </div>
              <div style="width: 90px; text-align: center; flex-shrink: 0;">
                <div style="font-size: 16px; font-weight: 800; color: #94a3b8;">${player.totalTournaments}</div>
                <div style="font-size: 10px; color: #64748b;">Torneios</div>
              </div>
            </div>
          `
        }).join('')}
      </div>
      ` : ''}

      <!-- Distribuição por Tier -->
      <div style="background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <div style="font-size: 20px; font-weight: 700; color: #6b21a8; margin-bottom: 16px;">
          📈 Distribuição por Tier
        </div>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">
          ${tiers.map(tier => {
            const count = tierCount[tier] || 0
            const color = tierColors[tier]
            return `
              <div style="text-align: center; background: white; padding: 16px; border-radius: 8px; border-top: 4px solid ${color};">
                <div style="font-size: 24px; font-weight: 800; color: ${color};">Tier ${tier}</div>
                <div style="font-size: 20px; font-weight: 700; color: #1e293b; margin-top: 8px;">${count}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">jogador${count !== 1 ? 'es' : ''}</div>
              </div>
            `
          }).join('')}
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 24px; border-top: 2px solid #e2e8f0;">
        <div style="font-size: 14px; color: #64748b;">
          Data de exportação: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  `

  return container
}

export async function exportTierListAsImage(
  data: ExportData,
  fileName: string = 'tier-list'
): Promise<void> {
  try {
    const exportElement = createTierListElement(data)
    document.body.appendChild(exportElement)

    await new Promise(resolve => setTimeout(resolve, 500))

    const canvas = await html2canvas(exportElement, {
      backgroundColor: '#ffffff',
      scale: 3,
      logging: false,
      useCORS: true,
      allowTaint: true,
    })

    document.body.removeChild(exportElement)

    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Erro ao gerar imagem')
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/png')
  } catch (error) {
    console.error('Erro ao exportar tier list:', error)
    throw error
  }
}

function createTierListElement(data: ExportData): HTMLElement {
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 1200px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1a202c;
  `

  const now = new Date()
  const tiers = ['S', 'A', 'B', 'C', 'D']
  const tierColors: Record<string, string> = {
    'S': '#ef4444',
    'A': '#eab308',
    'B': '#22c55e',
    'C': '#3b82f6',
    'D': '#6b7280'
  }

  // Agrupar jogadores por tier
  const playersByTier: Record<string, PlayerData[]> = {}
  tiers.forEach(tier => {
    playersByTier[tier] = data.players.filter(p => p.tier === tier)
  })

  container.innerHTML = `
    <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 3px solid #667eea; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 42px; font-weight: 800; color: #667eea; margin-bottom: 8px;">
          🏅 TIER LIST OFICIAL
        </div>
        <div style="font-size: 16px; color: #64748b; margin-top: 8px;">
          Yugioh Event Manager
        </div>
      </div>

      <!-- Tiers -->
      ${tiers.map(tier => {
        const players = playersByTier[tier] || []
        const color = tierColors[tier]
        
        return `
          <div style="margin-bottom: 20px;">
            <!-- Tier Header -->
            <div style="display: flex; align-items: center; padding: 12px 20px; background: ${color}; color: white; border-radius: 8px 8px 0 0;">
              <div style="font-size: 28px; font-weight: 800; min-width: 100px;">TIER ${tier}</div>
              <div style="flex: 1; text-align: right; font-size: 14px; opacity: 0.95;">
                ${players.length} jogador${players.length !== 1 ? 'es' : ''}
              </div>
            </div>
            
            <!-- Players Grid -->
            <div style="background: ${color}08; border: 2px solid ${color}; border-top: none; border-radius: 0 0 8px 8px; padding: 16px;">
              ${players.length > 0 ? `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                  ${players.map(player => `
                    <div style="background: white; border-left: 4px solid ${color}; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <!-- Nome e Stats -->
                      <div style="flex: 1; min-width: 0;">
                        <div style="height: 25px; font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${player.name}
                        </div>
                        <div style="font-size: 11px; color: #64748b;">
                          ${player.points} pts • ${player.totalTops} TOP${player.totalTops !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div style="text-align: center; color: #94a3b8; padding: 24px; font-style: italic; font-size: 14px;">
                  Nenhum jogador neste tier
                </div>
              `}
            </div>
          </div>
        `
      }).join('')}

      <!-- Footer -->
      <div style="text-align: center; padding-top: 24px; border-top: 2px solid #e2e8f0; margin-top: 8px;">
        <div style="font-size: 14px; color: #64748b;">
          Data de exportação: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  `

  return container
}
