import React, { useState } from "react";
import { Category } from "../utils/types";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import Portal from "./Portal";

interface CategoriesPageProps {
  categories: Category[];
  addCategory: (category: Omit<Category, "id">) => void;
  editCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
}

interface CategoryFormData {
  name: string;
  type: "income" | "expense" | "budget" | "both";
  description: string;
  color: string;
}

const CategoryForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
  initialData?: Category;
  title: string;
}> = ({ isOpen, onClose, onSubmit, initialData, title }) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || "",
    type: initialData?.type || "expense",
    description: initialData?.description || "",
    color: initialData?.color || "#10b981",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  const colorOptions = [
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#6b7280",
    "#14b8a6",
  ];

  return (
    <Portal>
      <div
        className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 pointer-events-auto"
        style={{ backgroundColor: 'var(--overlay)' }}
        onClick={onClose}
      >
        <div
          className="rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Nome da Categoria
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as
                      | "income"
                      | "expense"
                      | "budget"
                      | "both",
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 cursor-pointer"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="budget">Orçamento</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                rows={3}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cor
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className="w-8 h-8 rounded-full border-2 cursor-pointer"
                    style={{
                      backgroundColor: color,
                      borderColor: formData.color === color ? 'var(--text)' : 'var(--border)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              className="flex gap-3 pt-6 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg transition-colors duration-150 font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 text-white px-4 py-2 rounded-lg transition-colors duration-150 font-medium"
                style={{ backgroundColor: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  addCategory,
  editCategory,
  deleteCategory,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleAddCategory = (data: CategoryFormData) => {
    addCategory(data as any);
    setIsAddModalOpen(false);
  };

  const handleEditCategory = (data: CategoryFormData) => {
    if (editingCategory) {
      editCategory({
        ...editingCategory,
        ...data,
      } as any);
    }
    setEditingCategory(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "income":
        return "Receita";
      case "expense":
        return "Despesa";
      case "budget":
        return "Orçamento";
      case "both":
        return "Ambos";
      default:
        return type;
    }
  };

  const getTypeBadgeStyle = (type: string): React.CSSProperties => {
    switch (type) {
      case "income":
        return { backgroundColor: 'var(--success-bg)', color: 'var(--success)' };
      case "expense":
        return { backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' };
      case "budget":
        return { backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' };
      case "both":
        return { backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' };
      default:
        return { backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Gerenciar Categorias
        </h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
          style={{ backgroundColor: 'var(--primary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </div>

      <div
        className="backdrop-blur-md rounded-2xl p-6"
        style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-lg p-4 transition-shadow"
              style={{ border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || "#10b981" }}
                  />
                  <h3 className="font-medium" style={{ color: 'var(--text)' }}>{category.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-1 cursor-pointer transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-1 cursor-pointer transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <span
                className="inline-block px-2 py-1 text-xs rounded-full"
                style={getTypeBadgeStyle(category.type)}
              >
                {getTypeLabel(category.type)}
              </span>

              {category.description && (
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  {category.description}
                </p>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              Nenhuma categoria criada ainda. Clique em "Nova Categoria" para
              começar.
            </div>
          )}
        </div>
      </div>

      <CategoryForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCategory}
        title="Adicionar Nova Categoria"
      />

      {editingCategory && (
        <CategoryForm
          isOpen={true}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleEditCategory}
          initialData={editingCategory}
          title="Editar Categoria"
        />
      )}
    </div>
  );
};

export default CategoriesPage;
