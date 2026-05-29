import { NextResponse } from 'next/server';
import { getBatchSheetData } from '@/lib/google-sheets';
import { Ficha, Processo } from '@/types';

export async function GET() {
  try {
    const ranges = ['Processos!A:M', 'Fichas!A:F', 'Config!A:B'];
    const batchData = await getBatchSheetData(ranges);

    const processosData = batchData.get('Processos!A:M') || [];
    const fichasData = batchData.get('Fichas!A:F') || [];
    const configData = batchData.get('Config!A:B') || [];

    const processos: Processo[] = processosData.length <= 1 ? [] : processosData.slice(1).map((row: string[]) => {
      let anexos = [];
      try {
        anexos = row[10] ? JSON.parse(row[10]) : [];
      } catch {
        anexos = [];
      }
      return {
        id: row[0] || '',
        numero: row[1] || '',
        objeto: row[2] || '',
        fornecedor: row[3] || '',
        valor: parseFloat(row[4]) || 0,
        ficha_id: row[5] || '',
        status: (row[6] as Processo['status']) || 'aprovado',
        data_emissao: row[7] || '',
        data_pagamento: row[8] || '',
        responsavel: row[9] || '',
        anexos,
        criado_em: row[11] || '',
        atualizado_em: row[12] || '',
      };
    });

    const fichas: Ficha[] = fichasData.length <= 1 ? [] : fichasData.slice(1).map((row: string[]) => ({
      id: row[0] || '',
      codigo: row[1] || '',
      descricao: row[2] || '',
      saldo_inicial: parseFloat(row[3]) || 0,
      saldo_atual: parseFloat(row[4]) || 0,
      criado_em: row[5] || '',
    }));

    const saldoRow = configData.find((row: string[]) => row[0] === 'saldo_conta_inicial');
    const saldoConta = saldoRow ? parseFloat(saldoRow[1]) || 0 : 0;

    let totalAprovados = 0;
    let totalEmpenhados = 0;
    let totalLiquidados = 0;

    // Redução do número de iterações sobre o array de processos de 4 para 1.
    for (const p of processos) {
      if (p.status === 'aprovado') {
        totalAprovados += p.valor;
      } else if (p.status === 'empenhado') {
        totalEmpenhados += p.valor;
      } else if (p.status === 'liquidado') {
        totalLiquidados += p.valor;
      }
    }

    const restosAPagar = totalAprovados + totalEmpenhados;

    const saldoDisponivel = saldoConta - (totalAprovados + totalEmpenhados + totalLiquidados);

    return NextResponse.json({
      saldo_conta: saldoConta,
      total_aprovados: totalAprovados,
      total_empenhados: totalEmpenhados,
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