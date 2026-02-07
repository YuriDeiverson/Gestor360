import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import Portal from "./Portal";

interface ImportStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  transactions?: any[];
}

interface BillImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: any[];
  budgets: any[];
  onImportTransactions: (transactions: any[]) => Promise<void>;
}

const BillImportModal: React.FC<BillImportModalProps> = ({
  isOpen,
  onClose,
  cards,
  budgets,
  onImportTransactions,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCard, setSelectedCard] = useState(""); // Vazio = opcional
  const [importSteps, setImportSteps] = useState<ImportStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setCurrentStep(1);
    setSelectedCard("");
    setImportSteps([]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Função para identificar o banco pelo nome do arquivo
  const identifyBankFromFileName = (fileName: string): string => {
    const name = fileName.toLowerCase();
    
    if (name.includes('nubank')) return 'Nubank';
    if (name.includes('banco-do-brasil') || name.includes('bb')) return 'Banco do Brasil';
    if (name.includes('itau') || name.includes('itaú')) return 'Itaú';
    if (name.includes('santander')) return 'Santander';
    if (name.includes('bradesco')) return 'Bradesco';
    if (name.includes('caixa')) return 'Caixa';
    if (name.includes('inter')) return 'Banco Inter';
    if (name.includes('original')) return 'Banco Original';
    if (name.includes('c6')) return 'C6 Bank';
    if (name.includes('picpay')) return 'PicPay';
    
    return 'Cartão'; // Padrão se não identificar
  };

  // Função para encontrar o cartão correspondente pelo banco
  const findCardByBank = (bankName: string) => {
    return cards.find(card => 
      card.bank && 
      card.bank.toLowerCase() === bankName.toLowerCase()
    );
  };

  // Função para encontrar o orçamento correspondente
  const findBudgetByCategory = (category: string) => {
    return budgets.find(budget => 
      budget.name && 
      (budget.name.toLowerCase() === category.toLowerCase() || 
       budget.name.toLowerCase() === `${category.toLowerCase()} `) // Tenta com ou sem espaço
    );
  };

  const closeModal = () => {
    resetModal();
    onClose();
  };

  /* ================= CSV ================= */
  const parseCSV = (content: string): any[] => {
    const lines = content.split("\n").filter(Boolean);
    const headers = lines[0].split(",").map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const row: any = {};
      headers.forEach((h, i) => (row[h] = values[i]));

      const amount = Number(String(row.amount).replace(",", "."));

      return {
        date: row.date,
        title: row.title,
        amount,
      };
    });
  };

  const processFile = async (file: File) => {
    const content = await file.text();
    if (file.name.endsWith(".csv")) return parseCSV(content);
    throw new Error("Formato não suportado");
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const raw = await processFile(file);

      // Identificar banco pelo nome do arquivo
      const bankName = identifyBankFromFileName(file.name);
      
      // Encontrar cartão correspondente pelo banco ou usar o selecionado pelo usuário
      const cardByBank = findCardByBank(bankName);
      const effectiveCardId = selectedCard || (cardByBank ? cardByBank.id : "");
      const effectiveCardName = effectiveCardId 
        ? cards.find(c => c.id === effectiveCardId)?.name 
        : bankName;
      
      // Encontrar orçamento da categoria "Cartão" - todas as faturas vão para este orçamento
      const budget = findBudgetByCategory("Cartão");

      const transactions = raw.map((t: any) => {
        const isIncome = t.amount < 0;
        
        // Verificar se é parcelado pelo título
        const isInstallment = t.title && (
          t.title.toLowerCase().includes('parcela') || 
          t.title.toLowerCase().includes('/')
        );
        
        // Extrair número da parcela se existir
        let currentInstallment = 1;
        let totalInstallments = 1;
        if (isInstallment) {
          const match = t.title.match(/(\d+)\/(\d+)/);
          if (match) {
            currentInstallment = parseInt(match[1]);
            totalInstallments = parseInt(match[2]);
          }
        }

        const transaction = {
          date: t.date,
          description: t.title,
          amount: Math.abs(t.amount),
          type: isIncome ? "income" : "expense",
          category: "Cartão",
          account: effectiveCardId,
          cardName: effectiveCardName,
          method: "Cartão de Crédito",
          budgetId: isIncome ? null : (budget ? budget.id : null),
          status: isInstallment ? "pending" : "completed",
          installments: totalInstallments,
          currentInstallment: currentInstallment,
          totalAmount: isInstallment ? Math.abs(t.amount) * totalInstallments : Math.abs(t.amount),
          remainingAmount: isInstallment ? Math.abs(t.amount) * (totalInstallments - currentInstallment) : 0,
        };
        
        return transaction;
      });

      setImportSteps([
        {
          id: Date.now().toString(),
          title: "Arquivo processado",
          description: `${transactions.length} transações encontradas`,
          status: "completed",
          transactions,
        },
      ]);

      setCurrentStep(2);
    } catch (err: any) {
      setImportSteps([
        {
          id: Date.now().toString(),
          title: "Erro",
          description: err.message,
          status: "error",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.csv')) {
      alert('Por favor, envie um arquivo CSV');
      return;
    }

    // Processar o arquivo diretamente
    setIsProcessing(true);
    try {
      const raw = await processFile(file);

      // Identificar banco pelo nome do arquivo
      const bankName = identifyBankFromFileName(file.name);
      
      // Encontrar cartão correspondente pelo banco ou usar o selecionado pelo usuário
      const cardByBank = findCardByBank(bankName);
      const effectiveCardId = selectedCard || (cardByBank ? cardByBank.id : "");
      const effectiveCardName = effectiveCardId 
        ? cards.find(c => c.id === effectiveCardId)?.name 
        : bankName;
      
      // Encontrar orçamento da categoria "Cartão" - todas as faturas vão para este orçamento
      const budget = findBudgetByCategory("Cartão");

      const transactions = raw.map((t: any) => {
        const isIncome = t.amount < 0;
        
        // Verificar se é parcelado pelo título
        const isInstallment = t.title && (
          t.title.toLowerCase().includes('parcela') || 
          t.title.toLowerCase().includes('/')
        );
        
        // Extrair número da parcela se existir
        let currentInstallment = 1;
        let totalInstallments = 1;
        if (isInstallment) {
          const match = t.title.match(/(\d+)\/(\d+)/);
          if (match) {
            currentInstallment = parseInt(match[1]);
            totalInstallments = parseInt(match[2]);
          }
        }

        const transaction = {
          date: t.date,
          description: t.title,
          amount: Math.abs(t.amount),
          type: isIncome ? "income" : "expense",
          category: "Cartão",
          account: effectiveCardId,
          cardName: effectiveCardName,
          method: "Cartão de Crédito",
          budgetId: isIncome ? null : (budget ? budget.id : null),
          status: isInstallment ? "pending" : "completed",
          installments: totalInstallments,
          currentInstallment: currentInstallment,
          totalAmount: isInstallment ? Math.abs(t.amount) * totalInstallments : Math.abs(t.amount),
          remainingAmount: isInstallment ? Math.abs(t.amount) * (totalInstallments - currentInstallment) : 0,
        };
        
        return transaction;
      });

      setImportSteps([
        {
          id: Date.now().toString(),
          title: "Arquivo processado",
          description: `${transactions.length} transações encontradas`,
          status: "completed",
          transactions,
        },
      ]);

      setCurrentStep(2);
    } catch (err: any) {
      setImportSteps([
        {
          id: Date.now().toString(),
          title: "Erro",
          description: err.message,
          status: "error",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div 
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        onClick={closeModal}
      >
        <div 
          className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Importar fatura</h2>
              <p className="text-sm opacity-90">
                Envie a fatura do cartão para registrar suas despesas
              </p>
            </div>
            <button 
              onClick={closeModal}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Steps */}
          <div className="flex gap-6 px-6 py-4 border-b text-sm">
            <Step active={currentStep >= 1} label="Selecionar cartão" />
            <Step active={currentStep >= 2} label="Revisar transações" />
          </div>

          {/* Content */}
          <div className="p-6 max-h-[65vh] overflow-y-auto">
            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard size={18} /> Cartão
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opção para nenhum cartão */}
                  <div
                    onClick={() => setSelectedCard("")}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedCard === ""
                        ? "border-gray-500 bg-gray-50 ring-2 ring-gray-200"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <strong>Nenhum cartão</strong>
                    <p className="text-sm text-gray-600">Importar sem associar a cartão</p>
                  </div>
                  
                  {cards.map(card => (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCard(card.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        selectedCard === card.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <strong>{card.name}</strong>
                      <p className="text-sm text-gray-600">{card.bank}</p>
                    </div>
                  ))}
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDragging 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto mb-3 text-blue-600" />
                  <p className="font-medium">Enviar fatura</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Arquivo CSV (date, title, amount) ou arraste e solte aqui
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    onClick={handleButtonClick}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isProcessing ? "Processando..." : "Selecionar arquivo"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Revisão</h3>

                <div className="border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-100 px-4 py-2 text-sm font-medium">
                    <span>Data</span>
                    <span>Descrição</span>
                    <span className="text-right">Valor</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {importSteps.flatMap(s => s.transactions || []).map((t, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-3 px-4 py-2 border-t text-sm"
                      >
                        <span>
                          {new Date(t.date).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="truncate">{t.description}</span>
                        <span
                          className={`text-right font-medium ${
                            t.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {t.amount.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Voltar
                  </button>
                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    onClick={async () => {
                      const all = importSteps.flatMap(
                        s => s.transactions || []
                      );
                      await onImportTransactions(all);
                      closeModal();
                    }}
                  >
                    Confirmar importação
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

const Step = ({ active, label }: { active: boolean; label: string }) => (
  <div className={`flex items-center gap-2 ${active ? "text-blue-600" : "text-gray-400"}`}>
    <CheckCircle2 size={16} />
    <span>{label}</span>
  </div>
);

export default BillImportModal;
