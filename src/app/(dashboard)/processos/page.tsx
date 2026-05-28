'use client';

import { useEffect, useState } from 'react';
import { Processo, Ficha } from '@/types';

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [processosRes, fichasRes] = await Promise.all([
        fetch('/api/processos'),
        fetch('/api/fichas'),
      ]);
      const processosData = await processosRes.json();
      const fichasData = await fichasRes.json();
      setProcessos(processosData);
      setFichas(fichasData);
      setLoading(false);
    } catch (error) {
      console.error('Erro:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/processos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor),
          anexos: anexos.map((a) => a.url),
        }),
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
        fetchData();
      }
    } catch (error) {
      console.error('Erro:', error);
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

  const handleUpdateStatus = async (
    processoId: string,
    newStatus: 'aprovado' | 'empenhado' | 'liquidado',
    responsavel_mudanca: string
  ) => {
    try {
      const processo = processos.find((p) => p.id === processoId);
      if (!processo) return;

      const res = await fetch('/api/processos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...processo,
          status: newStatus,
          responsavel_mudanca,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({ format });
    if (filterStatus !== 'all') {
      params.set('status', filterStatus);
    }

    window.open(`/api/export?${params.toString()}`, '_blank');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'empenhado':
        return 'bg-yellow-100 text-yellow-800';
      case 'liquidado':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fichaMap = new Map(fichas.map((f) => [f.id, f.codigo]));

  const filteredProcessos =
    filterStatus === 'all'
      ? processos
      : processos.filter((p) => p.status === filterStatus);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
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
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            📊 Exportar Excel
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancelar' : 'Novo Processo'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Novo Processo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do Processo
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) =>
                    setFormData({ ...formData, numero: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ficha de Despesa
                </label>
                <select
                  value={formData.ficha_id}
                  onChange={(e) =>
                    setFormData({ ...formData, ficha_id: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {fichas.map((ficha) => (
                    <option key={ficha.id} value={ficha.id}>
                      {ficha.codigo} - {ficha.descricao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objeto
              </label>
              <input
                type="text"
                value={formData.objeto}
                onChange={(e) =>
                  setFormData({ ...formData, objeto: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição do objeto/contratação"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={formData.fornecedor}
                  onChange={(e) =>
                    setFormData({ ...formData, fornecedor: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({ ...formData, valor: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as
                        | 'aprovado'
                        | 'empenhado'
                        | 'liquidado',
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="aprovado">Aprovado</option>
                  <option value="empenhado">Empenhado</option>
                  <option value="liquidado">Liquidado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) =>
                    setFormData({ ...formData, responsavel: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Emissão
                </label>
                <input
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) =>
                    setFormData({ ...formData, data_emissao: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Pagamento
                </label>
                <input
                  type="date"
                  value={formData.data_pagamento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      data_pagamento: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anexos (opcional)
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full border rounded-lg px-3 py-2"
              />
              {uploading && <p className="text-sm text-blue-600 mt-1">Upload em andamento...</p>}
              {anexos.length > 0 && (
                <div className="mt-2 space-y-1">
                  {anexos.map((anexo, idx) => (
                    <p key={idx} className="text-sm text-green-600">
                      📎 {anexo.name}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Salvar Processo
            </button>
          </form>
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Processo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Objeto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fornecedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ficha
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Valor
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Anexos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProcessos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Nenhum processo encontrado
                </td>
              </tr>
            ) : (
              filteredProcessos.map((processo) => (
                <tr key={processo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {processo.numero}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {processo.objeto}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {processo.fornecedor}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {fichaMap.get(processo.ficha_id) || processo.ficha_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(processo.valor)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        processo.status
                      )}`}
                    >
                      {processo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {processo.anexos.length > 0 && (
                      <span className="text-gray-600">
                        📎 {processo.anexos.length} arquivo(s)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      onChange={(e) => {
                        const responsavel = prompt(
                          'Nome do responsável pela mudança:'
                        );
                        if (responsavel) {
                          handleUpdateStatus(
                            processo.id,
                            e.target.value as 'aprovado' | 'empenhado' | 'liquidado',
                            responsavel
                          );
                        }
                      }}
                      value={processo.status}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="aprovado">Aprovado</option>
                      <option value="empenhado">Empenhado</option>
                      <option value="liquidado">Liquidado</option>
                    </select>
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