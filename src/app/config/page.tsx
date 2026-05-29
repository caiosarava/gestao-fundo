'use client';

import { useEffect, useState } from 'react';

export default function ConfigPage() {
  const [saldo, setSaldo] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState('');

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const res = await fetch('/api/saldo-conta');
        const data = await res.json();
        setSaldo(data.saldo);
        setFormData(data.saldo.toString());
        setLoading(false);
      } catch (error) {
        console.error('Erro:', error);
        setLoading(false);
      }
    };
    fetchSaldo();
  }, []);

  const fetchSaldo = async () => {
    try {
      const res = await fetch('/api/saldo-conta');
      const data = await res.json();
      setSaldo(data.saldo);
      setFormData(data.saldo.toString());
      setLoading(false);
    } catch (error) {
      console.error('Erro:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/saldo-conta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saldo: parseFloat(formData),
        }),
      });

      if (res.ok) {
        fetchSaldo();
        alert('Saldo atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar saldo');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
        <p className="text-gray-600 mt-1">
          Gerencie as configurações do sistema
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Saldo da Conta</h3>
        <p className="text-sm text-gray-600 mb-4">
          Este é o saldo inicial total do Fundo Municipal de Economia Solidária.
          Este valor é usado para calcular o saldo disponível.
        </p>

        <div className="mb-6">
          <p className="text-sm text-gray-600">Saldo Atual:</p>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(saldo)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Novo Saldo
            </label>
            <input
              type="number"
              step="0.01"
              value={formData}
              onChange={(e) => setFormData(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Atualizar Saldo
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Instruções de Configuração</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">1. Fichas de Despesa:</strong>{' '}
            Cadastre as fichas de natureza de despesa na página{' '}
            <a href="/fichas" className="text-blue-600 hover:underline">
              Fichas de Despesa
            </a>
            .
          </p>
          <p>
            <strong className="text-gray-900">2. Processos:</strong>{' '}
            Registre novos processos de contratação e aquisição na página{' '}
            <a href="/processos" className="text-blue-600 hover:underline">
              Processos
            </a>
            .
          </p>
          <p>
            <strong className="text-gray-900">3. Exportação:</strong>{' '}
            Exporte os dados em formato Excel ou CSV diretamente da página de Processos.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          <span aria-hidden="true">ℹ️</span> Sobre o Sistema
        </h3>
        <p className="text-sm text-blue-800">
          Sistema de Gestão do Fundo Municipal de Economia Solidária.
          Desenvolvido para facilitar o acompanhamento de processos de
          contratação e aquisição de recursos.
        </p>
        <p className="text-xs text-blue-600 mt-3">
          Versão 1.0.0 • 2026
        </p>
      </div>
    </div>
  );
}