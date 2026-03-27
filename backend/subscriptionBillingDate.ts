/**
 * Data da transação ao criar/editar conta: sempre no **mês civil atual** (dia = billingDay,
 * limitado ao último dia do mês), para aparecer no filtro padrão do dashboard (mês atual)
 * e nas listagens de transações.
 */
export function subscriptionTransactionDateInCurrentMonth(
  billingDay: number,
  now = new Date(),
): string {
  const y = now.getFullYear();
  const m = now.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const day = Math.min(billingDay, lastDay);
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/**
 * Próxima data de cobrança (YYYY-MM-DD) a partir do dia da fatura e da data atual.
 * Se o dia de cobrança ainda não passou no mês, usa este mês; senão, o próximo.
 */
export function nextBillingDateIso(billingDay: number, now = new Date()): string {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const lastDayOfMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const clampDay = (year: number, month: number) =>
    Math.min(billingDay, lastDayOfMonth(year, month));

  const thisMonthDay = clampDay(y, m);
  if (d <= thisMonthDay) {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(thisMonthDay).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  let nm = m + 1;
  let ny = y;
  if (nm > 11) {
    nm = 0;
    ny += 1;
  }
  const nextDay = clampDay(ny, nm);
  const mm = String(nm + 1).padStart(2, "0");
  const dd = String(nextDay).padStart(2, "0");
  return `${ny}-${mm}-${dd}`;
}
