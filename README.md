# Gestão Fundo Municipal - Economia Solidária

Sistema online de gerenciamento de processos de contratação de serviços e aquisição de itens com recursos do fundo municipal de economia solidária.

## 📋 Funcionalidades

- ✅ **Dashboard Visual** com indicadores em tempo real
- ✅ **Gestão de Fichas de Despesa** (CRUD completo)
- ✅ **Gestão de Processos** (registro, status, anexos)
- ✅ **Exportação de Dados** (Excel e CSV)
- ✅ **Controle de Saldo** por ficha e conta geral
- ✅ **Histórico de Status** com registro de responsável

## 🚀 Como Usar

### 1. Configuração Inicial no Google

#### 1.1 Criar Projeto no Google Cloud
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto chamado `gestao-fundo`
3. Habilite as APIs:
   - **Google Sheets API**
   - **Google Drive API**

#### 1.2 Criar Service Account
1. Vá em "IAM e Administração" > "Contas de serviço"
2. Clique em "Criar conta de serviço"
3. Nome: `gestao-fundo-sa`
4. Role: Editor
5. Clique em "Criar chave" e baixe o JSON
6. **Guarde o email da Service Account** (ex: `gestao-fundo-sa@project-id.iam.gserviceaccount.com`)

#### 1.3 Configurar Google Sheets
1. Acesse o Google Drive da conta `daes.ecosol@gmail.com`
2. Crie uma nova planilha chamada `Fundo Municipal - Processos`
3. Crie 4 abas:
   - `Fichas`
   - `Processos`
   - `StatusLog`
   - `Config`
4. Adicione os cabeçalhos em cada aba:

**Aba Fichas (colunas A-F):**
```
id, codigo, descricao, saldo_inicial, saldo_atual, criado_em
```

**Aba Processos (colunas A-M):**
```
id, numero, objeto, fornecedor, valor, ficha_id, status, data_emissao, data_pagamento, responsavel, anexos, criado_em, atualizado_em
```

**Aba StatusLog (colunas A-F):**
```
id, processo_id, status_anterior, status_novo, responsavel_mudanca, data_mudanca
```

**Aba Config (colunas A-B):**
```
saldo_conta_inicial, 0
```

5. Compartilhe a planilha com o email da Service Account (permissão de Editor)
6. **Copie o ID da planilha** (está na URL entre `/d/` e `/edit`)

#### 1.4 Configurar Google Drive
1. No Google Drive da conta `daes.ecosol@gmail.com`, crie uma pasta chamada `Anexos - Processos`
2. Compartilhe a pasta com o email da Service Account (permissão de Editor)
3. **Copie o ID da pasta** (está na URL entre `/folders/` e no final)

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=gestao-fundo-sa@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"

# Google Sheet ID (ID da planilha)
GOOGLE_SHEET_ID=1abc123xyz456...

# Google Drive Folder ID (pasta de anexos)
GOOGLE_DRIVE_FOLDER_ID=1xyz789abc123...
```

**Importante:** Para obter a `GOOGLE_PRIVATE_KEY`, abra o JSON baixado da Service Account e copie o valor de `private_key` (incluindo as aspas).

### 3. Instalar e Rodar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Acessar em http://localhost:3000
```

### 4. Deploy na Vercel

1. Faça push do código para o GitHub
2. Acesse [Vercel](https://vercel.com)
3. Importe o repositório
4. Adicione as variáveis de ambiente no painel da Vercel
5. Deploy automático!

## 📊 Estrutura de Dados

### Fichas de Despesa
- `id`: UUID único
- `codigo`: Código da ficha (ex: 3.3.90.30)
- `descricao`: Descrição da natureza de despesa
- `saldo_inicial`: Saldo inicial (R$)
- `saldo_atual`: Saldo atual (R$)
- `criado_em`: Data de criação

### Processos
- `id`: UUID único
- `numero`: Número do processo
- `objeto`: Descrição do objeto/contratação
- `fornecedor`: Nome do fornecedor
- `valor`: Valor (R$)
- `ficha_id`: ID da ficha vinculada
- `status`: aprovado | empenhado | liquidado
- `data_emissao`: Data de emissão
- `data_pagamento`: Data de pagamento (opcional)
- `responsavel`: Nome do responsável
- `anexos`: Array de URLs dos arquivos
- `criado_em`: Data de criação
- `atualizado_em`: Última atualização

## 🎯 Regras de Negócio

1. **Saldo da Ficha**: Ao criar um processo, o valor é debitado automaticamente do saldo da ficha vinculada
2. **Validação de Saldo**: Processo só pode ser criado se houver saldo suficiente na ficha
3. **Status**: Mudança de status não altera saldo (já debitado na criação)
4. **Restos a Pagar**: Processos aprovados ou empenhados mas não liquidados
5. **Saldo Disponível**: Saldo da conta - (aprovados + empenhados + liquidados)

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: Google Sheets (via API)
- **Armazenamento**: Google Drive (para anexos)
- **Deploy**: Vercel

## 📄 Licença

MIT