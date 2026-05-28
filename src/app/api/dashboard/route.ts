import { NextResponse } from 'next/server';
import { getAllProcessos, getAllFichas, getSaldoConta } from '@/lib/google-sheets';

export async function GET() {
  try {
    const [processos, fichas, saldoConta] = await Promise.all([
      getAllProcessos(),
      getAllFichas(),
      getSaldoConta(),
    ]);

    const totalAprovados = processos
      .filter(p => p.status === 'aprovado')
      .reduce((sum, p) => sum + p.valor, 0);

    const totalEmpenhados = processos
      .filter(p => p.status === 'empenhado')
      .reduce((sum, p) => sum + p.valor, 0);

    const totalLiquidados = processos
      .filter(p => p.status === 'liquidado')
      .reduce((sum, p) => sum + p.valor, 0);

    const restosAPagar = processos
      .filter(p => ['aprovado', 'empenhado'].includes(p.status))
      .reduce((sum, p) => sum + p.valor, 0);

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