import { NextRequest, NextResponse } from 'next/server';
import {
  getAllProcessos,
  getProcessoById,
  appendToSheet,
  updateSheet,
  findProcessoRow,
  getFichaById,
  findFichaRow,
} from '@/lib/google-sheets';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const processos = await getAllProcessos();
    return NextResponse.json(processos);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar processos:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar processos',
        message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      numero,
      objeto,
      fornecedor,
      valor,
      ficha_id,
      status,
      data_emissao,
      data_pagamento,
      responsavel,
      anexos,
    } = body;

    if (!numero || !objeto || !fornecedor || !valor || !ficha_id || !status || !data_emissao || !responsavel) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: numero, objeto, fornecedor, valor, ficha_id, status, data_emissao, responsavel' },
        { status: 400 }
      );
    }

    const ficha = await getFichaById(ficha_id);
    if (!ficha) {
      return NextResponse.json(
        { error: 'Ficha não encontrada' },
        { status: 404 }
      );
    }

    if (ficha.saldo_atual < valor) {
      return NextResponse.json(
        { error: 'Saldo insuficiente na ficha' },
        { status: 400 }
      );
    }

    const novoSaldo = ficha.saldo_atual - valor;
    const rowIndex = await findFichaRow(ficha_id);
    
    if (rowIndex) {
      await updateSheet(`Fichas!A${rowIndex}:F${rowIndex}`, [
        [ficha.id, ficha.codigo, ficha.descricao, ficha.saldo_inicial, novoSaldo, ficha.criado_em],
      ]);
    }

    const id = uuidv4();
    const agora = new Date().toISOString();

    await appendToSheet('Processos!A:M', [
      [
        id,
        numero,
        objeto,
        fornecedor,
        valor,
        ficha_id,
        status,
        data_emissao,
        data_pagamento || '',
        responsavel,
        JSON.stringify(anexos || []),
        agora,
        agora,
      ],
    ]);

    const novoProcesso = {
      id,
      numero,
      objeto,
      fornecedor,
      valor,
      ficha_id,
      status,
      data_emissao,
      data_pagamento,
      responsavel,
      anexos: anexos || [],
      criado_em: agora,
      atualizado_em: agora,
    };

    return NextResponse.json(novoProcesso, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar processo:', error);
    return NextResponse.json(
      { error: 'Erro ao criar processo' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      numero,
      objeto,
      fornecedor,
      valor,
      ficha_id,
      status,
      data_emissao,
      data_pagamento,
      responsavel,
      anexos,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID obrigatório' },
        { status: 400 }
      );
    }

    const rowIndex = await findProcessoRow(id);
    if (!rowIndex) {
      return NextResponse.json(
        { error: 'Processo não encontrado' },
        { status: 404 }
      );
    }

    const processo = await getProcessoById(id);
    if (!processo) {
      return NextResponse.json(
        { error: 'Processo não encontrado' },
        { status: 404 }
      );
    }

    const valorAlterado = valor !== undefined && valor !== processo.valor;
    
    if (valorAlterado) {
      const ficha = await getFichaById(ficha_id || processo.ficha_id);
      if (ficha) {
        const diferenca = valor - processo.valor;
        const novoSaldoFicha = ficha.saldo_atual - diferenca;
        const fichaRowIndex = await findFichaRow(ficha.id);
        
        if (fichaRowIndex) {
          await updateSheet(`Fichas!A${fichaRowIndex}:F${fichaRowIndex}`, [
            [ficha.id, ficha.codigo, ficha.descricao, ficha.saldo_inicial, novoSaldoFicha, ficha.criado_em],
          ]);
        }
      }
    }

    const statusAlterado = status && status !== processo.status;
    if (statusAlterado) {
      await appendToSheet('StatusLog!A:F', [
        [
          uuidv4(),
          id,
          processo.status,
          status,
          body.responsavel_mudanca || responsavel,
          new Date().toISOString(),
        ],
      ]);
    }

    await updateSheet(`Processos!A${rowIndex}:M${rowIndex}`, [
      [
        id,
        numero || processo.numero,
        objeto || processo.objeto,
        fornecedor || processo.fornecedor,
        valor !== undefined ? valor : processo.valor,
        ficha_id || processo.ficha_id,
        status || processo.status,
        data_emissao || processo.data_emissao,
        data_pagamento !== undefined ? data_pagamento : processo.data_pagamento,
        responsavel || processo.responsavel,
        JSON.stringify(anexos !== undefined ? anexos : processo.anexos),
        processo.criado_em,
        new Date().toISOString(),
      ],
    ]);

    const updatedProcesso = {
      id,
      numero: numero || processo.numero,
      objeto: objeto || processo.objeto,
      fornecedor: fornecedor || processo.fornecedor,
      valor: valor !== undefined ? valor : processo.valor,
      ficha_id: ficha_id || processo.ficha_id,
      status: status || processo.status,
      data_emissao: data_emissao || processo.data_emissao,
      data_pagamento: data_pagamento !== undefined ? data_pagamento : processo.data_pagamento,
      responsavel: responsavel || processo.responsavel,
      anexos: anexos !== undefined ? anexos : processo.anexos,
      criado_em: processo.criado_em,
      atualizado_em: new Date().toISOString(),
    };

    return NextResponse.json(updatedProcesso);
  } catch (error) {
    console.error('Erro ao atualizar processo:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar processo' },
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

    const processo = await getProcessoById(id);
    if (!processo) {
      return NextResponse.json(
        { error: 'Processo não encontrado' },
        { status: 404 }
      );
    }

    const ficha = await getFichaById(processo.ficha_id);
    if (ficha) {
      const novoSaldo = ficha.saldo_atual + processo.valor;
      const rowIndex = await findFichaRow(ficha.id);
      
      if (rowIndex) {
        await updateSheet(`Fichas!A${rowIndex}:F${rowIndex}`, [
          [ficha.id, ficha.codigo, ficha.descricao, ficha.saldo_inicial, novoSaldo, ficha.criado_em],
        ]);
      }
    }

    const rowIndex = await findProcessoRow(id);
    if (rowIndex) {
      await updateSheet(`Processos!A${rowIndex}:M${rowIndex}`, [
        ['DELETADO', '', '', '', '', '', '', '', '', '', '', '', ''],
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar processo:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar processo' },
      { status: 500 }
    );
  }
}