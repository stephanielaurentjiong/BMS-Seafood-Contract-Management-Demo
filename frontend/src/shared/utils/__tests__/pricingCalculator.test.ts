/**
 * @fileoverview Pricing Calculator Tests
 * 
 * Comprehensive test suite for pricing interpolation logic.
 * Validates business rules from CLAUDE.md with real-world examples.
 * 
 * Test Coverage:
 * - Linear interpolation calculations
 * - Progressive penalty calculations  
 * - Edge case handling
 * - Business example validation
 * 
 */

import { 
  calculatePrice, 
  calculatePriceRange,
  formatPrice,
  validateBasePrices,
  BasePriceEntry 
} from '../pricingCalculator';

/**
 * Sample base pricing data from CLAUDE.md business examples
 */
const sampleBasePrices: BasePriceEntry[] = [
  { size: 20, price: 88000 },
  { size: 25, price: 88000 },
  { size: 30, price: 80000 },
  { size: 40, price: 77000 },
  { size: 50, price: 70000 },
  { size: 55, price: 67000 },
  { size: 60, price: 64000 },
  { size: 70, price: 59000 },
  { size: 75, price: 54000 },
  { size: 80, price: 48000 },
  { size: 90, price: 48000 },
  { size: 100, price: 48000 }
];

/**
 * Business Example Tests from CLAUDE.md
 */
describe('Pricing Calculator - Business Examples', () => {
  
  describe('Linear Interpolation Examples', () => {
    test('Size 26 interpolation (between size 25 at Rp88k and size 30 at Rp80k)', () => {
      const result = calculatePrice(26, sampleBasePrices);
      
      expect(result.type).toBe('interpolated');
      expect(result.price).toBe(86400); // Rp86,400 as per business example
      expect(result.breakdown).toContain('86,400');
    });

    test('Size 27 interpolation continuation', () => {
      const result = calculatePrice(27, sampleBasePrices);
      
      expect(result.type).toBe('interpolated');
      expect(result.price).toBe(84800); // Rp84,800 as calculated
    });

    test('Size 35 interpolation (between size 30 at Rp80k and size 40 at Rp77k)', () => {
      const result = calculatePrice(35, sampleBasePrices);
      
      expect(result.type).toBe('interpolated');
      // Price difference: 77k - 80k = -3k over 10 sizes = -300 per size
      // Size 35: 80k + (-300 * 5) = 78.5k
      expect(result.price).toBe(78500);
    });
  });

  describe('Penalty Calculation Examples', () => {
    test('Size 101 penalty calculation (first size in penalty range)', () => {
      const result = calculatePrice(101, sampleBasePrices);
      
      expect(result.type).toBe('penalty');
      // Base: 48k, Size 101: 48k - 200 = 47.8k
      expect(result.price).toBe(47800);
    });

    test('Size 102 penalty calculation', () => {
      const result = calculatePrice(102, sampleBasePrices);
      
      expect(result.type).toBe('penalty');
      // Size 102: 47.8k - 200 = 47.6k
      expect(result.price).toBe(47600);
    });

    test('Size 120 penalty calculation (mid-range 101-150)', () => {
      const result = calculatePrice(120, sampleBasePrices);
      
      expect(result.type).toBe('penalty');
      // Base: 48k, 20 sizes * 200 reduction = -4k, final: 44k
      expect(result.price).toBe(44000);
    });

    test('Size 151 penalty calculation (start of second penalty range)', () => {
      const result = calculatePrice(151, sampleBasePrices);
      
      expect(result.type).toBe('penalty');
      // Base: 48k, 50 sizes @ 200 = -10k, 1 size @ 400 = -0.4k, final: 37.6k
      expect(result.price).toBe(37600);
    });

    test('Size 201 penalty calculation (start of third penalty range)', () => {
      const result = calculatePrice(201, sampleBasePrices);
      
      expect(result.type).toBe('penalty');
      // Base: 48k, 50@200=-10k, 50@400=-20k, 1@900=-0.9k, final: 17.1k
      expect(result.price).toBe(17100);
    });
  });

  describe('Exact Match Examples', () => {
    test('Size 20 exact match', () => {
      const result = calculatePrice(20, sampleBasePrices);
      
      expect(result.type).toBe('exact');
      expect(result.price).toBe(88000);
    });

    test('Size 100 exact match (boundary case)', () => {
      const result = calculatePrice(100, sampleBasePrices);
      
      expect(result.type).toBe('exact');
      expect(result.price).toBe(48000);
    });
  });

  describe('Edge Cases', () => {
    test('Size below minimum (19) should return error', () => {
      const result = calculatePrice(19, sampleBasePrices);
      
      expect(result.type).toBe('error');
      expect(result.price).toBe(0);
      expect(result.breakdown).toContain('too small');
    });

    test('Size 0 should return error', () => {
      const result = calculatePrice(0, sampleBasePrices);
      
      expect(result.type).toBe('error');
    });

    test('Negative size should return error', () => {
      const result = calculatePrice(-5, sampleBasePrices);
      
      expect(result.type).toBe('error');
    });
  });
});

/**
 * Pricing Utility Function Tests
 */
describe('Pricing Utilities', () => {
  
  describe('Price Formatting', () => {
    test('Format price with currency', () => {
      expect(formatPrice(88000)).toBe('Rp88,000');
      expect(formatPrice(1000000)).toBe('Rp1,000,000');
    });

    test('Format price without currency', () => {
      expect(formatPrice(88000, false)).toBe('88,000');
    });
  });

  describe('Base Price Validation', () => {
    test('Valid base prices should pass validation', () => {
      const result = validateBasePrices(sampleBasePrices);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Empty base prices should fail validation', () => {
      const result = validateBasePrices([]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('Duplicate sizes should fail validation', () => {
      const duplicatePrices = [
        { size: 20, price: 88000 },
        { size: 20, price: 90000 } // Duplicate size
      ];
      const result = validateBasePrices(duplicatePrices);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Duplicate'))).toBe(true);
    });
  });
});

/**
 * Price Range Calculation Tests
 */
describe('Price Range Calculations', () => {
  test('Calculate price range across interpolation boundary', () => {
    const results = calculatePriceRange(25, 30, sampleBasePrices);
    
    expect(results).toHaveLength(6); // 25, 26, 27, 28, 29, 30
    
    // Size 25: exact match
    expect(results[0].result.type).toBe('exact');
    expect(results[0].result.price).toBe(88000);
    
    // Size 26-29: interpolated
    expect(results[1].result.type).toBe('interpolated');
    expect(results[2].result.type).toBe('interpolated');
    
    // Size 30: exact match
    expect(results[5].result.type).toBe('exact');
    expect(results[5].result.price).toBe(80000);
  });

  test('Calculate price range across penalty boundary', () => {
    const results = calculatePriceRange(100, 105, sampleBasePrices);
    
    expect(results).toHaveLength(6); // 100, 101, 102, 103, 104, 105
    
    // Size 100: exact match
    expect(results[0].result.type).toBe('exact');
    expect(results[0].result.price).toBe(48000);
    
    // Size 101-105: penalty calculations
    for (let i = 1; i < 6; i++) {
      expect(results[i].result.type).toBe('penalty');
    }
    
    // Verify descending prices in penalty range
    for (let i = 1; i < 6; i++) {
      expect(results[i].result.price).toBeLessThan(results[i-1].result.price);
    }
  });
});

/**
 * Complex Business Scenario Tests
 */
describe('Complex Business Scenarios', () => {
  test('Full contract pricing scenario with mixed sizes', () => {
    const contractSizes = [22, 28, 45, 75, 110, 180, 220];
    
    contractSizes.forEach(size => {
      const result = calculatePrice(size, sampleBasePrices);
      
      // All calculations should succeed
      expect(result.type).not.toBe('error');
      expect(result.price).toBeGreaterThan(0);
      
      // Verify expected calculation types
      if (sampleBasePrices.some(p => p.size === size)) {
        expect(result.type).toBe('exact');
      } else if (size <= 100) {
        expect(result.type).toBe('interpolated');
      } else {
        expect(result.type).toBe('penalty');
      }
    });
  });

  test('Penalty progression validation', () => {
    // Test that penalties get progressively larger in higher ranges
    const size120 = calculatePrice(120, sampleBasePrices); // Range 101-150
    const size170 = calculatePrice(170, sampleBasePrices); // Range 151-200  
    const size220 = calculatePrice(220, sampleBasePrices); // Range 201+
    
    expect(size120.price).toBeGreaterThan(size170.price);
    expect(size170.price).toBeGreaterThan(size220.price);
  });
});

/**
 * Error Handling Tests
 */
describe('Error Handling', () => {
  test('Invalid input types should be handled gracefully', () => {
    // @ts-ignore - Testing runtime error handling
    const result1 = calculatePrice('not-a-number', sampleBasePrices);
    expect(result1.type).toBe('error');

    // @ts-ignore - Testing runtime error handling
    const result2 = calculatePrice(null, sampleBasePrices);
    expect(result2.type).toBe('error');
  });

  test('Empty or invalid base prices should be handled', () => {
    const result1 = calculatePrice(30, []);
    expect(result1.type).toBe('error');

    const invalidPrices = [{ size: -1, price: 100 }];
    const result2 = calculatePrice(30, invalidPrices);
    expect(result2.type).toBe('error');
  });
});

/**
 * Performance and Integration Tests
 */
describe('Performance and Integration', () => {
  test('Large price range calculation should complete in reasonable time', () => {
    const startTime = Date.now();
    const results = calculatePriceRange(20, 300, sampleBasePrices);
    const endTime = Date.now();
    
    expect(results).toHaveLength(281); // 20 to 300 inclusive
    expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
  });

  test('All results should have consistent structure', () => {
    const testSizes = [20, 25, 35, 100, 150, 250];
    
    testSizes.forEach(size => {
      const result = calculatePrice(size, sampleBasePrices);
      
      // Verify result structure
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('formula');
      expect(result).toHaveProperty('breakdown');
      
      expect(typeof result.price).toBe('number');
      expect(['exact', 'interpolated', 'penalty', 'error']).toContain(result.type);
      expect(typeof result.formula).toBe('string');
      expect(typeof result.breakdown).toBe('string');
    });
  });
});

/**
 * Custom test helper to validate business example accuracy
 */
function validateBusinessExample(size: number, expectedPrice: number, tolerance: number = 0) {
  const result = calculatePrice(size, sampleBasePrices);
  
  if (tolerance === 0) {
    expect(result.price).toBe(expectedPrice);
  } else {
    expect(result.price).toBeCloseTo(expectedPrice, tolerance);
  }
  
  return result;
}

/**
 * Integration test using the custom helper
 */
describe('Business Example Validation Helper', () => {
  test('Validate key business examples with helper', () => {
    validateBusinessExample(26, 86400); // CLAUDE.md example
    validateBusinessExample(101, 47800); // First penalty size
    validateBusinessExample(20, 88000);  // Exact match
    validateBusinessExample(100, 48000); // Boundary case
  });
});