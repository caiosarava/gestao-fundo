export interface Ficha {
  id: string;
  codigo: string;
  descricao: string;
  saldo_inicial: number;
  saldo_atual: number;
  criado_em: string;
}

export interface Processo {
  id: string;
  numero: string;
  objeto: string;
  fornecedor: string;
  valor: number;
  ficha_id: string;
  status: 'aprovado' | 'empenhado' | 'liquidado';
  data_emissao: string;
  data_pagamento?: string;
  responsavel: string;
  anexos: string[];
  criado_em: string;
  atualizado_em: string;
}

export interface StatusLog {
  id: string;
  processo_id: string;
  status_anterior: string;
  status_novo: string;
  responsavel_mudanca: string;
  data_mudanca: string;
}

export interface DashboardData {
  saldo_conta: number;
  total_aprovados: number;
  total_empenhados: number;
  total_liquidados: number;
  restos_a_pagar: number;
  saldo_disponivel: number;
  fichas: Ficha[];
}