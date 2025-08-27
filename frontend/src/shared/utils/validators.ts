export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validateNumber = (value: string, fieldName: string): string | null => {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    return `${fieldName} must be a valid positive number`;
  }
  return null;
};

export const validateContractId = (contractId: string): string | null => {
  const contractIdRegex = /^L\d+\.\d+\.\d+$/;
  if (!contractIdRegex.test(contractId)) {
    return 'Contract ID must follow format L123456.789.00';
  }
  return null;
};

export const validateSizeRange = (sizeRange: string): string | null => {
  const sizeRangeRegex = /^\d+(-\d+)?$/;
  if (!sizeRangeRegex.test(sizeRange)) {
    return 'Size range must be in format "20" or "20-30"';
  }
  return null;
};