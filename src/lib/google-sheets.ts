import { google, sheets_v4, drive_v3 } from 'googleapis';
import { Ficha, Processo } from '@/types';

let sheetInstance: sheets_v4.Sheets | null = null;
let driveInstance: drive_v3.Drive | null = null;

const CACHE_TTL = 30 * 1000; // 30 segundos
const cache = new Map<string, { data: string[][]; timestamp: number }>();
const inflightRequests = new Map<string, Promise<string[][]>>();

export function clearCache() {
  cache.clear();
}

function validateEnv() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !key || !sheetId) {
    const missing = [];
    if (!email) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    if (!key) missing.push('GOOGLE_PRIVATE_KEY');
    if (!sheetId) missing.push('GOOGLE_SHEET_ID');

    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }

  // Remove aspas extras que podem vir do Vercel/env e resolve quebras de linha
  key = key.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

  return { email, key, sheetId };
}

export async function getGoogleSheets(): Promise<sheets_v4.Sheets> {
  if (sheetInstance) return sheetInstance;

  const { email, key } = validateEnv();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetInstance = google.sheets({ version: 'v4', auth });
  return sheetInstance;
}

export async function getGoogleDrive(): Promise<drive_v3.Drive> {
  if (driveInstance) return driveInstance;

  const { email, key } = validateEnv();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  driveInstance = google.drive({ version: 'v3', auth });
  return driveInstance;
}

export function getSpreadsheetId() {
  return process.env.GOOGLE_SHEET_ID || '';
}

export function getDriveFolderId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || '';
}

export async function getSheetData(range: string): Promise<string[][]> {
  const now = Date.now();
  const cached = cache.get(range);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const existingRequest = inflightRequests.get(range);
  if (existingRequest) {
    return existingRequest;
  }

  const fetchPromise = (async () => {
    try {
      const sheets = await getGoogleSheets();
      const spreadsheetId = getSpreadsheetId();

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = (response.data.values as string[][]) || [];
      cache.set(range, { data: values, timestamp: Date.now() });
      return values;
    } finally {
      inflightRequests.delete(range);
    }
  })();

  inflightRequests.set(range, fetchPromise);
  return fetchPromise;
}

/**
 * Busca múltiplos intervalos de dados em uma única chamada de API (Batch).
 * Reduz a latência de rede e evita atingir limites de cota da API.
 */
export async function getBatchSheetData(ranges: string[]): Promise<Map<string, string[][]>> {
  const now = Date.now();
  const results = new Map<string, string[][]>();
  const rangesToFetch: string[] = [];

  for (const range of ranges) {
    const cached = cache.get(range);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      results.set(range, cached.data);
    } else {
      rangesToFetch.push(range);
    }
  }

  if (rangesToFetch.length === 0) {
    return results;
  }

  // Por simplicidade na primeira iteração de batching, não usamos inflightRequests para o lote todo,
  // mas o cache individual ainda será respeitado e preenchido.
  const sheets = await getGoogleSheets();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: rangesToFetch,
  });

  const valueRanges = response.data.valueRanges || [];
  valueRanges.forEach((vr, index) => {
    const rangeName = rangesToFetch[index];
    const values = (vr.values as string[][]) || [];
    cache.set(rangeName, { data: values, timestamp: Date.now() });
    results.set(rangeName, values);
  });

  return results;
}

export async function appendToSheet(
  range: string,
  values: (string | number | boolean) [][]
): Promise<void> {
  const sheets = await getGoogleSheets();
  const spreadsheetId = getSpreadsheetId();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  clearCache();
}

export async function updateSheet(
  range: string,
  values: (string | number | boolean) [][]
): Promise<void> {
  const sheets = await getGoogleSheets();
  const spreadsheetId = getSpreadsheetId();

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  clearCache();
}

export async function getAllFichas(): Promise<Ficha[]> {
  const data = await getSheetData('Fichas!A:F');
  
  if (data.length <= 1) return [];

  return data.slice(1).map((row: string[]) => ({
    id: row[0] || '',
    codigo: row[1] || '',
    descricao: row[2] || '',
    saldo_inicial: parseFloat(row[3]) || 0,
    saldo_atual: parseFloat(row[4]) || 0,
    criado_em: row[5] || '',
  }));
}

export async function getAllProcessos(): Promise<Processo[]> {
  const data = await getSheetData('Processos!A:M');
  
  if (data.length <= 1) return [];

  return data.slice(1).map((row: string[]) => {
    let anexos = [];
    try {
      anexos = row[10] ? JSON.parse(row[10]) : [];
    } catch (e) {
      console.error(`Erro ao parsear anexos para o processo ${row[0]}:`, e);
      anexos = [];
    }

    return {
      id: row[0] || '',
      numero: row[1] || '',
      objeto: row[2] || '',
      fornecedor: row[3] || '',
      valor: parseFloat(row[4]) || 0,
      ficha_id: row[5] || '',
      status: (row[6] as 'aprovado' | 'empenhado' | 'liquidado') || 'aprovado',
      data_emissao: row[7] || '',
      data_pagamento: row[8] || '',
      responsavel: row[9] || '',
      anexos,
      criado_em: row[11] || '',
      atualizado_em: row[12] || '',
    };
  });
}

export async function getFichaById(id: string): Promise<Ficha | null> {
  const fichas = await getAllFichas();
  return fichas.find(f => f.id === id) || null;
}

export async function getProcessoById(id: string): Promise<Processo | null> {
  const processos = await getAllProcessos();
  return processos.find(p => p.id === id) || null;
}

export async function findFichaRow(id: string): Promise<number | null> {
  const data = await getSheetData('Fichas!A:A');
  const rowIndex = data.findIndex((row: string[]) => row[0] === id);
  return rowIndex > 0 ? rowIndex + 1 : null;
}

export async function findProcessoRow(id: string): Promise<number | null> {
  const data = await getSheetData('Processos!A:A');
  const rowIndex = data.findIndex((row: string[]) => row[0] === id);
  return rowIndex > 0 ? rowIndex + 1 : null;
}

export async function getSaldoConta(): Promise<number> {
  const data = await getSheetData('Config!A:B');
  const saldoRow = data.find((row: string[]) => row[0] === 'saldo_conta_inicial');
  return saldoRow ? parseFloat(saldoRow[1]) || 0 : 0;
}

export async function updateSaldoConta(valor: number): Promise<void> {
  const sheets = await getGoogleSheets();
  const spreadsheetId = getSpreadsheetId();
  
  const data = await getSheetData('Config!A:B');
  const rowIndex = data.findIndex((row: string[]) => row[0] === 'saldo_conta_inicial');
  
  if (rowIndex >= 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Config!B${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[valor]] },
    });
    clearCache();
  } else {
    await appendToSheet('Config!A:B', [['saldo_conta_inicial', valor]]);
  }
}