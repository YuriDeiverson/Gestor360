/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Filters } from "../utils/types";
import { availableAccounts } from "../utils/mockData";

interface FiltersContextType {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  resetFilters: () => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

const getInitialFilters = (): Filters => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1); // Últimos 12 meses (1 ano)

  const defaultFilters: Filters = {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    accounts: [], // VAZIO = MOSTRA TODAS AS CONTAS
    industries: [], // VAZIO = MOSTRA TODAS AS CATEGORIAS
    status: "all",
  };

  try {
    const storedFilters = localStorage.getItem("filters");
    if (storedFilters) {
      const parsed = JSON.parse(storedFilters);

      // Validar apenas contas (accounts), não categorias
      const missingAccounts = availableAccounts.filter(
        (acc) => !parsed.accounts?.includes(acc),
      );

      if (missingAccounts.length > 0) {
        console.log("🔄 Atualizando filtros para incluir novas contas:", {
          missingAccounts,
        });

        // Manter categorias vazias e adicionar apenas contas faltantes
        return {
          ...parsed,
          accounts: [...availableAccounts],
          industries: parsed.industries || [], // Manter categorias existentes ou vazio
        };
      }

      return parsed;
    }
  } catch (error) {
    console.error("Failed to parse filters from localStorage", error);
  }

  return defaultFilters;
};

export const FiltersProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [filters, setFilters] = useState<Filters>(getInitialFilters);

  useEffect(() => {
    try {
      localStorage.setItem("filters", JSON.stringify(filters));
    } catch (error) {
      console.error("Failed to save filters to localStorage", error);
    }
  }, [filters]);

  const resetFilters = () => {
    const newFilters = getInitialFilters();
    setFilters(newFilters);
    // Forçar limpeza do localStorage para garantir reset completo
    localStorage.removeItem("filters");
  };

  return (
    <FiltersContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = (): FiltersContextType => {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return context;
};
