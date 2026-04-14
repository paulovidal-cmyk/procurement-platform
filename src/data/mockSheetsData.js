/**
 * Dados mock que espelham a estrutura do Google Sheets:
 * Coordenação | Categoria | Subcategoria | Quadrante | Fornecedor |
 * CNPJ | Tipo de Negociação | Quantidade de Pedidos | Spend
 */
export const MOCK_SHEETS_DATA = [
  // ── TI ──────────────────────────────────────────────────────────────────────
  { coordenacao:'Tecnologia', categoria:'TI', subcategoria:'Software',    quadrante:'Estratégico', fornecedor:'Microsoft',       cnpj:'60.872.504/0001-23', tipoNegociacao:'Recorrente',      qtdPedidos:15, spend:450000 },
  { coordenacao:'Tecnologia', categoria:'TI', subcategoria:'Software',    quadrante:'Estratégico', fornecedor:'Adobe Systems',    cnpj:'60.872.504/0002-04', tipoNegociacao:'Recorrente',      qtdPedidos:8,  spend:180000 },
  { coordenacao:'Tecnologia', categoria:'TI', subcategoria:'Software',    quadrante:'Alavancável', fornecedor:'Atlassian',        cnpj:'60.872.504/0003-85', tipoNegociacao:'Recorrente',      qtdPedidos:6,  spend:95000  },
  { coordenacao:'Tecnologia', categoria:'TI', subcategoria:'Hardware',    quadrante:'Alavancável', fornecedor:'Dell Technologies',cnpj:'72.381.189/0001-10', tipoNegociacao:'Spot',            qtdPedidos:23, spend:320000 },
  { coordenacao:'Tecnologia', categoria:'TI', subcategoria:'Hardware',    quadrante:'Rotina',      fornecedor:'FastMicro',        cnpj:'77.888.999/0001-41', tipoNegociacao:'Spot',            qtdPedidos:42, spend:85000  },
  { coordenacao:'Tecnologia', categoria:'TI', subcategoria:'Serviços TI', quadrante:'Gargalo',     fornecedor:'TechSupply Ltda',  cnpj:'11.222.333/0001-81', tipoNegociacao:'Projeto',         qtdPedidos:5,  spend:142000 },
  { coordenacao:'Tecnologia', categoria:'TI', subcategoria:'Serviços TI', quadrante:'Estratégico', fornecedor:'SoftMaker ME',     cnpj:'33.444.555/0001-07', tipoNegociacao:'Recorrente',      qtdPedidos:12, spend:98000  },
  { coordenacao:'Tecnologia', categoria:'TI', subcategoria:'Cloud',       quadrante:'Estratégico', fornecedor:'AWS Brasil',       cnpj:'23.927.163/0001-89', tipoNegociacao:'Frame Agreement', qtdPedidos:1,  spend:680000 },
  { coordenacao:'Tecnologia', categoria:'TI', subcategoria:'Cloud',       quadrante:'Gargalo',     fornecedor:'Google Cloud',     cnpj:'06.990.590/0001-23', tipoNegociacao:'Recorrente',      qtdPedidos:2,  spend:210000 },

  // ── Logística ────────────────────────────────────────────────────────────────
  { coordenacao:'Operações', categoria:'Logística', subcategoria:'Frete Nacional',      quadrante:'Alavancável', fornecedor:'LogisBrasil S.A.', cnpj:'22.333.444/0001-97', tipoNegociacao:'Recorrente',      qtdPedidos:18, spend:310000 },
  { coordenacao:'Operações', categoria:'Logística', subcategoria:'Frete Nacional',      quadrante:'Rotina',      fornecedor:'TransRápido',      cnpj:'88.999.000/0001-55', tipoNegociacao:'Spot',            qtdPedidos:35, spend:95000  },
  { coordenacao:'Operações', categoria:'Logística', subcategoria:'Armazenagem',         quadrante:'Estratégico', fornecedor:'DepósitoFlex',     cnpj:'55.111.222/0001-33', tipoNegociacao:'Frame Agreement', qtdPedidos:4,  spend:220000 },
  { coordenacao:'Operações', categoria:'Logística', subcategoria:'Frete Internacional', quadrante:'Gargalo',     fornecedor:'GlobalShip',       cnpj:'44.222.333/0001-11', tipoNegociacao:'Spot',            qtdPedidos:7,  spend:185000 },
  { coordenacao:'Operações', categoria:'Logística', subcategoria:'Last Mile',           quadrante:'Alavancável', fornecedor:'EntregaJá',        cnpj:'33.111.000/0001-66', tipoNegociacao:'Recorrente',      qtdPedidos:52, spend:142000 },

  // ── Facilities ───────────────────────────────────────────────────────────────
  { coordenacao:'Infra', categoria:'Facilities', subcategoria:'Limpeza',               quadrante:'Rotina',      fornecedor:'ServicosMais',  cnpj:'66.777.888/0001-35', tipoNegociacao:'Recorrente', qtdPedidos:12, spend:48000  },
  { coordenacao:'Infra', categoria:'Facilities', subcategoria:'Segurança',             quadrante:'Alavancável', fornecedor:'SecureGuard',   cnpj:'77.333.444/0001-22', tipoNegociacao:'Recorrente', qtdPedidos:6,  spend:96000  },
  { coordenacao:'Infra', categoria:'Facilities', subcategoria:'Manutenção',            quadrante:'Gargalo',     fornecedor:'ManutenSol',    cnpj:'88.444.555/0001-88', tipoNegociacao:'Projeto',    qtdPedidos:9,  spend:75000  },
  { coordenacao:'Infra', categoria:'Facilities', subcategoria:'Material de Escritório',quadrante:'Rotina',      fornecedor:'FornecedorXYZ', cnpj:'55.666.777/0001-29', tipoNegociacao:'Spot',       qtdPedidos:28, spend:27500  },
  { coordenacao:'Infra', categoria:'Facilities', subcategoria:'Alimentação',           quadrante:'Alavancável', fornecedor:'FoodCorp',      cnpj:'11.888.999/0001-44', tipoNegociacao:'Recorrente', qtdPedidos:22, spend:138000 },

  // ── Materiais ────────────────────────────────────────────────────────────────
  { coordenacao:'Operações', categoria:'Materiais', subcategoria:'Componentes',   quadrante:'Estratégico', fornecedor:'GlobalParts Inc', cnpj:'44.555.666/0001-13', tipoNegociacao:'Frame Agreement', qtdPedidos:8,  spend:398000 },
  { coordenacao:'Operações', categoria:'Materiais', subcategoria:'Embalagens',    quadrante:'Alavancável', fornecedor:'PackBrasil',      cnpj:'22.444.555/0001-66', tipoNegociacao:'Recorrente',      qtdPedidos:22, spend:145000 },
  { coordenacao:'Operações', categoria:'Materiais', subcategoria:'Matéria-prima', quadrante:'Estratégico', fornecedor:'RawMat',          cnpj:'33.555.666/0001-77', tipoNegociacao:'Frame Agreement', qtdPedidos:11, spend:290000 },
  { coordenacao:'Operações', categoria:'Materiais', subcategoria:'MRO',           quadrante:'Rotina',      fornecedor:'MROPlus',         cnpj:'44.666.777/0001-88', tipoNegociacao:'Spot',            qtdPedidos:67, spend:78000  },

  // ── Marketing ────────────────────────────────────────────────────────────────
  { coordenacao:'Marketing', categoria:'Marketing', subcategoria:'Agência Digital', quadrante:'Alavancável', fornecedor:'AgênciaX',     cnpj:'11.333.444/0001-55', tipoNegociacao:'Projeto',    qtdPedidos:6,  spend:180000 },
  { coordenacao:'Marketing', categoria:'Marketing', subcategoria:'Mídia',           quadrante:'Estratégico', fornecedor:'MidiaGroup',   cnpj:'22.555.666/0001-44', tipoNegociacao:'Recorrente', qtdPedidos:4,  spend:350000 },
  { coordenacao:'Marketing', categoria:'Marketing', subcategoria:'Brindes',         quadrante:'Rotina',      fornecedor:'BrindesMais',  cnpj:'33.666.777/0001-33', tipoNegociacao:'Spot',       qtdPedidos:15, spend:42000  },
  { coordenacao:'Marketing', categoria:'Marketing', subcategoria:'Eventos',         quadrante:'Alavancável', fornecedor:'EventPlus',    cnpj:'44.777.888/0001-22', tipoNegociacao:'Projeto',    qtdPedidos:8,  spend:220000 },

  // ── RH ───────────────────────────────────────────────────────────────────────
  { coordenacao:'Pessoas', categoria:'RH', subcategoria:'Benefícios',    quadrante:'Estratégico', fornecedor:'BenefíciosFlex', cnpj:'55.888.999/0001-11', tipoNegociacao:'Frame Agreement', qtdPedidos:2,  spend:890000 },
  { coordenacao:'Pessoas', categoria:'RH', subcategoria:'Treinamento',   quadrante:'Alavancável', fornecedor:'EduCorpBR',      cnpj:'66.999.000/0001-00', tipoNegociacao:'Projeto',         qtdPedidos:14, spend:175000 },
  { coordenacao:'Pessoas', categoria:'RH', subcategoria:'Recrutamento',  quadrante:'Gargalo',     fornecedor:'HuntersPro',     cnpj:'77.000.111/0001-99', tipoNegociacao:'Spot',            qtdPedidos:7,  spend:95000  },

  // ── Serviços ─────────────────────────────────────────────────────────────────
  { coordenacao:'Jurídico', categoria:'Jurídico', subcategoria:'Assessoria Jurídica', quadrante:'Estratégico', fornecedor:'LegalPrime',  cnpj:'88.111.222/0001-88', tipoNegociacao:'Recorrente', qtdPedidos:4,  spend:240000 },
  { coordenacao:'Jurídico', categoria:'Jurídico', subcategoria:'Compliance',          quadrante:'Gargalo',     fornecedor:'ComplianceBR',cnpj:'99.222.333/0001-77', tipoNegociacao:'Projeto',    qtdPedidos:2,  spend:110000 },

  // ── Financeiro ───────────────────────────────────────────────────────────────
  { coordenacao:'Finanças', categoria:'Financeiro', subcategoria:'Auditoria',   quadrante:'Estratégico', fornecedor:'AuditMax',   cnpj:'10.333.444/0001-66', tipoNegociacao:'Recorrente', qtdPedidos:2,  spend:420000 },
  { coordenacao:'Finanças', categoria:'Financeiro', subcategoria:'Consultoria', quadrante:'Alavancável', fornecedor:'ConsultPro', cnpj:'21.444.555/0001-55', tipoNegociacao:'Projeto',    qtdPedidos:5,  spend:185000 },
]
