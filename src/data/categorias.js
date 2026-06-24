/**
 * Taxonomia fixa de Categoria → Subcategorias do Raio-X de Preços.
 *
 * Usada nos selects em cascata da criação de pacote (Categoria define as
 * Subcategorias disponíveis). Lista oficial fornecida pelo time de Compras.
 * Categorias e subcategorias ordenadas alfabeticamente (pt-BR).
 */
export const CATEGORIA_SUBCATEGORIAS = {
  'Bandeira': ['Fee de Bandeira'],
  'Bens Imobilizados': ['Meios de Transporte'],
  'Bobinas': ['Bobinas'],
  'Cartões e Emboss': ['Cartões e Emboss'],
  'Comercial': ['Campanhas de Incentivo', 'Parcerias', 'Repasse de Seguros'],
  'Doações': ['Doações'],
  'Facilities': [
    'Esgoto | Água | Energia',
    'Gestão de Imóveis - CDs',
    'Gestão de Imóveis - Escritórios',
    'Gestão de Imóveis - Polos',
    'Higiene e Limpeza',
    'Impostos | Tributos | Taxas (Facilities)',
    'Materiais de Escritório',
    'Móveis e mobiliário',
    'Obras e Manutenção Predial',
    'Segurança e Vigilância',
    'Serviços de Copa e Cozinha',
  ],
  'Financeiro': ['Contas a Pagar', 'Financeiro - Outros', 'Multas'],
  'Hardware': ['Hardware Baixa Plataforma', 'Microinformática e Periféricos'],
  'Hosting': ['Cloud', 'Data Center'],
  'Logística': [
    'Armazenagem',
    'Correios',
    'Frete e Transporte',
    'Frota',
    'Malotes e Courier',
    'Vale Combustível',
  ],
  'Marketing': [
    'Mkt - Artistas | Influencers | Celebridades',
    'Mkt - Criação | Agências | Produtoras',
    'Mkt - Eventos e Campanhas',
    'Mkt - Growth',
    'Mkt - Mídia Tradicional',
    'Mkt - Patrocínio',
    'Mkt - Pesquisas',
  ],
  'Pessoas': [
    'Atração',
    'Benefícios - Outros',
    'Benefícios - Saúde',
    'Benefícios - Transporte',
    'Eventos Internos',
    'Recrutamento',
    'Serviços de Endomarketing',
    'Treinamento e Desenvolvimento',
    'Uniformes e Epis',
  ],
  'POS': ['Acessórios e Peças de Reposição Pos', 'Chip e Dados POS', 'POS', 'Reparo de POS'],
  'Seguros': ['Seguros Cyber', 'Seguros Financeiros e Judiciais', 'Seguros Prediais'],
  'Software': [
    'Acerto de Contas Interno',
    'Consultoria TI',
    'Software Administrativo',
    'Software Core',
    'Software de Infra',
    'Software de Segurança',
    'Software Operacional',
  ],
  'Telecom': ['Dados e Voz', 'Softwares de Telecom'],
  'Terceiros': [
    'Auditoria',
    'Call Center',
    'Consultoria Corporativa',
    'Consultoria de RH',
    'Consultoria e Auditoria',
    'Consultoria Financeira',
    'Consultoria Médica',
    'Informações Cadastrais',
    'Serviços de Cobrança',
    'Serviços Jurídicos',
  ],
  'Viagens': [
    'Hotéis | Alojamentos | Conferência',
    'Serviços de agências de viagem',
    'Transporte Aéreo e Terrestre de Passageiros',
  ],
}

/** Lista de categorias (chaves), já ordenada. */
export const CATEGORIAS = Object.keys(CATEGORIA_SUBCATEGORIAS)

/** Mapa reverso Subcategoria → Categoria (para inferir a categoria de pacotes já salvos). */
export const SUBCATEGORIA_TO_CATEGORIA = Object.entries(CATEGORIA_SUBCATEGORIAS)
  .reduce((acc, [cat, subs]) => {
    for (const s of subs) acc[s] = cat
    return acc
  }, {})
