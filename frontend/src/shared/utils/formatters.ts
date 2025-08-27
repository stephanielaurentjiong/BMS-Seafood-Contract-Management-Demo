export const formatCurrency = (amount: number, currency = 'Rp'): string => {
  return `${currency}${amount.toLocaleString()}`;
};

export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    return date;
  }
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatQuantity = (quantity: number, unit: string): string => {
  return `${quantity}${unit}`;
};

export const formatSizeRange = (sizes: string[]): string => {
  return sizes.join('/');
};

export const formatContractId = (timestamp?: number): string => {
  const ts = timestamp || Date.now();
  const timestampStr = ts.toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `L${timestampStr}.${random}.00`;
};