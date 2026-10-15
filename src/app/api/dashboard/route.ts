import { NextResponse } from 'next/server';
import { getBatchSheetData, parseNumber } from '@/lib/google-sheets';
import { Ficha, Processo } from '@/types';

export async function GET() {
  try {
    const ranges = ['Processos!A:N', 'Fichas!A:H', 'Config!A:B'];
    const batchData = await getBatchSheetData(ranges);

    const processosData = batchData.get('Processos!A:N') || [];
    const fichasData = batchData.get('Fichas!A:H') || [];
    const configData = batchData.get('Config!A:B') || [];

    const processos: Processo[] = processosData.length <= 1 ? [] : processosData.slice(1)
      .filter(row => row[0] && row[0] !== 'DELETADO')
      .map((row: string[]) => {
        let anexos = [];
        try {
          anexos = row[10] ? JSON.parse(row[10]) : [];
        } catch {
          anexos = [];
        }
        let pagamentos = [];
        try {
          pagamentos = row[13] ? JSON.parse(row[13]) : [];
        } catch {
          pagamentos = [];
        }
        return {
          id: row[0] || '',
          numero: row[1] || '',
          objeto: row[2] || '',
          fornecedor: row[3] || '',
          valor: parseNumber(row[4]),
          ficha_id: row[5] || '',
          status: (row[6] as Processo['status']) || 'aprovado',
          data_emissao: row[7] || '',
          data_pagamento: row[8] || '',
          responsavel: row[9] || '',
          anexos,
          pagamentos,
          criado_em: row[11] || '',
          atualizado_em: row[12] || '',
        };
      });

    const fichas: Ficha[] = fichasData.length <= 1 ? [] : fichasData.slice(1)
      .filter(row => row[0] && row[0] !== 'DELETADO')
      .map((row: string[]) => ({
        id: row[0] || '',
        numero_ficha: row[1] || '',
        codigo: row[2] || '',
        fonte: row[3] || '',
        descricao: row[4] || '',
        saldo_inicial: parseNumber(row[5]),
        saldo_atual: parseNumber(row[6]),
        criado_em: row[7] || '',
      }));

    const saldoRow = configData.find((row: string[]) => row[0] === 'saldo_conta_inicial');
    const saldoConta = saldoRow ? parseNumber(saldoRow[1]) : 0;

    let totalEmpenhados = 0;
    let totalLiquidadosParcial = 0;
    let totalLiquidados = 0;
    let restosAPagar = 0;

    for (const p of processos) {
      const pago = (p.pagamentos || []).reduce((sum, item) => sum + (item.valor || 0), 0);
      const saldoPendente = Math.max(0, p.valor - pago);
      restosAPagar += saldoPendente;

      if (p.status === 'empenhado') {
        totalEmpenhados += p.valor;
      } else if (p.status === 'liquidado_parcial') {
        totalLiquidadosParcial += pago;
      } else if (p.status === 'liquidado') {
        // Se totalmente liquidado, valor pago é p.valor (ou pago)
        totalLiquidados += pago > 0 ? pago : p.valor;
      }
    }

    const saldoDisponivel = saldoConta - (totalLiquidados + totalLiquidadosParcial);

    return NextResponse.json({
      saldo_conta: saldoConta,
      total_empenhados: totalEmpenhados,
      total_liquidados_parcial: totalLiquidadosParcial,
      total_liquidados: totalLiquidados,
      restos_a_pagar: restosAPagar,
      saldo_disponivel: saldoDisponivel,
      fichas,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar dados do dashboard',
        message
      },
      { status: 500 }
    );
  }
}