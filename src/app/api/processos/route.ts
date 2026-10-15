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
      status: reqStatus,
      data_emissao,
      data_pagamento,
      responsavel,
      anexos,
      pagamentos,
    } = body;
    let status = reqStatus;

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
      await updateSheet(`Fichas!A${rowIndex}:H${rowIndex}`, [
        [
          ficha.id,
          ficha.numero_ficha,
          ficha.codigo,
          ficha.fonte,
          ficha.descricao,
          ficha.saldo_inicial,
          novoSaldo,
          ficha.criado_em,
        ],
      ]);
    }

    const totalPago = Array.isArray(pagamentos)
      ? pagamentos.reduce((acc: number, p: { valor: number }) => acc + (Number(p.valor) || 0), 0)
      : 0;

    if (totalPago >= valor && valor > 0) {
      status = 'liquidado';
    }

    const id = uuidv4();
    const agora = new Date().toISOString();

    await appendToSheet('Processos!A:N', [
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
        JSON.stringify(pagamentos || []),
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
      pagamentos: pagamentos || [],
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
      status: reqStatus,
      data_emissao,
      data_pagamento,
      responsavel,
      anexos,
      pagamentos,
    } = body;
    let status = reqStatus;

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
          await updateSheet(`Fichas!A${fichaRowIndex}:H${fichaRowIndex}`, [
            [
              ficha.id,
              ficha.numero_ficha,
              ficha.codigo,
              ficha.fonte,
              ficha.descricao,
              ficha.saldo_inicial,
              novoSaldoFicha,
              ficha.criado_em,
            ],
          ]);
        }
      }
    }

    const novoValor = valor !== undefined ? valor : processo.valor;
    const novosPagamentos = pagamentos !== undefined ? pagamentos : (processo.pagamentos || []);
    const totalPago = Array.isArray(novosPagamentos)
      ? novosPagamentos.reduce((acc: number, p: { valor: number }) => acc + (Number(p.valor) || 0), 0)
      : 0;

    if (totalPago >= novoValor && novoValor > 0) {
      status = 'liquidado';
    }

    const novoStatus = status || processo.status;
    const statusAlterado = novoStatus !== processo.status;
    if (statusAlterado) {
      await appendToSheet('StatusLog!A:F', [
        [
          uuidv4(),
          id,
          processo.status,
          novoStatus,
          body.responsavel_mudanca || responsavel || processo.responsavel,
          new Date().toISOString(),
        ],
      ]);
    }

    await updateSheet(`Processos!A${rowIndex}:N${rowIndex}`, [
      [
        id,
        numero || processo.numero,
        objeto || processo.objeto,
        fornecedor || processo.fornecedor,
        novoValor,
        ficha_id || processo.ficha_id,
        novoStatus,
        data_emissao || processo.data_emissao,
        data_pagamento !== undefined ? data_pagamento : processo.data_pagamento,
        responsavel || processo.responsavel,
        JSON.stringify(anexos !== undefined ? anexos : processo.anexos),
        processo.criado_em,
        new Date().toISOString(),
        JSON.stringify(novosPagamentos),
      ],
    ]);

    const updatedProcesso = {
      id,
      numero: numero || processo.numero,
      objeto: objeto || processo.objeto,
      fornecedor: fornecedor || processo.fornecedor,
      valor: novoValor,
      ficha_id: ficha_id || processo.ficha_id,
      status: novoStatus,
      data_emissao: data_emissao || processo.data_emissao,
      data_pagamento: data_pagamento !== undefined ? data_pagamento : processo.data_pagamento,
      responsavel: responsavel || processo.responsavel,
      anexos: anexos !== undefined ? anexos : processo.anexos,
      pagamentos: novosPagamentos,
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
        await updateSheet(`Fichas!A${rowIndex}:H${rowIndex}`, [
          [
            ficha.id,
            ficha.numero_ficha,
            ficha.codigo,
            ficha.fonte,
            ficha.descricao,
            ficha.saldo_inicial,
            novoSaldo,
            ficha.criado_em,
          ],
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