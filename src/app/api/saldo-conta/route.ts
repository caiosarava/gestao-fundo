import { NextRequest, NextResponse } from 'next/server';
import { getSaldoConta, updateSaldoConta } from '@/lib/google-sheets';

export async function GET() {
  try {
    const saldo = await getSaldoConta();
    return NextResponse.json({ saldo });
  } catch (error) {
    console.error('Erro ao buscar saldo da conta:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar saldo da conta' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { saldo } = body;

    if (saldo === undefined) {
      return NextResponse.json(
        { error: 'Saldo obrigatório' },
        { status: 400 }
      );
    }

    await updateSaldoConta(saldo);

    return NextResponse.json({ success: true, saldo });
  } catch (error) {
    console.error('Erro ao atualizar saldo da conta:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar saldo da conta' },
      { status: 500 }
    );
  }
}