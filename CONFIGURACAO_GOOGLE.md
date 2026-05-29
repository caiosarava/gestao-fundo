# 📋 Guia de Configuração - Google Sheets & Drive API

## Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Faça login com a conta `daes.ecosol@gmail.com`
3. No topo da página, clique no seletor de projetos
4. Clique em **"NOVO PROJETO"** ou **"NEW PROJECT"**
5. Preencha:
   - **Nome do projeto**: `gestao-fundo`
   - **Localização**: Organização do projeto (pode deixar em branco)
6. Clique em **"CRIAR"** (CREATE)
7. Aguarde a criação (pode levar alguns segundos)
8. Selecione o projeto criado no seletor

---

## Passo 2: Habilitar APIs Necessárias

### 2.1 Habilitar Google Sheets API
1. No menu lateral, vá em **"APIs e serviços"** > **"Biblioteca"**
   - Ou acesse: `https://console.cloud.google.com/apis/library`
2. Na barra de busca, digite: `Google Sheets API`
3. Clique em **"Google Sheets API"** nos resultados
4. Clique no botão **"ATIVAR"** (ENABLE)
5. Aguarde a ativação

### 2.2 Habilitar Google Drive API
1. Volte para a **Biblioteca de APIs**
2. Na barra de busca, digite: `Google Drive API`
3. Clique em **"Google Drive API"** nos resultados
4. Clique no botão **"ATIVAR"** (ENABLE)
5. Aguarde a ativação

---

## Passo 3: Criar Service Account (Conta de Serviço)

1. No menu lateral, vá em **"IAM e administração"** > **"Contas de serviço"**
   - Ou acesse: `https://console.cloud.google.com/iam-admin/serviceaccounts`
2. Clique em **"+ CRIAR CONTA DE SERVIÇO"** (+ CREATE SERVICE ACCOUNT)
3. Preencha os dados:
   - **Nome da conta de serviço**: `gestao-fundo-sa`
   - **ID da conta de serviço**: (preenchido automaticamente)
   - **Descrição**: `Conta de serviço para o sistema de gestão do fundo`
4. Clique em **"CRIAR E CONTINUAR"** (CREATE AND CONTINUE)
5. **Pule a etapa de seleção de função** (clique em "CONTINUAR")
6. **Pule a etapa de concessão de acesso** (clique em "CONCLUÍDO")
7. Sua conta de serviço foi criada!

---

## Passo 4: Criar e Baixar Chave da Service Account

1. Na lista de contas de serviço, clique no email da conta que você criou
   - Email formato: `gestao-fundo-sa@gestao-fundo-XXXXX.iam.gserviceaccount.com`
2. Clique na aba **"CHAVES"** (KEYS) no topo
3. Clique em **"ADICIONAR CHAVE"** > **"Criar nova chave"**
4. Selecione o tipo de chave: **JSON**
5. Clique em **"CRIAR"** (CREATE)
6. **Um arquivo JSON será baixado automaticamente**
7. **GUARDE ESTE ARQUIVO COM SEGURANÇA!** (não compartilhe)

### O arquivo JSON terá esta estrutura:
```json
{
  "type": "service_account",
  "project_id": "gestao-fundo-12345",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "gestao-fundo-sa@gestao-fundo-12345.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Anote estas informações do JSON:
- ✅ `client_email`: `gestao-fundo-sa@gestao-fundo-12345.iam.gserviceaccount.com`
- ✅ `private_key`: (chave completa incluindo `\n`)
- ✅ `project_id`: `gestao-fundo-12345`

---

## Passo 5: Criar Planilha no Google Sheets

1. Acesse o Google Drive: [drive.google.com](https://drive.google.com)
2. Faça login com a conta `daes.ecosol@gmail.com`
3. Clique em **"Novo"** > **"Planilhas Google"** > **"Planilha em branco"**
4. Nomeie a planilha como: `Fundo Municipal - Processos`
5. **Copie o ID da planilha** (está na URL):
   ```
   https://docs.google.com/spreadsheets/d/1ABC123xyz456_DEF789ghi/edit#gid=0
                                              ^^^^^^^^^^^^^^^^^^^^^^^^
                                              ESTE É O ID DA PLANILHA
   ```

### 5.1 Criar Abas e Cabeçalhos

A planilha precisa ter 4 abas. Para criar cada aba:
- Clique no **"+"** na parte inferior para adicionar nova aba
- Renomeie cada aba conforme abaixo

#### **Aba 1: Fichas**
Renomeie a aba para `Fichas` e adicione os cabeçalhos na **linha 1**:

| Coluna A | Coluna B | Coluna C | Coluna D | Coluna E | Coluna F |
|----------|----------|----------|----------|----------|----------|
| id | codigo | descricao | saldo_inicial | saldo_atual | criado_em |

**Exemplo de preenchimento (linha 2):**
```
abc123 | 3.3.90.30 | Material de Consumo | 50000 | 50000 | 2026-05-29T12:00:00Z
```

#### **Aba 2: Processos**
Renomeie a aba para `Processos` e adicione os cabeçalhos na **linha 1**:

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| id | numero | objeto | fornecedor | valor | ficha_id | status | data_emissao | data_pagamento | responsavel | anexos | criado_em | atualizado_em |

**Exemplo de preenchimento (linha 2):**
```
xyz789 | 001/2026 | Compra de material | Empresa XYZ | 1500.00 | abc123 | aprovado | 2026-05-29 | | João Silva | [] | 2026-05-29T12:00:00Z | 2026-05-29T12:00:00Z
```

#### **Aba 3: StatusLog**
Renomeie a aba para `StatusLog` e adicione os cabeçalhos na **linha 1**:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| id | processo_id | status_anterior | status_novo | responsavel_mudanca | data_mudanca |

**Deixe esta aba vazia** - será preenchida automaticamente pelo sistema.

#### **Aba 4: Config**
Renomeie a aba para `Config` e adicione os cabeçalhos na **linha 1**:

| A | B |
|---|---|
| saldo_conta_inicial | 0 |

**Na linha 2, preencha:**
```
saldo_conta_inicial | 500000
```
(Substitua 500000 pelo valor inicial do fundo)

---

## Passo 6: Compartilhar Planilha com Service Account

1. Com a planilha aberta, clique no botão **"Compartilhar"** (canto superior direito)
2. Em **"Adicionar pessoas e grupos"**, cole o email da Service Account:
   ```
   gestao-fundo-sa@gestao-fundo-12345.iam.gserviceaccount.com
   ```
3. Em **"Acesso geral"**, selecione: **Editor**
4. **Desmarque** a opção "Notificar pessoas"
5. Clique em **"Concluído"**

---

## Passo 7: Criar Pasta no Google Drive para Anexos

1. No Google Drive (conta `daes.ecosol@gmail.com`), clique em **"Novo"** > **"Pasta"**
2. Nomeie a pasta como: `Anexos - Processos`
3. Após criar, clique com o botão direito na pasta > **"Compartilhar"**
4. Em **"Adicionar pessoas e grupos"**, cole o email da Service Account:
   ```
   gestao-fundo-sa@gestao-fundo-12345.iam.gserviceaccount.com
   ```
5. Selecione permissão: **Editor**
6. **Desmarque** "Notificar pessoas"
7. Clique em **"Concluído"**

### 7.1 Copiar ID da Pasta
1. Com a pasta selecionada, olhe a URL no navegador:
   ```
   https://drive.google.com/drive/folders/1XYZ789abc123DEF456
                                                ^^^^^^^^^^^^^^^^^^^^^^^
                                                ESTE É O ID DA PASTA
   ```
2. Copie este ID (tudo após `/folders/`)

---

## Passo 8: Configurar Variáveis de Ambiente

No seu projeto, crie um arquivo `.env.local` na raiz:

```bash
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=gestao-fundo-sa@gestao-fundo-12345.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1ABC123xyz456_DEF789ghi
GOOGLE_DRIVE_FOLDER_ID=1XYZ789abc123DEF456
```

### ⚠️ Atenção com o `GOOGLE_PRIVATE_KEY`:

1. Abra o arquivo JSON da Service Account
2. Copie **exatamente** o valor de `private_key`
3. O valor deve incluir as quebras de linha como `\n`
4. Mantenha as aspas duplas no início e fim
5. No arquivo `.env.local`, coloque entre aspas duplas

**Exemplo real:**
```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\n-----END PRIVATE KEY-----\n"
```

---

## Passo 9: Testar Configuração

### 9.1 Instalar dependências e rodar
```bash
npm install
npm run dev
```

### 9.2 Acessar o sistema
- Abra: `http://localhost:3000`
- Navegue até **Fichas de Despesa**
- Tente cadastrar uma nova ficha

### 9.3 Verificar no Google Sheets
1. Abra a planilha `Fundo Municipal - Processos`
2. Vá na aba `Fichas`
3. Uma nova linha deve ter sido adicionada automaticamente!

---

## 🐛 Solução de Problemas

### Erro: "Permissão negada" ou "Unable to access spreadsheet"
- ✅ Verifique se compartilhou a planilha com o email da Service Account
- ✅ Verifique se a Service Account tem permissão de **Editor**
- ✅ Confirme que o `GOOGLE_SHEET_ID` está correto

### Erro: "Private key format is invalid"
- ✅ Verifique se o `GOOGLE_PRIVATE_KEY` está entre aspas duplas
- ✅ Verifique se as quebras de linha estão como `\n` (duas barras invertidas + n)
- ✅ Tente copiar novamente o valor do JSON

### Erro: "Unable to upload file"
- ✅ Verifique se compartilhou a pasta do Drive com a Service Account
- ✅ Confirme que o `GOOGLE_DRIVE_FOLDER_ID` está correto
- ✅ A pasta deve estar no Google Drive da conta `daes.ecosol@gmail.com`

### Dados não aparecem no sistema
- ✅ Verifique se os cabeçalhos das abas estão **exatamente** como especificado
- ✅ Verifique se há dados de exemplo nas abas `Fichas` e `Processos`
- ✅ Os cabeçalhos devem estar na **linha 1**

---

## 📞 Suporte

Se encontrar erros não listados aqui:

1. Verifique os logs no terminal do Next.js
2. Acesse o [Google Cloud Console](https://console.cloud.google.com) > **"APIs e serviços"** > **"Dashboard"** para ver se as APIs estão ativas
3. Consulte a documentação oficial:
   - [Google Sheets API Docs](https://developers.google.com/sheets/api)
   - [Google Drive API Docs](https://developers.google.com/drive/api)

---

## ✅ Checklist Final

- [ ] Projeto `gestao-fundo` criado no Google Cloud
- [ ] Google Sheets API ativada
- [ ] Google Drive API ativada
- [ ] Service Account criada
- [ ] Chave JSON baixada
- [ ] Planilha criada com 4 abas e cabeçalhos
- [ ] Planilha compartilhada com Service Account
- [ ] Pasta de anexos criada no Drive
- [ ] Pasta compartilhada com Service Account
- [ ] Arquivo `.env.local` configurado
- [ ] Teste de cadastro realizado com sucesso

**Parabéns! Configuração concluída! 🎉**