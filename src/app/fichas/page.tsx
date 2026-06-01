'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Ficha } from '@/types';

export default function FichasPage() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFicha, setEditingFicha] = useState<Ficha | null>(null);
  const [formData, setFormData] = useState({
    numero_ficha: '',
    codigo: '',
    fonte: '',
    descricao: '',
    saldo_inicial: '',
    saldo_atual: '',
  });

  const fetchFichas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fichas');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao carregar fichas');
      }

      setFichas(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchFichas();
  }, [fetchFichas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingFicha ? 'PUT' : 'POST';
      const body = {
        ...formData,
        id: editingFicha?.id,
        saldo_inicial: parseFloat(formData.saldo_inicial),
        saldo_atual: editingFicha ? parseFloat(formData.saldo_atual) : parseFloat(formData.saldo_inicial),
      };

      const res = await fetch('/api/fichas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFormData({ numero_ficha: '', codigo: '', fonte: '', descricao: '', saldo_inicial: '', saldo_atual: '' });
        setShowForm(false);
        setEditingFicha(null);
        fetchFichas();
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleEdit = (ficha: Ficha) => {
    setEditingFicha(ficha);
    setFormData({
      numero_ficha: ficha.numero_ficha,
      codigo: ficha.codigo,
      fonte: ficha.fonte,
      descricao: ficha.descricao,
      saldo_inicial: ficha.saldo_inicial.toString(),
      saldo_atual: ficha.saldo_atual.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ficha?')) return;

    try {
      const res = await fetch(`/api/fichas?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchFichas();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const formatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  const formatCurrency = useCallback((value: number) => {
    return formatter.format(value);
  }, [formatter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500" role="status">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-red-800 font-bold mb-2">Erro ao carregar fichas</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => fetchFichas()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fichas de Despesa</h2>
          <p className="text-gray-600 mt-1">
            Gerencie as fichas de natureza de despesa
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              setEditingFicha(null);
              setFormData({ numero_ficha: '', codigo: '', fonte: '', descricao: '', saldo_inicial: '', saldo_atual: '' });
            }
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancelar' : 'Nova Ficha'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingFicha ? 'Editar Ficha' : 'Nova Ficha'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="numero_ficha" className="block text-sm font-medium text-gray-700 mb-1">
                  Nº da ficha
                </label>
                <input
                  id="numero_ficha"
                  type="text"
                  value={formData.numero_ficha}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_ficha: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 123"
                  required
                />
              </div>
              <div>
                <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
              <input
                id="codigo"
                type="text"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 3.3.90.30"
                required
              />
            </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fonte" className="block text-sm font-medium text-gray-700 mb-1">
                  Fonte
                </label>
                <input
                  id="fonte"
                  type="text"
                  value={formData.fonte}
                  onChange={(e) =>
                    setFormData({ ...formData, fonte: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 1500"
                  required
                />
              </div>
              <div>
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  id="descricao"
                  type="text"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição da natureza de despesa"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="saldo_inicial" className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Inicial
                </label>
                <input
                  id="saldo_inicial"
                  type="number"
                  step="0.01"
                  value={formData.saldo_inicial}
                  onChange={(e) =>
                    setFormData({ ...formData, saldo_inicial: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              {editingFicha && (
                <div>
                  <label htmlFor="saldo_atual" className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Atual
                  </label>
                  <input
                    id="saldo_atual"
                    type="number"
                    step="0.01"
                    value={formData.saldo_atual}
                    onChange={(e) =>
                      setFormData({ ...formData, saldo_atual: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              {editingFicha ? 'Atualizar Ficha' : 'Salvar Ficha'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nº Ficha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fonte
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Descrição
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Saldo Inicial
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Saldo Atual
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fichas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma ficha cadastrada
                </td>
              </tr>
            ) : (
              fichas.map((ficha) => (
                <tr key={ficha.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {ficha.numero_ficha}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ficha.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ficha.fonte}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ficha.descricao}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">
                    {formatCurrency(ficha.saldo_inicial)}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-right font-semibold ${
                      ficha.saldo_atual < ficha.saldo_inicial * 0.2
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(ficha.saldo_atual)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {ficha.saldo_atual < ficha.saldo_inicial * 0.2 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Baixo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(ficha)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(ficha.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}