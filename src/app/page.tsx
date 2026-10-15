'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardData } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  const formatCurrency = useCallback((value: number) => {
    return formatter.format(value);
  }, [formatter]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Falha ao carregar dados');
        }
        return res.json();
      })
      .then((data) => {
        setData(data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500" role="status">Carregando...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-red-800 font-bold mb-2">Erro ao carregar dados do dashboard</h3>
        <p className="text-red-600 text-sm">{error || 'Dados indisponíveis'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: 'Saldo Inicial',
      value: data.saldo_conta,
      icon: '🏛️',
      color: 'brandBlue',
    },
    {
      title: 'Saldo Disponível',
      value: data.saldo_disponivel,
      icon: '🟢',
      color: 'brandGreen',
    },
    {
      title: 'Empenhados',
      value: data.total_empenhados,
      icon: '🔒',
      color: 'yellow',
    },
    {
      title: 'Liquidados',
      value: data.total_liquidados,
      icon: '✔️',
      color: 'brandBlueLight',
    },
    {
      title: 'Restos a Pagar',
      value: data.restos_a_pagar,
      icon: '⏳',
      color: 'orange',
    },
  ];

  const colorClasses = {
    brandBlue: 'bg-white border-brand-blue-dark text-brand-blue-dark shadow-sm',
    brandGreen: 'bg-brand-green-dark border-brand-green-dark text-white shadow-md',
    brandGreenLight: 'bg-green-50 border-green-200 text-green-700',
    brandBlueLight: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className="space-y-10">
      <div className="border-b pb-4">
        <h2 className="text-3xl font-black text-brand-blue-dark">Dashboard Financeiro</h2>
        <p className="text-gray-500 mt-1 font-medium">
          Monitoramento em tempo real do Fundo Municipal de Economia Solidária
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">{card.title}</p>
                <p className="text-3xl font-black mt-3 tabular-nums">
                  {formatCurrency(card.value)}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner">
                <span className="text-3xl" aria-hidden="true">{card.icon}</span>
              </div>
            </div>
            {card.title === 'Saldo Disponível' && (
              <div className="mt-6">
                <div className="w-full bg-black/10 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (data.saldo_disponivel / data.saldo_conta) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] mt-2 font-bold uppercase opacity-80 tracking-tighter">
                  {Math.round((data.saldo_disponivel / data.saldo_conta) * 100)}% do recurso total disponível
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-brand-blue-dark">
              Saldo das Fichas
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded border">Detalhamento</span>
          </div>
          <div className="space-y-6">
            {(!data.fichas || data.fichas.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 italic">
                <span className="text-4xl mb-2">📁</span>
                <p>Nenhuma ficha cadastrada</p>
              </div>
            ) : (
              data.fichas.map((ficha) => (
                <div key={ficha.id} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-bold text-brand-blue-dark uppercase tracking-tight">{ficha.codigo}</p>
                      <p className="text-sm text-gray-500 font-medium line-clamp-1">{ficha.descricao}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black tabular-nums ${
                        ficha.saldo_atual < ficha.saldo_inicial * 0.2 ? 'text-red-600' : 'text-brand-green-dark'
                      }`}>
                        {formatCurrency(ficha.saldo_atual)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        ficha.saldo_atual < ficha.saldo_inicial * 0.2 ? 'bg-red-500' : 'bg-brand-green-light'
                      }`}
                      style={{ width: `${Math.min(100, (ficha.saldo_atual / ficha.saldo_inicial) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-brand-blue-dark">
              Resumo por Status
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded border">Fluxo de Caixa</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl" aria-hidden="true">🔒</span>
                <span className="text-gray-700">Empenhados</span>
              </div>
              <span className="font-semibold text-yellow-600">
                {formatCurrency(data.total_empenhados)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl" aria-hidden="true">✔️</span>
                <span className="text-gray-700">Liquidados</span>
              </div>
              <span className="font-semibold text-blue-600">
                {formatCurrency(data.total_liquidados)}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl" aria-hidden="true">⏳</span>
                  <span className="text-gray-700 font-medium">
                    Restos a Pagar
                  </span>
                </div>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(data.restos_a_pagar)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
