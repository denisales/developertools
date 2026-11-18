export type ToolCategory =
  | "geradores"
  | "validadores"
  | "calculadoras"
  | "utilitarios";

export type ToolStatus = "ready" | "coming-soon";

export interface ToolDefinition {
  id: string;
  slug: string;
  href: string;
  name: string;
  shortName: string;
  description: string;
  category: ToolCategory;
  categoryLabel: string;
  iconName: string;
  status: ToolStatus;
  priority?: boolean;
  badge?: string;
  keywords: string[];
}

export const TOOL_CATEGORIES: {
  id: ToolCategory;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "geradores",
    label: "Geradores de Documentos e Dados",
    shortLabel: "Geradores",
    description:
      "Gere documentos, pessoas, empresas, veículos e dados válidos para testes de software.",
  },
  {
    id: "calculadoras",
    label: "Calculadoras Financeiras & Matemáticas",
    shortLabel: "Calculadoras",
    description:
      "Simuladores de juros compostos, investimentos, porcentagem, regra de 3 e mais.",
  },
  {
    id: "validadores",
    label: "Validadores de Documentos",
    shortLabel: "Validadores",
    description:
      "Verifique dígitos verificadores e autenticidade matemática de documentos brasileiros.",
  },
  {
    id: "utilitarios",
    label: "Utilitários Dev, Texto & Rede",
    shortLabel: "Utilitários Dev",
    description:
      "Ferramentas para manipulação de texto, codificação, formatação e utilidades web.",
  },
];

export const TOOLS_REGISTRY: ToolDefinition[] = [
  // ==========================================
  // FERRAMENTAS PRIORITÁRIAS (MVP)
  // ==========================================
  {
    id: "gerador-de-cpf",
    slug: "gerador-de-cpf",
    href: "/gerador-de-cpf",
    name: "Gerador e Validador de CPF",
    shortName: "Gerador de CPF",
    description:
      "Gere números de CPF válidos (com ou sem pontuação), filtre por estado de origem (UF), gere em lote e valide CPFs instantaneamente.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "Fingerprint",
    status: "ready",
    priority: true,
    badge: "Popular",
    keywords: [
      "cpf",
      "gerador de cpf",
      "validador de cpf",
      "pessoa fisica",
      "documento",
      "teste",
      "4devs",
    ],
  },
  {
    id: "gerador-de-cnpj",
    slug: "gerador-de-cnpj",
    href: "/gerador-de-cnpj",
    name: "Gerador e Validador de CNPJ",
    shortName: "Gerador de CNPJ",
    description:
      "Gere números de CNPJ válidos (numéricos e alfanuméricos IN RFB 2229), escolha matriz ou filial, gere em lote e valide CNPJs.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "Building2",
    status: "ready",
    priority: true,
    badge: "Popular",
    keywords: [
      "cnpj",
      "gerador de cnpj",
      "validador de cnpj",
      "empresa",
      "pessoa juridica",
      "cnpj alfanumerico",
      "4devs",
    ],
  },
  {
    id: "calculadora-juros-compostos",
    slug: "calculadora-juros-compostos",
    href: "/calculadora-juros-compostos",
    name: "Calculadora de Juros Compostos",
    shortName: "Juros Compostos",
    description:
      "Simule a evolução do seu patrimônio com aportes mensais, conversão exata de taxas (anual/mensal), gráfico interativo e tabela mês a mês.",
    category: "calculadoras",
    categoryLabel: "Calculadoras",
    iconName: "TrendingUp",
    status: "ready",
    priority: true,
    badge: "Destaque",
    keywords: [
      "juros compostos",
      "investidor10",
      "calculadora financeira",
      "investimentos",
      "rendimento",
      "aportes mensais",
      "simulacao",
    ],
  },

  // ==========================================
  // GERADORES (CATÁLOGO 4DEVS)
  // ==========================================
  {
    id: "gerador-de-rg",
    slug: "gerador-de-rg",
    href: "/gerador-de-cpf",
    name: "Gerador de RG",
    shortName: "Gerador de RG",
    description:
      "Gere números de Registro Geral (RG) válidos no padrão SSP-SP para homologação de sistemas.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "IdCard",
    status: "coming-soon",
    keywords: ["rg", "identidade", "ssp", "gerador"],
  },
  {
    id: "gerador-de-cnh",
    slug: "gerador-de-cnh",
    href: "/gerador-de-cpf",
    name: "Gerador de CNH",
    shortName: "Gerador de CNH",
    description:
      "Gere números válidos de Carteira Nacional de Habilitação (CNH) com cálculo oficial de dígitos.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "Car",
    status: "coming-soon",
    keywords: ["cnh", "habilitacao", "motorista", "gerador"],
  },
  {
    id: "gerador-de-pis",
    slug: "gerador-de-pis",
    href: "/gerador-de-cpf",
    name: "Gerador de PIS/PASEP",
    shortName: "Gerador de PIS/PASEP",
    description:
      "Gere números de PIS/PASEP/NIT válidos com ou sem máscara para testes de folha e RH.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "Briefcase",
    status: "coming-soon",
    keywords: ["pis", "pasep", "nit", "trabalhador", "gerador"],
  },
  {
    id: "gerador-titulo-eleitor",
    slug: "gerador-titulo-eleitor",
    href: "/gerador-de-cpf",
    name: "Gerador de Título de Eleitor",
    shortName: "Título de Eleitor",
    description:
      "Gere números válidos de Título de Eleitor por estado (UF) segundo regras do TSE.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "Vote",
    status: "coming-soon",
    keywords: ["titulo de eleitor", "tse", "eleitor", "gerador"],
  },
  {
    id: "gerador-cartao-credito",
    slug: "gerador-cartao-credito",
    href: "/gerador-de-cpf",
    name: "Gerador de Cartão de Crédito",
    shortName: "Cartão de Crédito",
    description:
      "Gere cartões de teste válidos pelo algoritmo de Luhn (Visa, Mastercard, Elo, Amex, Hipercard).",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "CreditCard",
    status: "coming-soon",
    keywords: ["cartao de credito", "luhn", "visa", "mastercard", "checkout"],
  },
  {
    id: "gerador-conta-bancaria",
    slug: "gerador-conta-bancaria",
    href: "/gerador-de-cpf",
    name: "Gerador de Conta Bancária",
    shortName: "Conta Bancária",
    description:
      "Gere agência e conta corrente com dígito verificador para Banco do Brasil, Itaú, Bradesco, Santander e Caixa.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "Landmark",
    status: "coming-soon",
    keywords: ["conta bancaria", "agencia", "banco", "gerador"],
  },
  {
    id: "gerador-de-pessoas",
    slug: "gerador-de-pessoas",
    href: "/gerador-de-cpf",
    name: "Gerador de Pessoas",
    shortName: "Gerador de Pessoas",
    description:
      "Gere perfis completos de pessoas fictícias (nome, CPF, RG, data de nascimento, endereço, telefone, e-mail).",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "Users",
    status: "coming-soon",
    keywords: ["pessoas", "perfil", "dados falsos", "mock", "json"],
  },
  {
    id: "gerador-de-empresas",
    slug: "gerador-de-empresas",
    href: "/gerador-de-cnpj",
    name: "Gerador de Empresas",
    shortName: "Gerador de Empresas",
    description:
      "Gere dados completos de empresas (Razão Social, CNPJ, Inscrição Estadual, endereço e sócios).",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "Building",
    status: "coming-soon",
    keywords: ["empresas", "razao social", "inscricao estadual", "pj"],
  },
  {
    id: "gerador-de-veiculos",
    slug: "gerador-de-veiculos",
    href: "/gerador-de-cpf",
    name: "Gerador de Veículos, RENAVAM e Placa",
    shortName: "Veículos & RENAVAM",
    description:
      "Gere placas Mercosul/antigas, códigos RENAVAM válidos, marca, modelo e cor de veículos.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "Truck",
    status: "coming-soon",
    keywords: ["veiculos", "renavam", "placa mercosul", "carro"],
  },
  {
    id: "gerador-de-cep",
    slug: "gerador-de-cep",
    href: "/gerador-de-cpf",
    name: "Gerador de CEP e Endereço",
    shortName: "Gerador de CEP",
    description:
      "Gere endereços brasileiros reais e CEPs filtrados por estado e cidade para testes de frete e cadastro.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "MapPin",
    status: "coming-soon",
    keywords: ["cep", "endereco", "logradouro", "bairro", "uf"],
  },
  {
    id: "gerador-de-senhas",
    slug: "gerador-de-senhas",
    href: "/gerador-de-cpf",
    name: "Gerador de Senhas Seguras",
    shortName: "Gerador de Senhas",
    description:
      "Crie senhas fortes e criptograficamente seguras com controle de tamanho, símbolos, números e entropia.",
    category: "geradores",
    categoryLabel: "Geradores",
    iconName: "KeyRound",
    status: "coming-soon",
    keywords: ["senha", "password", "seguranca", "gerador"],
  },

  // ==========================================
  // VALIDADORES (CATÁLOGO 4DEVS)
  // ==========================================
  {
    id: "validador-de-cpf",
    slug: "validador-de-cpf",
    href: "/gerador-de-cpf?tab=validador",
    name: "Validador de CPF",
    shortName: "Validador de CPF",
    description:
      "Verifique se um CPF é matematicamente válido pelo Módulo 11 e identifique sua região fiscal de origem.",
    category: "validadores",
    categoryLabel: "Validadores",
    iconName: "ShieldCheck",
    status: "ready",
    keywords: ["validar cpf", "validador cpf", "verificar cpf", "mod 11"],
  },
  {
    id: "validador-de-cnpj",
    slug: "validador-de-cnpj",
    href: "/gerador-de-cnpj?tab=validador",
    name: "Validador de CNPJ",
    shortName: "Validador de CNPJ",
    description:
      "Valide números de CNPJ tradicionais e alfanuméricos, identificando matriz/filial e dígitos verificadores.",
    category: "validadores",
    categoryLabel: "Validadores",
    iconName: "BadgeCheck",
    status: "ready",
    keywords: ["validar cnpj", "validador cnpj", "verificar cnpj"],
  },
  {
    id: "validador-cnh-rg-pis",
    slug: "validador-cnh-rg-pis",
    href: "/gerador-de-cpf",
    name: "Validador de CNH, RG, PIS e Título",
    shortName: "Validador Documentos",
    description:
      "Valide múltiplos documentos civis brasileiros (CNH, RG, PIS/PASEP, Título de Eleitor e Certidões).",
    category: "validadores",
    categoryLabel: "Validadores",
    iconName: "FileCheck2",
    status: "coming-soon",
    keywords: ["validador cnh", "validador pis", "validador rg", "titulo"],
  },
  {
    id: "validador-cartao-credito",
    slug: "validador-cartao-credito",
    href: "/gerador-de-cpf",
    name: "Validador de Cartão de Crédito",
    shortName: "Validador de Cartão",
    description:
      "Valide números de cartão de crédito via algoritmo de Luhn e identifique a bandeira emissora.",
    category: "validadores",
    categoryLabel: "Validadores",
    iconName: "CheckCircle2",
    status: "coming-soon",
    keywords: ["validar cartao", "luhn", "bandeira cartao"],
  },

  // ==========================================
  // CALCULADORAS (INVESTIDOR10 & 4DEVS)
  // ==========================================
  {
    id: "calculadora-porcentagem",
    slug: "calculadora-porcentagem",
    href: "/calculadora-juros-compostos",
    name: "Calculadora de Porcentagem",
    shortName: "Porcentagem",
    description:
      "Calcule descontos, acréscimos, variação percentual e proporções rapidamente.",
    category: "calculadoras",
    categoryLabel: "Calculadoras",
    iconName: "Percent",
    status: "coming-soon",
    keywords: ["porcentagem", "desconto", "variacao percentual", "calculo"],
  },
  {
    id: "calculadora-regra-de-tres",
    slug: "calculadora-regra-de-tres",
    href: "/calculadora-juros-compostos",
    name: "Calculadora de Regra de 3",
    shortName: "Regra de 3",
    description:
      "Resolva problemas de regra de três simples (direta e inversamente proporcional) e composta.",
    category: "calculadoras",
    categoryLabel: "Calculadoras",
    iconName: "Calculator",
    status: "coming-soon",
    keywords: ["regra de 3", "proporcao", "matematica"],
  },
  {
    id: "calculadora-imc",
    slug: "calculadora-imc",
    href: "/calculadora-juros-compostos",
    name: "Calculadora de IMC",
    shortName: "Calculadora de IMC",
    description:
      "Calcule o Índice de Massa Corporal e veja sua classificação segundo a OMS.",
    category: "calculadoras",
    categoryLabel: "Calculadoras",
    iconName: "Activity",
    status: "coming-soon",
    keywords: ["imc", "peso", "altura", "saude"],
  },

  // ==========================================
  // UTILITÁRIOS DEV & TEXTO (CATÁLOGO 4DEVS)
  // ==========================================
  {
    id: "contador-caracteres",
    slug: "contador-caracteres",
    href: "/gerador-de-cpf",
    name: "Contador de Caracteres e Palavras",
    shortName: "Contador de Caracteres",
    description:
      "Conte caracteres, palavras, linhas, parágrafos e tempo estimado de leitura em tempo real.",
    category: "utilitarios",
    categoryLabel: "Utilitários Dev",
    iconName: "Type",
    status: "coming-soon",
    keywords: ["contador de caracteres", "palavras", "linhas", "texto"],
  },
  {
    id: "gerador-lorem-ipsum",
    slug: "gerador-lorem-ipsum",
    href: "/gerador-de-cpf",
    name: "Gerador de Lorem Ipsum",
    shortName: "Lorem Ipsum",
    description:
      "Gere parágrafos, frases e palavras de texto placeholder Lorem Ipsum para layouts e protótipos.",
    category: "utilitarios",
    categoryLabel: "Utilitários Dev",
    iconName: "AlignLeft",
    status: "coming-soon",
    keywords: ["lorem ipsum", "texto falso", "placeholder"],
  },
  {
    id: "formatador-json-base64",
    slug: "formatador-json-base64",
    href: "/gerador-de-cpf",
    name: "Formatador JSON, Base64 & UUID",
    shortName: "JSON, Base64 & UUID",
    description:
      "Formate e valide JSON, codifique/decodifique Base64 e URL, e gere UUIDs v4/v7.",
    category: "utilitarios",
    categoryLabel: "Utilitários Dev",
    iconName: "Code2",
    status: "coming-soon",
    keywords: ["json", "base64", "uuid", "dev tools", "formatador"],
  },
];

export function getPriorityTools(): ToolDefinition[] {
  return TOOLS_REGISTRY.filter((tool) => tool.priority);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS_REGISTRY.filter((tool) => tool.category === category);
}
