/**
 * Display formatting utilities for the analytics portal.
 */

export function formatCurrency(value: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB').format(value);
}
