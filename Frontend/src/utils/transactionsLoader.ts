import { Transaction } from './types';

type ExternalTx = {
  date: number; // epoch ms
  amount: string; // cents as string, e.g. "5565" -> 55.65
  transaction_type: 'deposit' | 'withdraw';
  currency: string;
  account: string;
  industry: string;
  state?: string;
};

function convertAmount(a: string): number {
  const n = parseInt(a, 10);
  if (Number.isNaN(n)) return 0;
  return n / 100; // convert cents string to decimal number
}

function mapType(tt: ExternalTx['transaction_type']) {
  return tt === 'deposit' ? 'income' : 'expense';
}

export async function loadExternalTransactions(): Promise<Transaction[]> {
  // dynamic import so bundler can handle the large JSON file efficiently
  const mod = await import('../../transactions.json');
  const data: ExternalTx[] = (mod && (mod.default ?? mod)) as ExternalTx[];

  if (!Array.isArray(data)) return [];

  return data.map((t, idx) => ({
    id: `ext_txn_${idx + 1}`,
    date: new Date(t.date).toISOString(),
    description: t.account,
    amount: convertAmount(t.amount),
    type: mapType(t.transaction_type),
    status: 'completed',
    account: t.account,
    state: t.state || '',
    industry: t.industry || 'Unknown',
    method: 'PIX',
    category: t.industry || 'Outros',
  }));
}

export default loadExternalTransactions;
