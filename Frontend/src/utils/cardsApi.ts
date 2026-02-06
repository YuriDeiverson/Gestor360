import { API_BASE_URL } from './api';

// Interface para o Card do Supabase
export interface ApiCard {
  id: string;
  dashboard_id: string;
  name: string;
  bank?: string;
  card_limit: number;
  closing_day: number;
  due_day: number;
  current_balance: number;
  status: 'active' | 'inactive' | 'overdue';
  next_due_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para o Card do Frontend
export interface Card {
  id: string;
  name: string;
  bank?: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentBalance: number;
  nextDueDate?: string;
  status: 'active' | 'inactive' | 'overdue';
}

// Função para converter da API para o Frontend
export function convertApiCardToFrontend(apiCard: ApiCard): Card {
  return {
    id: apiCard.id,
    name: apiCard.name,
    bank: apiCard.bank || undefined,
    limit: apiCard.card_limit,
    closingDay: apiCard.closing_day,
    dueDay: apiCard.due_day,
    currentBalance: apiCard.current_balance || 0,
    status: apiCard.status,
    nextDueDate: apiCard.next_due_date,
  };
}

export const cardsApi = {
  async getAll(dashboardId?: string): Promise<Card[]> {
    try {
      const token = localStorage.getItem('authToken');
      const url = dashboardId
        ? `${API_BASE_URL}/api/cards?dashboard_id=${dashboardId}`
        : `${API_BASE_URL}/api/cards`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar cartões: ${response.statusText}`);
      }

      const apiCards: ApiCard[] = await response.json();
      return apiCards.map(convertApiCardToFrontend);
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
      throw error;
    }
  },

  async create(card: Omit<Card, 'id'>): Promise<Card> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          dashboard_id: (card as any).dashboardId || '',
          name: card.name,
          bank: card.bank || null,
          card_limit: card.limit,
          closing_day: card.closingDay,
          due_day: card.dueDay,
          status: 'active',
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar cartão: ${response.statusText}`);
      }

      const apiCard: ApiCard = await response.json();
      return convertApiCardToFrontend(apiCard);
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      throw error;
    }
  },

  async update(id: string, card: Partial<Card>): Promise<Card> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: card.name,
          bank: card.bank || null,
          card_limit: card.limit,
          closing_day: card.closingDay,
          due_day: card.dueDay,
          status: card.status,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar cartão: ${response.statusText}`);
      }

      const apiCard: ApiCard = await response.json();
      return convertApiCardToFrontend(apiCard);
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir cartão: ${response.statusText}`);
      }

      // Não retorna conteúdo para DELETE
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      throw error;
    }
  },
};
