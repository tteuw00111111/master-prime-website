// Master Prime confirmed a single 8.57% markup for 2–12 installments, 21/10/2026.
export const IPHONE_CREDIT_MARKUP_BPS = 857

export const getIPhoneInstallmentPlan = (cashCents: number, count = 12) => {
  if (!Number.isSafeInteger(cashCents) || cashCents <= 0 || !Number.isInteger(count) || count < 2 || count > 12) {
    throw new RangeError('Preço ou quantidade de parcelas inválidos.')
  }
  const totalCents = Math.round(cashCents * (10000 + IPHONE_CREDIT_MARKUP_BPS) / 10000)
  const installmentCents = Math.round(totalCents / count)
  // Keep the same total at every count; reconcile rounding in the last payment.
  const lastInstallmentCents = totalCents - installmentCents * (count - 1)
  return { count, totalCents, installmentCents, lastInstallmentCents }
}
