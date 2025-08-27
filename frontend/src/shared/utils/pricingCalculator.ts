/**
 * @fileoverview Pricing Interpolation Calculator
 * 
 * Core business logic for seafood contract pricing calculations.
 * Implements linear interpolation for base prices and progressive penalty calculations for size overages.
 * 
 * Business Rules:
 * - Base Price Section: Linear interpolation between GM-defined sizes (typically 20-100)
 * - Size Penalties Section: Progressive reduction system for sizes above base range
 * - Smaller numbers = BIGGER shrimp (20 size = 20 pieces per pound)
 * 
 * Features:
 * - Linear interpolation with precise calculations
 * - Progressive penalty system with size-based reductions
 * - Edge case handling for boundary conditions
 * - Comprehensive error handling and validation
 * 
 */

/**
 * Interface for base pricing entry used in interpolation calculations
 * 
 * @interface BasePriceEntry
 * @property {number} size - Shrimp size (pieces per pound)
 * @property {number} price - Price in Rupiah per pound
 */
export interface BasePriceEntry {
  size: number;
  price: number;
}

/**
 * Interface for calculation result with detailed breakdown
 * 
 * @interface PriceCalculationResult
 * @property {number} price - Final calculated price in Rupiah
 * @property {'exact' | 'interpolated' | 'penalty' | 'error'} type - Calculation method used
 * @property {string} formula - Human-readable formula explanation
 * @property {string} breakdown - Detailed step-by-step calculation
 */
export interface PriceCalculationResult {
  price: number;
  type: 'exact' | 'interpolated' | 'penalty' | 'error';
  formula: string;
  breakdown: string;
}

/**
 * Configuration for size penalty calculations
 * 
 * @interface PenaltyConfig
 * @property {number} range101to150 - Penalty per size for sizes 101-150 (default: 200)
 * @property {number} range151to200 - Penalty per size for sizes 151-200 (default: 400)
 * @property {number} range201plus - Penalty per size for sizes 201+ (default: 900)
 */
export interface PenaltyConfig {
  range101to150: number;
  range151to200: number;
  range201plus: number;
}

/**
 * Default penalty configuration based on business requirements
 */
const DEFAULT_PENALTY_CONFIG: PenaltyConfig = {
  range101to150: 200,  // Rp200 reduction per size
  range151to200: 400,  // Rp400 reduction per size
  range201plus: 900    // Rp900 reduction per size
};

/**
 * Validates and sorts base pricing entries for interpolation
 * 
 * @param basePrices - Array of base pricing entries
 * @returns Sorted and validated pricing entries
 * @throws Error if pricing data is invalid
 */
function validateAndSortBasePrices(basePrices: BasePriceEntry[]): BasePriceEntry[] {
  if (!basePrices || basePrices.length === 0) {
    throw new Error('Base pricing data is required');
  }

  // Validate each entry
  for (const entry of basePrices) {
    if (typeof entry.size !== 'number' || typeof entry.price !== 'number') {
      throw new Error('Invalid pricing entry: size and price must be numbers');
    }
    if (entry.size <= 0 || entry.price < 0) {
      throw new Error('Invalid pricing entry: size must be positive, price cannot be negative');
    }
  }

  // Sort by size ascending (smaller numbers = bigger shrimp)
  return [...basePrices].sort((a, b) => a.size - b.size);
}

/**
 * Finds the appropriate pricing bracket for interpolation
 * 
 * @param targetSize - Size to find bracket for
 * @param sortedPrices - Sorted base pricing entries
 * @returns Object with lower and upper bracket entries, or null if exact match
 */
function findInterpolationBracket(targetSize: number, sortedPrices: BasePriceEntry[]): {
  lower: BasePriceEntry;
  upper: BasePriceEntry;
} | null {
  // Check for exact match first
  const exactMatch = sortedPrices.find(entry => entry.size === targetSize);
  if (exactMatch) {
    return null; // Exact match found, no interpolation needed
  }

  // Find the bracket for interpolation
  for (let i = 0; i < sortedPrices.length - 1; i++) {
    const lower = sortedPrices[i];
    const upper = sortedPrices[i + 1];
    
    if (targetSize > lower.size && targetSize < upper.size) {
      return { lower, upper };
    }
  }

  return null; // No bracket found
}

/**
 * Performs linear interpolation between two pricing points
 * 
 * Business Formula:
 * Price Difference = Next Price - Current Price
 * Size Difference = Next Size - Current Size  
 * Price Per Size = Price Difference ÷ Size Difference
 * Interpolated Price = Current Price + (Price Per Size × (Target Size - Current Size))
 * 
 * @param targetSize - Size to calculate price for
 * @param lower - Lower bracket pricing entry
 * @param upper - Upper bracket pricing entry
 * @returns Detailed calculation result with formula breakdown
 */
function performLinearInterpolation(targetSize: number, lower: BasePriceEntry, upper: BasePriceEntry): PriceCalculationResult {
  const priceDifference = upper.price - lower.price;
  const sizeDifference = upper.size - lower.size;
  const pricePerSize = priceDifference / sizeDifference;
  const sizeOffset = targetSize - lower.size;
  const interpolatedPrice = lower.price + (pricePerSize * sizeOffset);

  const formula = `Price = ${lower.price} + ((${upper.price} - ${lower.price}) ÷ (${upper.size} - ${lower.size})) × (${targetSize} - ${lower.size})`;
  const breakdown = [
    `Price difference: Rp${upper.price.toLocaleString()} - Rp${lower.price.toLocaleString()} = Rp${priceDifference.toLocaleString()}`,
    `Size difference: ${upper.size} - ${lower.size} = ${sizeDifference}`,
    `Price per size: Rp${priceDifference.toLocaleString()} ÷ ${sizeDifference} = Rp${pricePerSize.toLocaleString()}`,
    `Size ${targetSize} price: Rp${lower.price.toLocaleString()} + (Rp${pricePerSize.toLocaleString()} × ${sizeOffset}) = Rp${interpolatedPrice.toLocaleString()}`
  ].join('\\n');

  return {
    price: Math.round(interpolatedPrice),
    type: 'interpolated',
    formula,
    breakdown
  };
}

/**
 * Calculates penalty pricing for sizes above the base range
 * 
 * Business Rules:
 * - Size 101-150: Reduce Rp200 per size from previous size
 * - Size 151-200: Reduce Rp400 per size from previous size
 * - Size 201+: Reduce Rp900 per size from previous size
 * - Base price starts from size 100 equivalent price
 * 
 * @param targetSize - Size to calculate penalty price for (must be > 100)
 * @param basePrice - Starting price (typically size 100 price)
 * @param config - Penalty configuration (optional, uses defaults)
 * @returns Detailed calculation result with penalty breakdown
 */
function calculatePenaltyPricing(targetSize: number, basePrice: number, config: PenaltyConfig = DEFAULT_PENALTY_CONFIG): PriceCalculationResult {
  if (targetSize <= 100) {
    throw new Error('Penalty pricing only applies to sizes above 100');
  }

  let currentPrice = basePrice;
  let currentSize = 100;
  const calculations: string[] = [`Starting from size ${currentSize}: Rp${basePrice.toLocaleString()}`];

  // Size 101-150 range
  if (targetSize > 100 && targetSize <= 150) {
    const sizesInRange = targetSize - 100;
    const totalReduction = sizesInRange * config.range101to150;
    currentPrice -= totalReduction;
    calculations.push(`Size ${currentSize + 1} to ${targetSize}: ${sizesInRange} sizes × Rp${config.range101to150} = -Rp${totalReduction.toLocaleString()}`);
  }
  // Size 151-200 range  
  else if (targetSize > 150 && targetSize <= 200) {
    // First handle 101-150
    const range1Sizes = 50; // sizes 101-150
    const range1Reduction = range1Sizes * config.range101to150;
    currentPrice -= range1Reduction;
    calculations.push(`Size 101 to 150: ${range1Sizes} sizes × Rp${config.range101to150} = -Rp${range1Reduction.toLocaleString()}`);
    
    // Then handle 151-targetSize
    const range2Sizes = targetSize - 150;
    const range2Reduction = range2Sizes * config.range151to200;
    currentPrice -= range2Reduction;
    calculations.push(`Size 151 to ${targetSize}: ${range2Sizes} sizes × Rp${config.range151to200} = -Rp${range2Reduction.toLocaleString()}`);
  }
  // Size 201+ range
  else if (targetSize > 200) {
    // Handle 101-150
    const range1Sizes = 50;
    const range1Reduction = range1Sizes * config.range101to150;
    currentPrice -= range1Reduction;
    calculations.push(`Size 101 to 150: ${range1Sizes} sizes × Rp${config.range101to150} = -Rp${range1Reduction.toLocaleString()}`);
    
    // Handle 151-200
    const range2Sizes = 50;
    const range2Reduction = range2Sizes * config.range151to200;
    currentPrice -= range2Reduction;
    calculations.push(`Size 151 to 200: ${range2Sizes} sizes × Rp${config.range151to200} = -Rp${range2Reduction.toLocaleString()}`);
    
    // Handle 201+
    const range3Sizes = targetSize - 200;
    const range3Reduction = range3Sizes * config.range201plus;
    currentPrice -= range3Reduction;
    calculations.push(`Size 201 to ${targetSize}: ${range3Sizes} sizes × Rp${config.range201plus} = -Rp${range3Reduction.toLocaleString()}`);
  }

  const formula = `Progressive penalty system: Base price - (range penalties)`;
  const breakdown = calculations.join('\\n') + `\\nFinal price: Rp${currentPrice.toLocaleString()}`;

  return {
    price: Math.round(Math.max(0, currentPrice)), // Ensure price doesn't go negative
    type: 'penalty',
    formula,
    breakdown
  };
}

/**
 * Main pricing calculator function that handles all calculation scenarios
 * 
 * Handles:
 * - Exact matches from GM-inputted base prices
 * - Linear interpolation between base prices
 * - Progressive penalty calculations for sizes above base range
 * - Edge cases and error conditions
 * 
 * @param targetSize - Size to calculate price for
 * @param basePrices - Array of GM-inputted base pricing entries
 * @param penaltyConfig - Optional penalty configuration
 * @returns Comprehensive calculation result with price and explanation
 * 
 * @example
 * ```typescript
 * const basePrices = [
 *   { size: 20, price: 88000 },
 *   { size: 30, price: 80000 },
 *   { size: 100, price: 48000 }
 * ];
 * 
 * // Exact match
 * const result1 = calculatePrice(20, basePrices);
 * console.log(result1.price); // 88000
 * 
 * // Interpolation
 * const result2 = calculatePrice(25, basePrices); 
 * console.log(result2.price); // ~84000 (interpolated)
 * 
 * // Penalty calculation
 * const result3 = calculatePrice(120, basePrices);
 * console.log(result3.price); // 48000 - (20 × 200) = 44000
 * ```
 */
export function calculatePrice(targetSize: number, basePrices: BasePriceEntry[], penaltyConfig?: PenaltyConfig): PriceCalculationResult {
  try {
    // Validate input
    if (typeof targetSize !== 'number' || targetSize <= 0) {
      throw new Error('Target size must be a positive number');
    }

    // Handle edge case: size too small
    if (targetSize < 20) {
      return {
        price: 0,
        type: 'error',
        formula: 'Size < 20: Not supported',
        breakdown: 'Size too small - minimum supported size is 20'
      };
    }

    const sortedPrices = validateAndSortBasePrices(basePrices);

    // Check for exact match
    const exactMatch = sortedPrices.find(entry => entry.size === targetSize);
    if (exactMatch) {
      return {
        price: exactMatch.price,
        type: 'exact',
        formula: `Exact match for size ${targetSize}`,
        breakdown: `Direct lookup: Size ${targetSize} = Rp${exactMatch.price.toLocaleString()}`
      };
    }

    // Find the maximum size in base prices to determine boundary
    const maxBaseSize = Math.max(...sortedPrices.map(entry => entry.size));

    // If target size is above the base range, use penalty calculation
    if (targetSize > maxBaseSize) {
      const basePriceEntry = sortedPrices.find(entry => entry.size === maxBaseSize);
      if (!basePriceEntry) {
        throw new Error('Could not find base price for penalty calculation');
      }
      return calculatePenaltyPricing(targetSize, basePriceEntry.price, penaltyConfig);
    }

    // Try interpolation within base range
    const bracket = findInterpolationBracket(targetSize, sortedPrices);
    if (bracket) {
      return performLinearInterpolation(targetSize, bracket.lower, bracket.upper);
    }

    // Handle edge cases: below minimum size or above maximum size in base range
    const minBaseSize = Math.min(...sortedPrices.map(entry => entry.size));
    if (targetSize < minBaseSize) {
      return {
        price: 0,
        type: 'error',
        formula: `Size ${targetSize} < minimum base size ${minBaseSize}`,
        breakdown: `Target size is below the minimum defined base price size`
      };
    }

    // Fallback error
    throw new Error(`Unable to calculate price for size ${targetSize}`);

  } catch (error) {
    return {
      price: 0,
      type: 'error',
      formula: 'Calculation Error',
      breakdown: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Utility function to get all prices for a range of sizes
 * Useful for generating pricing tables or validation
 * 
 * @param startSize - Starting size (inclusive)
 * @param endSize - Ending size (inclusive)  
 * @param basePrices - Base pricing entries
 * @param penaltyConfig - Optional penalty configuration
 * @returns Array of size-price pairs with calculation details
 */
export function calculatePriceRange(startSize: number, endSize: number, basePrices: BasePriceEntry[], penaltyConfig?: PenaltyConfig): Array<{size: number, result: PriceCalculationResult}> {
  const results: Array<{size: number, result: PriceCalculationResult}> = [];
  
  for (let size = startSize; size <= endSize; size++) {
    const result = calculatePrice(size, basePrices, penaltyConfig);
    results.push({ size, result });
  }
  
  return results;
}

/**
 * Utility function to format price for display
 * 
 * @param price - Price in Rupiah
 * @param showCurrency - Whether to show "Rp" prefix (default: true)
 * @returns Formatted price string
 */
export function formatPrice(price: number, showCurrency: boolean = true): string {
  const formatted = price.toLocaleString('id-ID');
  return showCurrency ? `Rp${formatted}` : formatted;
}

/**
 * Utility function to validate base pricing entries for business rules
 * 
 * @param basePrices - Base pricing entries to validate
 * @returns Object with validation result and any error messages
 */
export function validateBasePrices(basePrices: BasePriceEntry[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    validateAndSortBasePrices(basePrices);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Validation error');
    return { isValid: false, errors };
  }
  
  // Additional business rule validations
  const sortedPrices = [...basePrices].sort((a, b) => a.size - b.size);
  
  // Check for reasonable size ranges (business rule: typically 20-100 for base)
  if (sortedPrices[0].size < 10) {
    errors.push('Minimum size should typically be 20 or higher');
  }
  
  // Check for duplicate sizes
  const sizes = sortedPrices.map(entry => entry.size);
  const uniqueSizes = new Set(sizes);
  if (sizes.length !== uniqueSizes.size) {
    errors.push('Duplicate sizes found in base pricing');
  }
  
  return { isValid: errors.length === 0, errors };
}