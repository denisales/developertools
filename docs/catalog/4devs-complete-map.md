# Catálogo Completo de Ferramentas — 4Devs + Investidor10

Este documento mapeia **100% das ferramentas existentes no portal [4Devs](https://www.4devs.com.br/)** (extraídas diretamente da árvore de navegação de `/computacao`, `/matematica` e dos 128 endpoints de `sitemap.xml`) acrescidas da **Calculadora de Juros Compostos do [Investidor10](https://investidor10.com.br/calculadoras/juros-compostos/)**.

Cada ferramenta listada abaixo corresponde a uma **tarefa isolada (Task)** no plano de execução paralela com Git Worktrees, desenhada para residir em seu próprio módulo dentro de `src/features/<category>/<tool-slug>/`.

---

## Resumo Quantitativo do Mapeamento

| Macro-Categoria | Subcategoria Original (4Devs / Investidor10) | Qtd. Ferramentas Principais | Sub-rotas / Variações Estaduais (SEO) | Complexidade Predominante |
| :--- | :--- | :---: | :---: | :---: |
| **0. MVP Prioritário (Epic 1)** | Geradores de CPF/CNPJ + Juros Compostos (Investidor10) | 3 | 2 (Validadores integrados/rotas dedicadas) | Média / Alta |
| **1. Computação — Geradores** | Documentos, Entidades, Veículos, Texto, Senhas e Sorteios | 24 (excluindo CPF/CNPJ já contados no MVP) | 27 UFs (Inscrição Estadual) + 3 tipos Certidão | Baixa a Alta |
| **2. Computação — Validadores** | Validação Algorítmica de Documentos e Contas | 11 | — | Baixa a Média |
| **3. Computação — Utilidades & Trabalhista** | Calculadoras Trabalhistas e Consulta Bancária | 3 | — | Média |
| **4. Computação — Funções String** | Manipulação, Contagem, Conversão e Formatação de Texto | 14 | — | Baixa |
| **5. Computação — Rede e Internet** | Diagnóstico de Cliente (IP, Browser, OS) | 3 | — | Baixa |
| **6. Computação — Encodes, Decoders & Hashes** | Criptografia, Codificação, Binário e QR Code | 7 | — | Baixa a Média |
| **7. Computação — SEO, Tabelas & Padrões** | Meta Tags, Color Picker e Tabela ASCII | 3 | — | Baixa |
| **8. Matemática — Calculadoras & Datas** | Aritmética, MMC/MDC, Porcentagem, Regra de 3 e Datas | 10 | 4 operações passo-a-passo (`como_somar`, etc.) | Baixa |
| **9. Matemática — Calcular Áreas** | Geometria Plana (13 figuras geométricas) | 13 | — | Baixa |
| **TOTAL** | **Todas as Ferramentas Mapeadas** | **91 Ferramentas Principais** | **+34 Sub-rotas de SEO (125+ páginas)** | — |

---

## 0. MVP Prioritário (Epic 1 — Lançamento Imediato)

As 3 ferramentas prioritárias definidas para o primeiro ciclo de desenvolvimento paralelo (incluindo seus respectivos validadores):

| # | Nome da Ferramenta | Origem / URL Original | Slug no Projeto (` Next.js `) | Feature Path (`src/features/...`) | Inputs Principais | Outputs Principais | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **P1** | **Gerador de CPF** *(+ Validador)* | `4devs.com.br/gerador_de_cpf` | `/gerador-de-cpf` | `src/features/generators/cpf` | Com pontuação (`Sim`/`Não`), Estado de Origem (`Indiferente` ou 27 UFs), Quantidade em lote (`1` a `100`) | CPF válido (Mod-11), cópia 1-clique, lista em lote, exportação `.txt`/`.csv`/`.json`, aba/bloco de validação instantânea | **Média** |
| **P2** | **Gerador de CNPJ** *(+ Validador)* | `4devs.com.br/gerador_de_cnpj` | `/gerador-de-cnpj` | `src/features/generators/cnpj` | Com pontuação (`Sim`/`Não`), Formato (`Numérico` atual vs `Alfanumérico IN RFB 2.229/2024`), Filial/Matriz (`0001` ou custom), Quantidade em lote | CNPJ válido (Mod-11 numérico e ASCII-48 alfanumérico), cópia rápida, exportação em lote, validação integrada | **Média** |
| **P3** | **Calculadora de Juros Compostos** | `investidor10.com.br/calculadoras/juros-compostos/` | `/calculadora-juros-compostos` | `src/features/calculators/compound-interest` | Valor Inicial (`R$`), Investimento Mensal (`R$`), Taxa de Juros (`%` Mensal ou Anual), Período (`Anos` ou `Meses`) | 3 Cards de destaque (`Valor Total Final`, `Valor Total Investido`, `Total em Juros`), Gráfico Donut + Barras Empilhadas, Tabela de evolução mensal/anual | **Alta** |

---

## 1. Computação — Geradores (`/computacao` -> `Geradores`)

Todos os 26 geradores presentes na barra lateral de Computação do 4Devs (e suas sub-rotas do `sitemap.xml`):

| # | Ferramenta | URL 4Devs | Slug Sugerido | Categoria (`src/features/...`) | Inputs | Outputs | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 1.1 | **Gerador de CPF** | `/gerador_de_cpf` | `/gerador-de-cpf` | `generators/cpf` | Pontuação (S/N), UF de origem (27 estados + Indiferente), Qtd | Número de CPF válido com dígitos verificadores Mod-11 | Média *(MVP)* |
| 1.2 | **Gerador de CNPJ** | `/gerador_de_cnpj` | `/gerador-de-cnpj` | `generators/cnpj` | Pontuação (S/N), Formato (Numérico / Alfanumérico IN RFB 2.229/2024), Qtd | Número de CNPJ válido (`0001` matriz) com dígitos Mod-11 | Média *(MVP)* |
| 1.3 | **Gerador de RG** | `/gerador_de_rg` | `/gerador-de-rg` | `generators/rg` | Pontuação (S/N), Estado/Órgão emissor (SSP-SP, Detran-RJ, etc.) | Número de RG válido com dígito verificador (`0-9` ou `X`) | Baixa |
| 1.4 | **Gerador de CNH** | `/gerador_de_cnh` | `/gerador-de-cnh` | `generators/cnh` | Pontuação/Espaços (S/N), Quantidade | Número de CNH de 11 dígitos válido segundo algoritmo DENATRAN | Baixa |
| 1.5 | **Gerador de PIS/PASEP** | `/gerador_de_pis_pasep` | `/gerador-de-pis-pasep` | `generators/pis-pasep` | Pontuação (S/N) | Número de PIS/PASEP/NIT de 11 dígitos válido (pesos `3,2,9,8,7,6,5,4,3,2`) | Baixa |
| 1.6 | **Gerador de Título de Eleitor** | `/gerador_de_titulo_de_eleitor` | `/gerador-de-titulo-de-eleitor` | `generators/titulo-eleitor` | Pontuação (S/N), Estado (UF `01` SP a `28` Exterior) | Número de Título de Eleitor de 12 dígitos com código UF e 2 DVs | Média |
| 1.7 | **Gerador de Inscrição Estadual** | `/gerador_de_inscricao_estadual` *(+ 27 rotas `/gerador_de_inscricao_estadual_<estado>`)* | `/gerador-de-inscricao-estadual` | `generators/inscricao-estadual` | Pontuação (S/N), Estado (27 UFs: AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO) | Inscrição Estadual válida respeitando máscara e algoritmo específico da SEFAZ de cada UF | Alta |
| 1.8 | **Gerador de Certidões** | `/gerador_numero_certidoes` *(+ `/gerador_certidao_nascimento`, `/casamento`, `/obito`)* | `/gerador-de-certidoes` | `generators/certidoes` | Pontuação (S/N), Tipo de Certidão (Nascimento `1`, Casamento `2`, Óbito `3`, Indiferente) | Matrícula padrão CNJ de 32 dígitos (Serventia, Acervo, Serviço, Ano, Tipo, Livro, Folha, Termo, 2 DVs) | Média |
| 1.9 | **Gerador de Conta Bancária** | `/gerador_conta_bancaria` | `/gerador-conta-bancaria` | `generators/conta-bancaria` | Banco (Banco do Brasil, Bradesco, Itaú, Santander, Caixa, Citibank, HSBC), Estado (UF) | Agência (com DV se aplicável), Conta Corrente com DV oficial do banco selecionado, Nome do Banco | Média |
| 1.10 | **Gerador de Cartão de Crédito** | `/gerador_de_numero_cartao_credito` | `/gerador-cartao-de-credito` | `generators/cartao-credito` | Pontuação/Espaços (S/N), Bandeira (Visa, MasterCard, Amex, Diners, Discover, EnRoute, JCB, Voyager, Hipercard, Aura) | Número do Cartão válido (Algoritmo de Luhn), Data de Validade futura, Código CVV (3 ou 4 dígitos) | Média |
| 1.11 | **Gerador de RENAVAM** | `/gerador_de_renavam` | `/gerador-de-renavam` | `generators/renavam` | Pontuação (S/N) | Código RENAVAM de 11 dígitos válido com dígito verificador Mod-11 | Baixa |
| 1.12 | **Gerador Placa de Veículos** | `/gerador_de_placa_automoveis` | `/gerador-placa-veiculos` | `generators/placa-veiculos` | Pontuação/Hífen (S/N), Estado (UF), Padrão (`Mercosul LLLNLNN` ou `Antigo LLL-NNNN`) | Placa automotiva válida dentro da faixa de prefixos do DETRAN da UF escolhida | Média |
| 1.13 | **Gerador de Veículos** | `/gerador_de_veiculos` | `/gerador-de-veiculos` | `generators/veiculos` | Pontuação (S/N), Estado (UF), Marca de veículo (opcional) | Ficha completa: Marca, Modelo, Ano, RENAVAM válido, Placa válida, Cor, Combustível | Média |
| 1.14 | **Gerador de CEP** | `/gerador_de_cep` | `/gerador-de-cep` | `generators/cep` | Pontuação (S/N), Estado (UF) | CEP válido real/faixa postal com Logradouro, Bairro, Cidade e Estado (UF) | Baixa |
| 1.15 | **Gerador de Pessoas** | `/gerador_de_pessoas` | `/gerador-de-pessoas` | `generators/pessoas` | Sexo (H/M/Indiferente), Idade, UF, Cidade, Pontuação (S/N), Quantidade (`1` a `30`) | Perfil completo: Nome, CPF, RG, Data Nasc., Signo, Mãe, Pai, Email, Senha, CEP, Endereço, Telefone, Celular, Altura, Peso, Tipo Sanguíneo, Cor Favorita + Exportação JSON/CSV/XML | Alta |
| 1.16 | **Gerador de Empresas** | `/gerador_de_empresas` | `/gerador-de-empresas` | `generators/empresas` | Pontuação (S/N), Estado (UF), Idade da Empresa | Ficha completa: Nome/Razão Social, CNPJ válido, Inscrição Estadual válida para a UF, Data de Abertura, Site, Email, CEP, Endereço, Telefone, Celular | Média |
| 1.17 | **Gerador de Nomes** | `/gerador_de_nomes` | `/gerador-de-nomes` | `generators/nomes` | Tipo/Gênero (Masculino, Feminino, Ambos), Quantidade, Nacionalidade/Estilo | Lista de nomes e sobrenomes completos realistas | Baixa |
| 1.18 | **Gerador de Nicks** | `/gerador_de_nicks` | `/gerador-de-nicks` | `generators/nicks` | Método (Aleatório, Combinação de palavras, Limite de letras `4` a `15`), Quantidade | Lista de nicknames criativos para jogos/redes sociais | Baixa |
| 1.19 | **Gerador de Letras Diferentes** | `/letras_diferentes` | `/letras-diferentes` | `generators/letras-diferentes` | Texto base digitado pelo usuário | Dezenas de variações Unicode estilizadas ( cursiva, gótica, negrito, circulada, invertida, estética) com botão Copiar | Baixa |
| 1.20 | **Símbolos para Copiar** | `/simbolos` | `/simbolos-para-copiar` | `generators/simbolos` | Filtro/Busca por categoria (Estrelas, Corações, Setas, Jogos/Free Fire, Moedas, Matemática, Emojis) | Grade interativa de símbolos Unicode com cópia ao clicar e área de composição | Baixa |
| 1.21 | **Gerador de Senha** | `/gerador_de_senha` | `/gerador-de-senha` | `generators/senha` | Tamanho (`4` a `128`), Maiúsculas, Minúsculas, Números, Símbolos Especiais, Evitar caracteres ambíguos, Qtd | Senha(s) criptograficamente segura(s) (`crypto.getRandomValues`) + Indicador de Força/Entropia | Baixa |
| 1.22 | **Gerador de Números Aleatórios** | `/gerador_de_numeros_aleatorios` | `/gerador-numeros-aleatorios` | `generators/numeros-aleatorios` | Valor Mínimo, Valor Máximo, Quantidade de números, Permitir repetição (S/N) | Lista de números gerados, ordenação opcional, soma/média | Baixa |
| 1.23 | **Sorteador de Números** | `/sorteador` | `/sorteador-de-numeros` | `generators/sorteador` | Quantidade de números a sortear, Intervalo (`De` / `Até`), Opções de exibição (Animação, Ordenar resultado, Sem repetição) | Resultado destacado do sorteio com timestamp e compartilhamento/cópia | Baixa |
| 1.24 | **Gerador de Lorem Ipsum** | `/gerador_de_texto_lorem_ipsum` | `/gerador-lorem-ipsum` | `generators/lorem-ipsum` | Quantidade, Tipo de unidade (Parágrafos, Palavras, Frases, Bytes/Caracteres), Começar com "Lorem ipsum..." (S/N), Tags HTML `<p>` | Texto placeholder formatado pronto para cópia | Baixa |
| 1.25 | **Gerador de Imagem (Lorem Pixel)** | `/gerador_de_imagem_lorem_pixel` | `/gerador-de-imagem` | `generators/imagem-placeholder` | Largura (`px`), Altura (`px`), Cor de fundo, Cor do texto, Texto customizado / Categoria, Formato (`PNG`, `SVG`, `WebP`) | Imagem placeholder gerada via Canvas/SVG client-side + download direto e URL/DataURI | Média |
| 1.26 | **Gerador de Currículo** | `/gerador-de-curriculo` | `/gerador-de-curriculo` | `generators/curriculo` | Dados Pessoais, Foto (opcional), Objetivo, Formação Acadêmica (lista dinâmica), Experiência Profissional (lista), Cursos/Idiomas, Modelo visual | Preview de currículo formatado em A4 + Impressão / Exportação direta para PDF (`window.print` / `@media print`) | Alta |

---

## 2. Computação — Validadores (`/computacao` -> `Validadores`)

Todos os 11 validadores oficiais da barra lateral do 4Devs:

| # | Ferramenta | URL 4Devs | Slug Sugerido | Categoria (`src/features/...`) | Inputs | Outputs | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 2.1 | **Validador de CPF** | `/validador_cpf` | `/validador-cpf` | `validators/cpf` | Número do CPF (com ou sem máscara) | Status (`Válido` / `Inválido`), Estado/Região Fiscal de origem (9º dígito), CPF formatado e limpo | Baixa |
| 2.2 | **Validador de CNPJ** | `/validador_cnpj` | `/validador-cnpj` | `validators/cnpj` | Número do CNPJ (Numérico ou Alfanumérico, com ou sem máscara) | Status (`Válido` / `Inválido`), Tipo (Matriz `0001` ou Filial), Formato detectado, DVs esperados vs informados | Baixa |
| 2.3 | **Validador de RG** | `/validador_rg` | `/validador-rg` | `validators/rg` | Número do RG, UF/Órgão (SSP-SP, etc.) | Status (`Válido` / `Inválido`) com verificação de dígito Mod-11 | Baixa |
| 2.4 | **Validador de CNH** | `/validador_cnh` | `/validador-cnh` | `validators/cnh` | Número da CNH (11 dígitos) | Status (`Válido` / `Inválido`) segundo cálculo de DVs do DENATRAN | Baixa |
| 2.5 | **Validador de PIS/PASEP** | `/validador_pis_pasep` | `/validador-pis-pasep` | `validators/pis-pasep` | Número do PIS/PASEP/NIT (11 dígitos) | Status (`Válido` / `Inválido`) | Baixa |
| 2.6 | **Validador de Título de Eleitor** | `/validador_titulo_de_eleitor` | `/validador-titulo-de-eleitor` | `validators/titulo-eleitor` | Número do Título de Eleitor (12 dígitos) | Status (`Válido` / `Inválido`), UF de emissão identificada pelos dígitos 9 e 10 | Baixa |
| 2.7 | **Validar Inscrição Estadual** | `/validar_inscricao_estadual` | `/validador-inscricao-estadual` | `validators/inscricao-estadual` | Estado (27 UFs), Número da Inscrição Estadual | Status (`Válido` / `Inválido`) segundo regra da SEFAZ estadual correspondente | Alta |
| 2.8 | **Validador de Certidões** | `/validador_certidoes` | `/validador-certidoes` | `validators/certidoes` | Número de matrícula da certidão (32 dígitos) | Status (`Válido` / `Inválido`), Tipo de certidão identificado (Nascimento, Casamento, Óbito), Ano de registro | Média |
| 2.9 | **Validador de Cartão de Crédito** | `/validador_numero_cartao_credito` | `/validador-cartao-de-credito` | `validators/cartao-credito` | Número do Cartão de Crédito | Status (`Válido` / `Inválido` via algoritmo de Luhn), Bandeira detectada (BIN/IIN), Quantidade de dígitos | Baixa |
| 2.10 | **Validador de Conta Bancária** | `/validador_conta_bancaria` | `/validador-conta-bancaria` | `validators/conta-bancaria` | Banco (BB, Bradesco, Itaú, Santander, Caixa, Citibank), Agência, Conta Corrente com dígito | Status (`Válido` / `Inválido`) para o par Agência/Conta segundo pesos do banco | Média |
| 2.11 | **Validador de RENAVAM** | `/validador_de_renavam` | `/validador-renavam` | `validators/renavam` | Número do RENAVAM (9 ou 11 dígitos) | Status (`Válido` / `Inválido`) com verificação do DV | Baixa |

---

## 3. Computação — Utilidades Trabalhistas & Bancárias (`/computacao` -> `Utilidades`)

| # | Ferramenta | URL 4Devs | Slug Sugerido | Categoria (`src/features/...`) | Inputs | Outputs | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 3.1 | **Calculadora de Rescisão de Contrato** | `/rescisao_contrato` | `/calculadora-rescisao-clt` | `calculators/rescisao-contrato` | Salário Bruto, Data de Admissão, Data de Demissão, Motivo (Sem justa causa, Com justa causa, Pedido de demissão, Acordo), Aviso Prévio (Trabalhado/Indenizado), Férias vencidas, Nº dependentes, Saldo FGTS | Tabela detalhada de Proventos (Saldo salário, Aviso prévio, 13º proporcional, Férias proporcionais + 1/3, Multa FGTS 40%/20%), Descontos (INSS, IRRF) e Valor Líquido da Rescisão | Alta |
| 3.2 | **Cálculo de Férias** | `/calculo_de_ferias` | `/calculadora-de-ferias` | `calculators/calculo-ferias` | Salário Bruto, Média de Horas Extras/Comissões, Número de dependentes, Dias de férias (`10` a `30`), Abono pecuniário / Vender 1/3 (S/N), Adiantar 1ª parcela 13º (S/N) | Memória de cálculo completa: Valor férias brutas, 1/3 constitucional, Abono pecuniário, Descontos INSS e IRRF, Total Líquido a receber | Média |
| 3.3 | **Consulta Número do Banco** | `/consulta_numero_banco` | `/consulta-numero-banco` | `utilities/consulta-banco` | Busca por Nome da Instituição Financeira, Código COMPE (3 dígitos) ou ISPB (8 dígitos) | Tabela filtrável instantânea com Código COMPE, ISPB, Nome do Banco, Razão Social e participação no PIX/TED | Baixa |

---

## 4. Computação — Funções String (`/computacao` -> `Funções String`)

| # | Ferramenta | URL 4Devs | Slug Sugerido | Categoria (`src/features/...`) | Inputs | Outputs | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 4.1 | **Contador de Caracteres** | `/analisar_textos` | `/contador-de-caracteres` | `text/contador-caracteres` | Área de texto livre | Contagem em tempo real: Caracteres (com e sem espaços), Palavras, Linhas, Parágrafos, Tempo estimado de leitura | Baixa |
| 4.2 | **Maiúsculas e Minúsculas** | `/converter_maiusculas_minusculas` | `/maiusculas-e-minusculas` | `text/maiusculas-minusculas` | Texto de entrada, Modo (`MAIÚSCULAS`, `minúsculas`, `Primeira Letra Da Frase`, `Primeira Letra De Cada Palavra`, `iNVERTER cASO`, `aLtErNaDo`) | Texto convertido instantaneamente com botão Copiar | Baixa |
| 4.3 | **Inverter Texto** | `/inverter_texto` | `/inverter-texto` | `text/inverter-texto` | Texto de entrada, Modo (Inverter tudo, Inverter ordem das palavras, Inverter letras de cada palavra) | Texto invertido (`olpmexE`) + detector de palíndromo | Baixa |
| 4.4 | **Remover Acentos do Texto** | `/remover_acentos_de_um_texto` | `/remover-acentos` | `text/remover-acentos` | Texto acentuado | Texto normalizado via `NFD` sem diacríticos (`c` para `ç`, vogais limpas) | Baixa |
| 4.5 | **Remover ou Trocar `\n`** | `/remover_trocar_quebra_linha` | `/remover-quebra-de-linha` | `text/remover-quebra-linha` | Texto multilinha, String substituta (espaço, vírgula, tag `<br>`, vazio) | Texto unificado em linha única ou separado pelo delimitador escolhido | Baixa |
| 4.6 | **Colocar em Ordem Alfabética** | `/colocar_em_ordem_alfabetica` | `/ordem-alfabetica` | `text/ordem-alfabetica` | Lista de itens (separados por quebra de linha, vírgula ou espaço), Ordem (`A-Z`, `Z-A`), Remover duplicados (S/N), Ignorar maiúsculas/acentos | Lista ordenada e higienizada | Baixa |
| 4.7 | **Contador de Ocorrência de Palavra** | `/contador_ocorrencia_palavra_no_texto` | `/contador-ocorrencia-palavra` | `text/contador-ocorrencia` | Texto base, Palavra ou expressão buscada, Case-sensitive (S/N) | Número total de ocorrências, densidade percentual e ranking das palavras mais frequentes do texto | Baixa |
| 4.8 | **Converter Texto to HTML** | `/converter_texto_html` | `/converter-texto-html` | `text/converter-texto-html` | Texto puro, Opções (Converter quebras em `<p>` e `<br>`, escapar entidades HTML `&aacute;`) | Código HTML gerado + preview visual | Baixa |
| 4.9 | **Cortar Textos (`x` letras)** | `/cortar_textos_x_letras` | `/cortar-textos` | `text/cortar-textos` | Texto de entrada, Posição inicial, Quantidade de caracteres (ou tamanho de cada bloco) | Texto truncado / fatiado em blocos de `N` caracteres | Baixa |
| 4.10 | **Dividir String (Split)** | `/dividir_string` | `/dividir-string` | `text/dividir-string` | Texto de entrada, Delimitador de corte (caractere/string), Separador de saída | Lista/Array de substrings resultantes com índice e contagem de partes | Baixa |
| 4.11 | **Informações de Caracter** | `/informacoes_caracter` | `/informacoes-caracter` | `text/informacoes-caracter` | Caractere digitado ou colado | Tabela detalhada: Código Decimal, Hexadecimal, Octal, Binário, Entidade HTML (`&#...;`), Code Point Unicode (`U+XXXX`), URL Escape | Baixa |
| 4.12 | **Letras Personalizadas** | `/textos_fontes_personalizadas` | `/letras-personalizadas` | `text/letras-personalizadas` | Texto curto, Seleção de estilo ASCII Art / Fontes decorativas | Banner/Texto estilizado para copiar | Baixa |
| 4.13 | **Número por Extenso** | `/numero_por_extenso` | `/numero-por-extenso` | `text/numero-por-extenso` | Valor numérico (até bilhões/trilhões), Unidade (`Numérico puro` ou `Moeda R$ Reais/Centavos`), Gênero (`Masculino`/`Feminino`), Caixa (`minúscula`/`MAIÚSCULA`/` Capitalizado`) | Texto escrito por extenso em português seguindo a gramática oficial | Média |
| 4.14 | **Corretor Ortográfico** | `/corretor_ortografico` | `/corretor-ortografico` | `text/corretor-ortografico` | Texto em português | Revisão de espaçamentos, pontuação, palavras repetidas, capitalização pós-ponto e dicionário de erros comuns em PT-BR | Média |

---

## 5. Computação — Rede e Internet (`/computacao` -> `Rede e Internet`)

| # | Ferramenta | URL 4Devs | Slug Sugerido | Categoria (`src/features/...`) | Inputs | Outputs | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 5.1 | **Meu IP** | `/meu_ip` | `/meu-ip` | `network/meu-ip` | Automático ao carregar a página (+ botão Atualizar) | Endereço IPv4/IPv6 público (via API Route Next.js `x-forwarded-for` / lookup público), Reverso/ISP, País/Cidade aproximada e botão Copiar | Baixa |
| 5.2 | **Meu Navegador** | `/meu_navegador` | `/meu-navegador` | `network/meu-navegador` | Automático (`navigator` client-side) | Nome e Versão do Browser, Engine, User-Agent completo, Idioma, Cookies habilitados, Resolução da janela/tela, Online status | Baixa |
| 5.3 | **Meu Sistema Operacional** | `/meu_sistema_operacional` | `/meu-sistema-operacional` | `network/meu-sistema-operacional` | Automático (`navigator.userAgentData` / `userAgent`) | Sistema Operacional (Windows, Linux, macOS, Android, iOS), Arquitetura/Plataforma, Número de núcleos de CPU (`hardwareConcurrency`), Memória, Touch support | Baixa |

---

## 6. Computação — Encodes, Decoders & Hashes (`/computacao` -> `Encodes e Decoders`)

| # | Ferramenta | URL 4Devs | Slug Sugerido | Categoria (`src/features/...`) | Inputs | Outputs | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 6.1 | **Base64 Decodificar e Codificar** | `/codificar_decodificar_base64` | `/base64` | `encoders/base64` | Texto de entrada, Ação (`Codificar para Base64` / `Decodificar de Base64`), Suporte UTF-8 completo | String resultante codificada/decodificada com cópia 1-clique | Baixa |
| 6.2 | **URL Encode / Decode** | `/url_encode_url_decode` | `/url-encode-decode` | `encoders/url-encode` | String/URL de entrada, Ação (`Encode` / `Decode`), Modo (`encodeURIComponent` vs `encodeURI`) | String URL-safe codificada ou decodificada | Baixa |
| 6.3 | **Tradutor de Código Binário** | `/tradutor_codigo_binario` | `/tradutor-codigo-binario` | `encoders/codigo-binario` | Texto comum ou sequência de bytes binários (`01000001`), Direção (`Texto -> Binário` / `Binário -> Texto`) | Representação binária separada por espaços ou texto UTF-8/ASCII reconstruído | Baixa |
| 6.4 | **Codificar MD5** | `/codificar_md5` | `/gerador-md5` | `encoders/md5` | Texto de entrada | Hash MD5 de 128 bits (32 caracteres hexadecimais, minúsculo e maiúsculo) | Baixa |
| 6.5 | **Codificar SHA1** | `/codificar_sha1` | `/gerador-sha1` | `encoders/sha1` | Texto de entrada (+ suporte extra SHA-256 / SHA-512 via Web Crypto API) | Hash SHA-1 de 160 bits (40 caracteres hexadecimais) | Baixa |
| 6.6 | **Calcular CRC32** | `/calcular_crc32` | `/calcular-crc32` | `encoders/crc32` | Texto de entrada | Checksum CRC32 em formato Hexadecimal e Decimal | Baixa |
| 6.7 | **Gerador de QR Code** | `/gerador_de_qrcode` | `/gerador-de-qrcode` | `encoders/qrcode` | Texto/URL/PIX/Wi-Fi, Tamanho (`100x100` a `1000x1000`), Nível de Correção de Erro (`L`, `M`, `Q`, `H`), Cor de Frente/Fundo | QR Code renderizado instantaneamente + Download em `PNG` e `SVG` | Média |

---

## 7. Computação — SEO, Tabelas & Padrões (`/computacao` -> `SEO` & `Tabelas e Padrões`)

| # | Ferramenta | URL 4Devs | Slug Sugerido | Categoria (`src/features/...`) | Inputs | Outputs | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 7.1 | **Gerador de Meta Tags** | `/gerador_de_meta_tags` | `/gerador-meta-tags` | `dev/gerador-meta-tags` | Título, Descrição, Keywords, Autor, Charset, Robots (`index/follow`), URL Canônica, Open Graph (OG Image/Type) e Twitter Cards | Bloco de código `<head>` HTML completo pronto para copiar + Preview de snippet do Google e Card Social | Baixa |
| 7.2 | **Color Picker** | `/color_picker` | `/color-picker` | `dev/color-picker` | Seletor visual de cor (Matiz/Saturação/Brilho) ou input manual | Conversão em tempo real entre `HEX`, `RGB`, `HSL`, `CMYK`, tons complementares/análogos e contraste WCAG | Baixa |
| 7.3 | **Tabela ASCII** | `/tabela_ascii` | `/tabela-ascii` | `dev/tabela-ascii` | Filtro de busca (por código, caractere ou descrição) | Tabela completa de caracteres de controle (`0-31`) e imprimíveis (`32-127` + estendida `128-255`) com Decimal, Hex, Octal, Binário e HTML | Baixa |

---

## 8. Matemática — Calculadoras Online & Datas (`/matematica` -> `Calculadoras Online` & `Datas e Horas`)

| # | Ferramenta | URL 4Devs | Slug Sugerido | Categoria (`src/features/...`) | Inputs | Outputs | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 8.1 | **Regra de 3 Simples** | `/calculadora_regra_tres_simples` | `/calculadora-regra-de-3` | `math/regra-de-tres` | Valores `A`, `B`, `C` (para achar `X`), Proporção (`Diretamente proporcional` ou `Inversamente proporcional`) | Valor de `X` calculado + passo a passo algébrico da equação | Baixa |
| 8.2 | **Calculadora de Porcentagem** | `/calculadora_porcentagem` | `/calculadora-porcentagem` | `math/porcentagem` | 4 calculadoras em 1: (1) Quanto é `X%` de `Y`? (2) `X` é qual `%` de `Y`? (3) Aumento percentual de `X` para `Y` (4) Desconto/Acréscimo de `X%` sobre `Y` | Resultados imediatos para todos os cenários com memória de cálculo | Baixa |
| 8.3 | **Calculadora de MMC** | `/calculadora_mmc` | `/calculadora-mmc` | `math/mmc` | Dois ou mais números inteiros | Mínimo Múltiplo Comum (MMC) + decomposição simultânea em fatores primos passo a passo | Baixa |
| 8.4 | **Calculadora de MDC** | `/calculadora_mdc` | `/calculadora-mdc` | `math/mdc` | Dois ou mais números inteiros | Máximo Divisor Comum (MDC) + divisores de cada número e método de Euclides/fatoração | Baixa |
| 8.5 | **Fatorar Número** | `/calculadora_fatorar_numero` | `/fatorar-numero` | `math/fatorar-numero` | Número inteiro positivo | Decomposição visual em fatores primos (`2² × 3 × 5`), lista de todos os divisores e verificação se é número primo | Baixa |
| 8.6 | **Resto da Divisão** | `/resto_da_divisao` *(+ `/como_somar`, `/como_subtrair`, `/como_multiplicar`, `/como_dividir`)* | `/resto-da-divisao` | `math/resto-divisao` | Dividendo e Divisor | Quociente inteiro, Resto da divisão (`mod`), Resultado decimal exato e montagem visual da conta | Baixa |
| 8.7 | **Conversor de Números Romanos** | `/conversor_romanos` | `/conversor-numeros-romanos` | `math/numeros-romanos` | Número Arábico (`1` a `3.999.999`) ou Algarismo Romano (`I`, `V`, `X`, `L`, `C`, `D`, `M`) | Conversão bidirecional instantânea + tabela de referência rápida | Baixa |
| 8.8 | **Contador de Dias entre Datas** | `/diferenca_de_dias_entre_datas` | `/diferenca-entre-datas` | `math/diferenca-datas` | Data Inicial, Data Final, Incluir dia final (S/N) | Diferença total em Dias corridos, Semanas, Meses, Anos, Horas e Dias Úteis estimados | Baixa |
| 8.9 | **Somar Dias em Datas** | `/somar_dias_em_datas` | `/somar-dias-data` | `math/somar-dias-data` | Data Base, Quantidade de Dias (ou Semanas/Meses/Anos) a somar | Nova data resultante formatada, dia da semana e calendário visual | Baixa |
| 8.10 | **Subtrair Dias em Datas** | `/subtrair_dias_em_datas` | `/subtrair-dias-data` | `math/subtrair-dias-data` | Data Base, Quantidade de Dias (ou Semanas/Meses/Anos) a subtrair | Nova data resultante formatada e dia da semana | Baixa |

---

## 9. Matemática — Calcular Áreas (`/matematica` -> `Calcular Áreas`)

As 13 calculadoras de geometria plana do 4Devs (podem compartilhar um layout geométrico com diagramas SVG interativos das fórmulas):

| # | Ferramenta | URL 4Devs | Slug Sugerido | Categoria (`src/features/...`) | Inputs | Fórmula Aplicada & Outputs | Complexidade |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 9.1 | **Área do Círculo** | `/area_circulo` | `/area-circulo` | `math/areas/circulo` | Raio ($r$) ou Diâmetro ($d$) | $A = \pi \cdot r^2$ e Comprimento $C = 2\pi r$ | Baixa |
| 9.2 | **Área do Quadrado** | `/area_quadrado` | `/area-quadrado` | `math/areas/quadrado` | Lado ($L$) ou Diagonal ($d$) | $A = L^2$, Perímetro $P = 4L$, Diagonal $d = L\sqrt{2}$ | Baixa |
| 9.3 | **Área do Retângulo** | `/area_retangulo` | `/area-retangulo` | `math/areas/retangulo` | Base ($b$) e Altura ($h$) | $A = b \cdot h$, Perímetro $P = 2(b+h)$, Diagonal $d = \sqrt{b^2+h^2}$ | Baixa |
| 9.4 | **Área do Triângulo** | `/area_triangulo` | `/area-triangulo` | `math/areas/triangulo` | Base ($b$) e Altura ($h$) — ou 3 lados ($a, b, c$ via Fórmula de Heron) | $A = \frac{b \cdot h}{2}$ | Baixa |
| 9.5 | **Área do Pentágono** | `/area_pentagono` | `/area-pentagono` | `math/areas/pentagono` | Lado ($L$) — e/ou Apótema ($a$) | $A = \frac{5 \cdot L \cdot a}{2} = \frac{1}{4}\sqrt{5(5+2\sqrt{5})} \cdot L^2$ | Baixa |
| 9.6 | **Área do Hexágono** | `/area_hexagono` | `/area-hexagono` | `math/areas/hexagono` | Lado ($L$) | $A = \frac{3\sqrt{3} \cdot L^2}{2}$, Apótema $a = \frac{L\sqrt{3}}{2}$ | Baixa |
| 9.7 | **Área do Polígono Regular** | `/area_poligono_regular` | `/area-poligono-regular` | `math/areas/poligono-regular` | Número de lados ($n \ge 3$), Comprimento do lado ($L$) | $A = \frac{n \cdot L^2}{4 \cdot \tan(\pi/n)}$, Perímetro $P = n \cdot L$ | Baixa |
| 9.8 | **Área do Losango** | `/area_losango` | `/area-losango` | `math/areas/losango` | Diagonal Maior ($D$) e Diagonal Menor ($d$) | $A = \frac{D \cdot d}{2}$, Lado $L = \sqrt{(D/2)^2 + (d/2)^2}$ | Baixa |
| 9.9 | **Área do Trapézio** | `/area_trapezio` | `/area-trapezio` | `math/areas/trapezio` | Base Maior ($B$), Base Menor ($b$) e Altura ($h$) | $A = \frac{(B + b) \cdot h}{2}$ | Baixa |
| 9.10 | **Área do Paralelogramo** | `/area_paralelogramo` | `/area-paralelogramo` | `math/areas/paralelogramo` | Base ($b$) e Altura ($h$) | $A = b \cdot h$ | Baixa |
| 9.11 | **Área da Elipse** | `/area_elipse` | `/area-elipse` | `math/areas/elipse` | Semi-eixo maior ($a$) e Semi-eixo menor ($b$) | $A = \pi \cdot a \cdot b$ | Baixa |
| 9.12 | **Área da Coroa Circular** | `/area_coroa_circular` | `/area-coroa-circular` | `math/areas/coroa-circular` | Raio Maior ($R$) e Raio Menor ($r$, com $R > r$) | $A = \pi \cdot (R^2 - r^2)$ | Baixa |
| 9.13 | **Área do Setor Circular** | `/area_setor_circular` | `/area-setor-circular` | `math/areas/setor-circular` | Raio ($r$) e Ângulo central ($\alpha$ em graus) ou Comprimento do arco ($l$) | $A = \frac{\alpha \cdot \pi \cdot r^2}{360^\circ}$ | Baixa |

---

## 10. Páginas Informativas / SEO Complementares Mapeadas no `sitemap.xml`

Além das ferramentas interativas acima, o `sitemap.xml` do 4Devs contém páginas conceituais e sub-rotas estaduais que podem ser atendidas dinamicamente via Next.js Dynamic Routes (`[uf]`) ou seções de FAQ dentro das próprias ferramentas:
1. **27 Sub-rotas Estaduais de Inscrição Estadual**: `/gerador_de_inscricao_estadual_acre` até `/gerador_de_inscricao_estadual_tocantins` -> podem ser servidas por `/gerador-de-inscricao-estadual/[uf]` pré-selecionando a UF correspondente.
2. **3 Sub-rotas de Certidões**: `/gerador_certidao_nascimento`, `/gerador_certidao_casamento`, `/gerador_certidao_obito` -> podem ser servidas por `/gerador-de-certidoes` com query/parâmetro pré-selecionado.
3. **Artigos de Apoio incorporados como FAQ (Rich Snippets)**:
   - `/o_que_e_pra_que_serve_inscricao_estadual` -> FAQ na página de Inscrição Estadual.
   - `/o_que_e_orgao_expedidor_ou_emissor` -> FAQ na página de Gerador de RG.
   - `/como_somar`, `/como_subtrair`, `/como_multiplicar`, `/como_dividir` -> Modos na calculadora aritmética passo a passo.
