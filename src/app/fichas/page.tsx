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
          className={`${showForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-brand-blue-dark hover:bg-blue-900'} text-white px-4 py-2 rounded-lg transition font-medium`}
        >
          {showForm ? 'Cancelar' : 'Nova Ficha'}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-3xl animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-brand-blue-dark">
                {editingFicha ? '📝 Editar Ficha' : '📋 Nova Ficha'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-blue-dark uppercase tracking-wider border-b pb-2">Identificação</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="numero_ficha" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Nº da ficha
                      </label>
                      <input
                        id="numero_ficha"
                        type="text"
                        value={formData.numero_ficha}
                        onChange={(e) => setFormData({ ...formData, numero_ficha: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                        placeholder="Ex: 123"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="codigo" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Código
                      </label>
                      <input
                        id="codigo"
                        type="text"
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                        placeholder="Ex: 3.3.90.30"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="fonte" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Fonte de Recurso
                      </label>
                      <input
                        id="fonte"
                        type="text"
                        value={formData.fonte}
                        onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                        placeholder="Ex: 1500"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="descricao" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Descrição
                      </label>
                      <input
                        id="descricao"
                        type="text"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                        placeholder="Descrição da natureza de despesa"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-green-dark uppercase tracking-wider border-b pb-2">Valores</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="saldo_inicial" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Saldo Inicial (R$)
                      </label>
                      <input
                        id="saldo_inicial"
                        type="number"
                        step="0.01"
                        value={formData.saldo_inicial}
                        onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 font-bold text-brand-green-dark focus:ring-2 focus:ring-brand-green-light outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    {editingFicha && (
                      <div>
                        <label htmlFor="saldo_atual" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                          Saldo Atual (R$)
                        </label>
                        <input
                          id="saldo_atual"
                          type="number"
                          step="0.01"
                          value={formData.saldo_atual}
                          onChange={(e) => setFormData({ ...formData, saldo_atual: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2 font-bold text-brand-blue-dark focus:ring-2 focus:ring-brand-green-light outline-none"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-12 py-3 bg-brand-green-dark text-white rounded-xl hover:bg-green-900 transition-all font-bold shadow-xl hover:shadow-2xl"
                >
                  {editingFicha ? 'Atualizar Ficha' : 'Salvar Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Nº / Código
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Descrição / Fonte
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Saldo Inicial
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Saldo Atual
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fichas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    Nenhuma ficha cadastrada.
                  </td>
                </tr>
              ) : (
                fichas.map((ficha) => (
                  <tr key={ficha.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-brand-blue-dark">
                        {ficha.numero_ficha}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase">
                        Cód: {ficha.codigo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 font-medium">
                        {ficha.descricao}
                      </div>
                      <div className="text-xs text-gray-500">
                        Fonte: {ficha.fonte}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-500">
                        {formatCurrency(ficha.saldo_inicial)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`text-sm font-black ${
                        ficha.saldo_atual < ficha.saldo_inicial * 0.2
                          ? 'text-red-600'
                          : 'text-brand-green-dark'
                      }`}>
                        {formatCurrency(ficha.saldo_atual)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ficha.saldo_atual < ficha.saldo_inicial * 0.2 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200">
                          Crítico
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-brand-green-dark border border-green-200">
                          Estável
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(ficha)}
                          className="text-brand-blue-light hover:text-brand-blue-dark flex items-center"
                        >
                          <span className="mr-1">✏️</span> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(ficha.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <span className="mr-1">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}