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
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 pointer-events-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Categoria
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="budget">Orçamento</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                      formData.color === color
                        ? "border-gray-900"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors duration-150 font-medium shadow-md"
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
    addCategory(data);
    setIsAddModalOpen(false);
  };

  const handleEditCategory = (data: CategoryFormData) => {
    if (editingCategory) {
      editCategory({
        ...editingCategory,
        ...data,
      });
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-green-100 text-green-800";
      case "expense":
        return "bg-red-100 text-red-800";
      case "budget":
        return "bg-purple-100 text-purple-800";
      case "both":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Gerenciar Categorias
        </h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_36px_rgba(12,12,16,0.06)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || "#10b981" }}
                  />
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <span
                className={`inline-block px-2 py-1 text-xs rounded-full ${getTypeBadgeColor(
                  category.type,
                )}`}
              >
                {getTypeLabel(category.type)}
              </span>

              {category.description && (
                <p className="text-sm text-gray-600 mt-2">
                  {category.description}
                </p>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
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
