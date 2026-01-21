import React, { useState, useEffect } from "react";
import { Plus, CreditCard, Calendar, AlertCircle } from "lucide-react";
import Portal from "./Portal";
import { Card } from "../utils/types";

interface CardsPageProps {
  cards: Card[];
  onAddCard: (card: Omit<Card, "id">) => Promise<void>;
  onEditCard: (card: Card) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
}

const CardsPage: React.FC<CardsPageProps> = ({
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bank: "",
    limit: "",
    closingDay: "",
    dueDay: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      bank: "",
      limit: "",
      closingDay: "",
      dueDay: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.limit || !formData.closingDay || !formData.dueDay) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      if (editingCard) {
        await onEditCard({
          ...editingCard,
          name: formData.name,
          bank: formData.bank || undefined,
          limit: parseFloat(formData.limit),
          closingDay: parseInt(formData.closingDay),
          dueDay: parseInt(formData.dueDay),
        });
      } else {
        await onAddCard({
          name: formData.name,
          bank: formData.bank || undefined,
          limit: parseFloat(formData.limit),
          closingDay: parseInt(formData.closingDay),
          dueDay: parseInt(formData.dueDay),
          currentBalance: 0,
          status: "active",
        });
      }
      
      setIsModalOpen(false);
      setEditingCard(null);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar cartão:", error);
      alert("Erro ao salvar cartão. Tente novamente.");
    }
  };

  const openEditModal = (card: Card) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      bank: card.bank || "",
      limit: card.limit.toString(),
      closingDay: card.closingDay.toString(),
      dueDay: card.dueDay.toString(),
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCard(null);
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
    resetForm();
  };

  const getCardStatusColor = (status: Card["status"]) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      case "inactive":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getCardStatusText = (status: Card["status"]) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "overdue":
        return "Vencido";
      case "inactive":
        return "Inativo";
      default:
        return "Desconhecido";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent bg-clip-text">
          Meus Cartões
        </h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Novo Cartão</span>
        </button>
      </div>

      {/* Grid de Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200 overflow-hidden"
          >
            {/* Header do Cartão */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-white" />
                  <div>
                    <h3 className="text-xl font-bold">{card.name}</h3>
                    {card.bank && (
                      <p className="text-blue-100 text-sm">{card.bank}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    card.status === "active" 
                      ? "bg-green-500 text-white" 
                      : card.status === "overdue"
                        ? "bg-red-500 text-white"
                        : "bg-gray-500 text-white"
                  }`}>
                    {getCardStatusText(card.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Conteúdo do Cartão */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Limite</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(card.limit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Saldo Atual</p>
                  <p className={`text-2xl font-bold ${
                    card.currentBalance > card.limit * 0.8 
                      ? "text-red-600" 
                      : card.currentBalance > card.limit * 0.6
                        ? "text-yellow-600" 
                        : "text-green-600"
                  }`}>
                    {formatCurrency(card.currentBalance)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-1">Disponível</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(card.limit - card.currentBalance)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Fechamento</p>
                    <p className="text-lg font-semibold text-gray-900">Dia {card.closingDay}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Vencimento</p>
                    <p className="text-lg font-semibold text-gray-900">Dia {card.dueDay}</p>
                  </div>
                </div>
              </div>

              {card.nextDueDate && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">Próxima fatura: {new Date(card.nextDueDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => openEditModal(card)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Editar
              </button>
              <button
                onClick={() => onDeleteCard(card.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-gray-600 mb-6">Clique em "Novo Cartão" para começar a gerenciar seus cartões</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Cadastrar Primeiro Cartão</span>
          </button>
        </div>
      )}

      {/* Modal para Adicionar/Editar Cartão */}
      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                {editingCard ? "Editar Cartão" : "Adicionar Cartão"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cartão *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Visa Final, Nubank"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banco (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Itaú, Bradesco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite *
                  </label>
                  <input
                    type="number"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dia Fechamento *
                    </label>
                    <input
                      type="number"
                      value={formData.closingDay}
                      onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1-31"
                      min="1"
                      max="31"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dia Vencimento *
                    </label>
                    <input
                      type="number"
                      value={formData.dueDay}
                      onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1-31"
                      min="1"
                      max="31"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingCard ? "Salvar" : "Adicionar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default CardsPage;
