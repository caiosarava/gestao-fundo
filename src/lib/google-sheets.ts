import { google } from 'googleapis';
import { Ficha, Processo, StatusLog } from '@/types';

let sheetInstance: any = null;
let driveInstance: any = null;

const CACHE_TTL = 30 * 1000; // 30 segundos
const cache = new Map<string, { data: any[][]; timestamp: number }>();
const inflightRequests = new Map<string, Promise<any[][]>>();

export function clearCache() {
  cache.clear();
}

export async function getGoogleSheets() {
  if (sheetInstance) return sheetInstance;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetInstance = google.sheets({ version: 'v4', auth });
  return sheetInstance;
}

export async function getGoogleDrive() {
  if (driveInstance) return driveInstance;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

export async function getSheetData(range: string): Promise<any[][]> {
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

      const values = response.data.values || [];
      cache.set(range, { data: values, timestamp: Date.now() });
      return values;
    } finally {
      inflightRequests.delete(range);
    }
  })();

  inflightRequests.set(range, fetchPromise);
  return fetchPromise;
}

export async function appendToSheet(
  range: string,
  values: any[][]
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
  values: any[][]
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

  return data.slice(1).map((row: any[]) => ({
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

  return data.slice(1).map((row: any[]) => ({
    id: row[0] || '',
    numero: row[1] || '',
    objeto: row[2] || '',
    fornecedor: row[3] || '',
    valor: parseFloat(row[4]) || 0,
    ficha_id: row[5] || '',
    status: row[6] || 'aprovado',
    data_emissao: row[7] || '',
    data_pagamento: row[8] || '',
    responsavel: row[9] || '',
    anexos: row[10] ? JSON.parse(row[10]) : [],
    criado_em: row[11] || '',
    atualizado_em: row[12] || '',
  }));
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
  const rowIndex = data.findIndex((row: any[]) => row[0] === id);
  return rowIndex > 0 ? rowIndex + 1 : null;
}

export async function findProcessoRow(id: string): Promise<number | null> {
  const data = await getSheetData('Processos!A:A');
  const rowIndex = data.findIndex((row: any[]) => row[0] === id);
  return rowIndex > 0 ? rowIndex + 1 : null;
}

export async function getSaldoConta(): Promise<number> {
  const data = await getSheetData('Config!A:B');
  const saldoRow = data.find((row: any[]) => row[0] === 'saldo_conta_inicial');
  return saldoRow ? parseFloat(saldoRow[1]) || 0 : 0;
}

export async function updateSaldoConta(valor: number): Promise<void> {
  const sheets = await getGoogleSheets();
  const spreadsheetId = getSpreadsheetId();
  
  const data = await getSheetData('Config!A:B');
  const rowIndex = data.findIndex((row: any[]) => row[0] === 'saldo_conta_inicial');
  
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