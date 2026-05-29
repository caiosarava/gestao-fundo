import { NextResponse } from 'next/server';
import { getAllProcessos, getAllFichas, getSaldoConta } from '@/lib/google-sheets';

export async function GET() {
  try {
    const [processos, fichas, saldoConta] = await Promise.all([
      getAllProcessos(),
      getAllFichas(),
      getSaldoConta(),
    ]);

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
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
}