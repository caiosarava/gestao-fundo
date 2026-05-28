import { NextRequest, NextResponse } from 'next/server';
import { getAllProcessos, getAllFichas, getSaldoConta } from '@/lib/google-sheets';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xlsx';
    const fichaId = searchParams.get('ficha_id');
    const status = searchParams.get('status');

    const processos = await getAllProcessos();
    const fichas = await getAllFichas();

    let filtered = processos;
    if (fichaId) {
      filtered = filtered.filter(p => p.ficha_id === fichaId);
    }
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }

    const fichaMap = new Map(fichas.map(f => [f.id, f.codigo]));

    const data = filtered.map(p => ({
      'ID Processo': p.id,
      'Número': p.numero,
      'Objeto': p.objeto,
      'Fornecedor': p.fornecedor,
      'Valor (R$)': p.valor,
      'Ficha Código': fichaMap.get(p.ficha_id) || p.ficha_id,
      'Status': p.status,
      'Data Emissão': p.data_emissao,
      'Data Pagamento': p.data_pagamento || '',
      'Responsável': p.responsavel,
      'Criado Em': p.criado_em,
      'Atualizado Em': p.atualizado_em,
    }));

    if (format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="processos.csv"',
        },
      });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Processos');

    const resumoData = [
      ['RESUMO DO FUNDO'],
      ['Saldo Inicial da Conta', await getSaldoConta()],
      ['Total de Processos', filtered.length],
      ['Total Aprovados', filtered.filter(p => p.status === 'aprovado').reduce((sum, p) => sum + p.valor, 0)],
      ['Total Empenhados', filtered.filter(p => p.status === 'empenhado').reduce((sum, p) => sum + p.valor, 0)],
      ['Total Liquidados', filtered.filter(p => p.status === 'liquidado').reduce((sum, p) => sum + p.valor, 0)],
      ['Restos a Pagar', filtered.filter(p => ['aprovado', 'empenhado'].includes(p.status)).reduce((sum, p) => sum + p.valor, 0)],
    ];

    const resumoWorksheet = XLSX.utils.json_to_sheet(
      resumoData.map(([label, value]) => ({ Descrição: label, Valor: value }))
    );
    XLSX.utils.book_append_sheet(workbook, resumoWorksheet, 'Resumo');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="processos_fundo.xlsx"',
      },
    });
  } catch (error) {
    console.error('Erro na exportação:', error);
    return NextResponse.json(
      { error: 'Erro na exportação' },
      { status: 500 }
    );
  }
}