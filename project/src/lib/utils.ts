export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function effectivePrice(price: number, salePrice: number | null): number {
  if (salePrice !== null && salePrice < price) return salePrice;
  return price;
}

export function discountPercent(price: number, salePrice: number | null): number {
  if (salePrice === null || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function installmentText(price: number): string {
  const maxInstallments = 6;
  const minInstallment = 30;
  let installments = Math.floor(price / minInstallment);
  installments = Math.min(installments, maxInstallments);
  if (installments < 1) installments = 1;
  const value = price / installments;
  return `em até ${installments}x de ${formatBRL(value)}`;
}

export function generateCartToken(): string {
  return crypto.randomUUID();
}

export function getCartToken(): string {
  let token = localStorage.getItem('ta_cart_token');
  if (!token) {
    token = generateCartToken();
    localStorage.setItem('ta_cart_token', token);
  }
  return token;
}

export function cn(...classes: (string | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
