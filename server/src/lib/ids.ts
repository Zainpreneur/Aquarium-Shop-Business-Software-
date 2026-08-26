// Human-friendly sequential reference numbers for sales & purchase orders.

export function makeSaleNumber(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `SALE-${stamp}-${rand}`;
}

export function makePoNumber(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `PO-${stamp}-${rand}`;
}
