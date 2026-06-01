'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Processo, Ficha } from '@/types';

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<Processo | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    numero: '',
    objeto: '',
    fornecedor: '',
    valor: '',
    ficha_id: '',
    status: 'aprovado' as 'aprovado' | 'empenhado' | 'liquidado',
    data_emissao: '',
    data_pagamento: '',
    responsavel: '',
  });
  const [uploading, setUploading] = useState(false);
  const [anexos, setAnexos] = useState<{ name: string; url: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [processosRes, fichasRes] = await Promise.all([
        fetch('/api/processos'),
        fetch('/api/fichas'),
      ]);

      const processosData = await processosRes.json();
      const fichasData = await fichasRes.json();

      if (!processosRes.ok) throw new Error(processosData.message || processosData.error || 'Erro ao carregar processos');
      if (!fichasRes.ok) throw new Error(fichasData.message || fichasData.error || 'Erro ao carregar fichas');

      setProcessos(processosData);
      setFichas(fichasData);
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
    void fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingProcesso ? 'PUT' : 'POST';
      const body = {
        ...formData,
        id: editingProcesso?.id,
        valor: parseFloat(formData.valor),
        anexos: anexos.map((a) => a.url),
      };

      const res = await fetch('/api/processos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFormData({
          numero: '',
          objeto: '',
          fornecedor: '',
          valor: '',
          ficha_id: '',
          status: 'aprovado',
          data_emissao: '',
          data_pagamento: '',
          responsavel: '',
        });
        setAnexos([]);
        setShowForm(false);
        setEditingProcesso(null);
        fetchData();
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleEdit = (processo: Processo) => {
    setEditingProcesso(processo);
    setFormData({
      numero: processo.numero,
      objeto: processo.objeto,
      fornecedor: processo.fornecedor,
      valor: processo.valor.toString(),
      ficha_id: processo.ficha_id,
      status: processo.status,
      data_emissao: processo.data_emissao.split('T')[0],
      data_pagamento: processo.data_pagamento ? processo.data_pagamento.split('T')[0] : '',
      responsavel: processo.responsavel,
    });
    setAnexos(processo.anexos.map(url => ({ name: url.split('/').pop() || 'arquivo', url })));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este processo?')) return;

    try {
      const res = await fetch(`/api/processos?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setAnexos([...anexos, { name: data.name, url: data.url }]);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setUploading(false);
    }
  };


  const handleExport = async (format: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({ format });
    if (filterStatus !== 'all') {
      params.set('status', filterStatus);
    }

    window.open(`/api/export?${params.toString()}`, '_blank');
  };

  const formatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }), []);

  const formatCurrency = useCallback((value: number) => {
    return formatter.format(value);
  }, [formatter]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-brand-green-dark border-green-200';
      case 'empenhado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'liquidado':
        return 'bg-blue-100 text-brand-blue-dark border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const fichaMap = useMemo(() => {
    return new Map(fichas.map((f) => [f.id, `${f.numero_ficha} - ${f.codigo}`]));
  }, [fichas]);

  const filteredProcessos = useMemo(() => {
    return filterStatus === 'all'
      ? processos
      : processos.filter((p) => p.status === filterStatus);
  }, [processos, filterStatus]);

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
        <h3 className="text-red-800 font-bold mb-2">Erro ao carregar processos</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => fetchData()}
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
          <h2 className="text-2xl font-bold text-gray-900">Processos</h2>
          <p className="text-gray-600 mt-1">
            Gerencie os processos de contratação e aquisição
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('xlsx')}
            className="bg-white text-brand-green-dark border border-brand-green-dark px-4 py-2 rounded-lg hover:bg-green-50 transition font-medium flex items-center"
          >
            <span aria-hidden="true" className="mr-2">📊</span> Exportar Excel
          </button>
          <button
            onClick={() => {
              if (showForm) {
                setEditingProcesso(null);
                setFormData({
                  numero: '',
                  objeto: '',
                  fornecedor: '',
                  valor: '',
                  ficha_id: '',
                  status: 'aprovado',
                  data_emissao: '',
                  data_pagamento: '',
                  responsavel: '',
                });
                setAnexos([]);
              }
              setShowForm(!showForm);
            }}
            className={`${showForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-brand-blue-dark hover:bg-blue-900'} text-white px-4 py-2 rounded-lg transition font-medium`}
          >
            {showForm ? 'Cancelar' : 'Novo Processo'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xl font-bold text-brand-blue-dark">
                {editingProcesso ? '📝 Editar Processo' : '✨ Novo Processo'}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Seção de Identificação */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-blue-dark uppercase tracking-wider border-b pb-2">
                    Identificação do Processo
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label htmlFor="objeto" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Objeto / Descrição
                      </label>
                      <input
                        id="objeto"
                        type="text"
                        value={formData.objeto}
                        onChange={(e) => setFormData({ ...formData, objeto: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                        placeholder="Descrição do objeto/contratação"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="numero" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Nº do Processo
                      </label>
                      <input
                        id="numero"
                        type="text"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="fornecedor" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Fornecedor
                      </label>
                      <input
                        id="fornecedor"
                        type="text"
                        value={formData.fornecedor}
                        onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção Financeira e Status */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-green-dark uppercase tracking-wider border-b pb-2">
                    Financeiro e Status
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label htmlFor="ficha_id" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Ficha de Despesa
                      </label>
                      <select
                        id="ficha_id"
                        value={formData.ficha_id}
                        onChange={(e) => setFormData({ ...formData, ficha_id: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-green-light outline-none"
                        required
                      >
                        <option value="">Selecione uma ficha...</option>
                        {fichas.map((ficha) => (
                          <option key={ficha.id} value={ficha.id}>
                            {ficha.numero_ficha} - {ficha.codigo} ({formatCurrency(ficha.saldo_atual)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="valor" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Valor (R$)
                      </label>
                      <input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 font-bold text-brand-blue-dark focus:ring-2 focus:ring-brand-green-light outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Status Atual
                      </label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-green-light outline-none"
                      >
                        <option value="aprovado">Aprovado</option>
                        <option value="empenhado">Empenhado</option>
                        <option value="liquidado">Liquidado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Seção de Prazos e Responsável */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2">
                    Prazos e Responsável
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="data_emissao" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Data de Emissão
                      </label>
                      <input
                        id="data_emissao"
                        type="date"
                        value={formData.data_emissao}
                        onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="data_pagamento" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Data de Pagamento
                      </label>
                      <input
                        id="data_pagamento"
                        type="date"
                        value={formData.data_pagamento}
                        onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="responsavel" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Técnico Responsável
                      </label>
                      <input
                        id="responsavel"
                        type="text"
                        value={formData.responsavel}
                        onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-light outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção de Anexos */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2">
                    Documentação
                  </h4>
                  <div>
                    <label htmlFor="anexos" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Anexar Arquivo
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-brand-blue-light transition-colors">
                      <input
                        id="anexos"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      <label htmlFor="anexos" className="cursor-pointer text-sm text-gray-600">
                        {uploading ? 'Enviando...' : 'Clique para selecionar ou arraste o arquivo'}
                      </label>
                    </div>
                    {anexos.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {anexos.map((anexo, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded border border-blue-100">
                            <span className="text-xs text-brand-blue-dark truncate max-w-[200px]">
                              📎 {anexo.name}
                            </span>
                            <button type="button" onClick={() => setAnexos(anexos.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 text-xs font-bold">
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t flex justify-end space-x-4 sticky bottom-0 bg-white z-10 pb-2">
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
                  {editingProcesso ? 'Atualizar Processo' : 'Salvar Processo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filtrar por status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">Todos</option>
          <option value="aprovado">Aprovados</option>
          <option value="empenhado">Empenhados</option>
          <option value="liquidado">Liquidados</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Processo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Objeto / Fornecedor
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Ficha
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Valor
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
              {filteredProcessos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    Nenhum processo encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredProcessos.map((processo) => (
                  <tr key={processo.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-brand-blue-dark">
                        {processo.numero}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase">
                        Emitido em {new Date(processo.data_emissao).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 font-medium line-clamp-1" title={processo.objeto}>
                        {processo.objeto}
                      </div>
                      <div className="text-xs text-gray-500">
                        {processo.fornecedor}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                        {fichaMap.get(processo.ficha_id) || processo.ficha_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-black text-brand-blue-dark">
                        {formatCurrency(processo.valor)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(
                          processo.status
                        )}`}
                      >
                        {processo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(processo)}
                          className="text-brand-blue-light hover:text-brand-blue-dark flex items-center"
                          title="Editar Processo"
                        >
                          <span className="mr-1">✏️</span> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(processo.id)}
                          className="text-red-500 hover:text-red-700 flex items-center"
                          title="Excluir Processo"
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