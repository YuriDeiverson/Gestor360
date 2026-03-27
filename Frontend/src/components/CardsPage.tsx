import React, { useState } from "react";
import { Plus, CreditCard, Calendar, AlertCircle, Pencil, Trash2, X } from "lucide-react";
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
    setFormData({ name: "", bank: "", limit: "", closingDay: "", dueDay: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.limit || !formData.closingDay || !formData.dueDay) return;

    try {
      const cardData = {
        name: formData.name,
        bank: formData.bank || undefined,
        limit: parseFloat(formData.limit),
        closingDay: parseInt(formData.closingDay),
        dueDay: parseInt(formData.dueDay),
      };

      if (editingCard) {
        await onEditCard({ ...editingCard, ...cardData });
      } else {
        await onAddCard({ ...cardData, currentBalance: 0, status: "active" });
      }
      closeModal();
    } catch (error) {
      console.error(error);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Meus Cartões
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Gerencie seus limites e visualize o fechamento de faturas.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl transition-all text-sm font-medium"
          style={{ backgroundColor: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
        >
          <Plus className="w-4 h-4" />
          Novo Cartão
        </button>
      </div>

      {/* Grid de Cartões */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const usagePercent = Math.min((card.currentBalance / card.limit) * 100, 100);
          
          return (
            <div
              key={card.id}
              className="group relative rounded-3xl p-6 transition-all duration-300"
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              {/* Top Actions & Icon */}
              <div className="flex justify-between items-start mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}
                >
                  <CreditCard className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(card)}
                    className="p-2 rounded-lg transition-all"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--primary-bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteCard(card.id)}
                    className="p-2 rounded-lg transition-all"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Info */}
              <div className="mb-6">
                <h3 className="text-lg font-bold leading-tight" style={{ color: 'var(--text)' }}>
                  {card.name}
                </h3>
                <span
                  className="text-xs font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {card.bank || "Outros"}
                </span>
              </div>

              {/* Progress & Values */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Gasto atual</p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: usagePercent > 85 ? 'var(--danger)' : 'var(--text)' }}
                    >
                      {formatCurrency(card.currentBalance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Limite</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrency(card.limit)}
                    </p>
                  </div>
                </div>
                
                {/* Bar */}
                <div
                  className="h-2 w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div 
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${usagePercent}%`,
                      backgroundColor: usagePercent > 85 ? 'var(--danger)' : 'var(--primary)',
                    }}
                  />
                </div>
              </div>

              {/* Dates Footer */}
              <div
                className="grid grid-cols-2 gap-2 pt-5 border-t"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Fecha</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Dia {card.closingDay}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Vence</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Dia {card.dueDay}</p>
                  </div>
                </div>
              </div>

              {card.nextDueDate && (
                <div
                  className="mt-4 flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)' }}
                >
                  <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
                  <p className="text-[11px] font-medium" style={{ color: 'var(--warning)' }}>
                    Próximo vencimento: {new Date(card.nextDueDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {cards.length === 0 && (
        <div
          className="max-w-7xl mx-auto py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem]"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="p-4 rounded-2xl mb-4"
            style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-sm)', color: 'var(--text-muted)' }}
          >
            <CreditCard className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text)' }}>Nenhum cartão ativo</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Adicione seu primeiro cartão para começar.</p>
          <button 
             onClick={openAddModal}
             className="px-6 py-2 text-white rounded-xl text-sm font-medium transition-colors"
             style={{ backgroundColor: 'var(--primary)' }}
             onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
             onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
          >
            Começar agora
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <Portal>
          <div
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'var(--overlay)' }}
          >
            <div
              className="rounded-[2rem] p-8 w-full max-w-md relative overflow-hidden"
              style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)' }}
            >
              <button 
                onClick={closeModal}
                className="absolute top-6 right-6 p-2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>
                {editingCard ? "Editar Cartão" : "Novo Cartão"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase ml-1" style={{ color: 'var(--text-muted)' }}>Nome do Cartão</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border rounded-2xl outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                    placeholder="Ex: Nubank, Visa Platinum"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase ml-1" style={{ color: 'var(--text-muted)' }}>Instituição Bancária</label>
                  <input
                    type="text"
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    className="w-full px-4 py-3 border rounded-2xl outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                    placeholder="Ex: Itaú, Nubank"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase ml-1" style={{ color: 'var(--text-muted)' }}>Limite Disponível</label>
                  <input
                    type="number"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                    className="w-full px-4 py-3 border rounded-2xl outline-none transition-all focus:ring-2 font-medium"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase ml-1" style={{ color: 'var(--text-muted)' }}>Fechamento</label>
                    <input
                      type="number"
                      value={formData.closingDay}
                      onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                      className="w-full px-4 py-3 border rounded-2xl outline-none transition-all focus:ring-2"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                      placeholder="Dia"
                      min="1" max="31" required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase ml-1" style={{ color: 'var(--text-muted)' }}>Vencimento</label>
                    <input
                      type="number"
                      value={formData.dueDay}
                      onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                      className="w-full px-4 py-3 border rounded-2xl outline-none transition-all focus:ring-2"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                      placeholder="Dia"
                      min="1" max="31" required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3.5 font-semibold rounded-2xl transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 text-white font-semibold rounded-2xl transition-all"
                    style={{ backgroundColor: 'var(--primary)', boxShadow: 'var(--shadow)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
                  >
                    {editingCard ? "Salvar" : "Criar Cartão"}
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
