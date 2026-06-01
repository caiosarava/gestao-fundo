import { NextRequest, NextResponse } from 'next/server';
import { getAllFichas, getFichaById, appendToSheet, updateSheet, findFichaRow } from '@/lib/google-sheets';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const fichas = await getAllFichas();
    return NextResponse.json(fichas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar fichas:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar fichas',
        message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID obrigatório' },
        { status: 400 }
      );
    }

    const ficha = await getFichaById(id);
    if (!ficha) {
      return NextResponse.json(
        { error: 'Ficha não encontrada' },
        { status: 404 }
      );
    }

    const rowIndex = await findFichaRow(id);
    if (rowIndex) {
      await updateSheet(`Fichas!A${rowIndex}:H${rowIndex}`, [
        ['DELETADO', '', '', '', '', '', '', ''],
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar ficha:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar ficha' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numero_ficha, codigo, fonte, descricao, saldo_inicial } = body;

    if (!numero_ficha || !codigo || !fonte || !descricao || saldo_inicial === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: numero_ficha, codigo, fonte, descricao, saldo_inicial' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const criado_em = new Date().toISOString();

    await appendToSheet('Fichas!A:H', [
      [id, numero_ficha, codigo, fonte, descricao, saldo_inicial, saldo_inicial, criado_em],
    ]);

    const novaFicha = {
      id,
      numero_ficha,
      codigo,
      fonte,
      descricao,
      saldo_inicial,
      saldo_atual: saldo_inicial,
      criado_em,
    };

    return NextResponse.json(novaFicha, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar ficha:', error);
    return NextResponse.json(
      { error: 'Erro ao criar ficha' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, numero_ficha, codigo, fonte, descricao, saldo_inicial, saldo_atual } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID obrigatório' },
        { status: 400 }
      );
    }

    const rowIndex = await findFichaRow(id);
    if (!rowIndex) {
      return NextResponse.json(
        { error: 'Ficha não encontrada' },
        { status: 404 }
      );
    }

    const ficha = await getFichaById(id);
    if (!ficha) {
      return NextResponse.json(
        { error: 'Ficha não encontrada' },
        { status: 404 }
      );
    }

    await updateSheet(`Fichas!A${rowIndex}:H${rowIndex}`, [
      [
        id,
        numero_ficha || ficha.numero_ficha,
        codigo || ficha.codigo,
        fonte || ficha.fonte,
        descricao || ficha.descricao,
        saldo_inicial !== undefined ? saldo_inicial : ficha.saldo_inicial,
        saldo_atual !== undefined ? saldo_atual : ficha.saldo_atual,
        ficha.criado_em,
      ],
    ]);

    const updatedFicha = {
      id,
      numero_ficha: numero_ficha || ficha.numero_ficha,
      codigo: codigo || ficha.codigo,
      fonte: fonte || ficha.fonte,
      descricao: descricao || ficha.descricao,
      saldo_inicial: saldo_inicial !== undefined ? saldo_inicial : ficha.saldo_inicial,
      saldo_atual: saldo_atual !== undefined ? saldo_atual : ficha.saldo_atual,
      criado_em: ficha.criado_em,
    };

    return NextResponse.json(updatedFicha);
  } catch (error) {
    console.error('Erro ao atualizar ficha:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar ficha' },
      { status: 500 }
    );
  }
}