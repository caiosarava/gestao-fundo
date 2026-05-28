'use client';

import { useEffect, useState } from 'react';
import { DashboardData } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-red-600">
        Erro ao carregar dados do dashboard
      </div>
    );
  }

  const cards = [
    {
      title: 'Saldo da Conta',
      value: data.saldo_conta,
      icon: '💰',
      color: 'blue',
    },
    {
      title: 'Aprovados',
      value: data.total_aprovados,
      icon: '✅',
      color: 'green',
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
      color: 'blue',
    },
    {
      title: 'Restos a Pagar',
      value: data.restos_a_pagar,
      icon: '⏳',
      color: 'orange',
    },
    {
      title: 'Saldo Disponível',
      value: data.saldo_disponivel,
      icon: '🟢',
      color: 'emerald',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Visão geral do Fundo Municipal de Economia Solidária
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-lg border-2 p-6 ${colorClasses[card.color as keyof typeof colorClasses]}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{card.title}</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(card.value)}
                </p>
              </div>
              <span className="text-4xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Saldo das Fichas de Despesa
          </h3>
          <div className="space-y-3">
            {data.fichas.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Nenhuma ficha cadastrada
              </p>
            ) : (
              data.fichas.map((ficha) => (
                <div
                  key={ficha.id}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{ficha.codigo}</p>
                    <p className="text-sm text-gray-600">{ficha.descricao}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        ficha.saldo_atual < ficha.saldo_inicial * 0.2
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(ficha.saldo_atual)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Inicial: {formatCurrency(ficha.saldo_inicial)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumo por Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <span className="text-gray-700">Aprovados</span>
              </div>
              <span className="font-semibold text-green-600">
                {formatCurrency(data.total_aprovados)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔒</span>
                <span className="text-gray-700">Empenhados</span>
              </div>
              <span className="font-semibold text-yellow-600">
                {formatCurrency(data.total_empenhados)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✔️</span>
                <span className="text-gray-700">Liquidados</span>
              </div>
              <span className="font-semibold text-blue-600">
                {formatCurrency(data.total_liquidados)}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⏳</span>
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