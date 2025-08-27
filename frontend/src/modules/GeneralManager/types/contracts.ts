/**
 * @fileoverview General Manager Contract Types
 * 
 * TypeScript type definitions for the General Manager Dashboard contract management system.
 * Defines interfaces for contracts, forms, and related data structures.
 * 
 * Business Context:
 * - Contract management for seafood (shrimp) purchasing
 * - Complex pricing with size-based rates and penalties
 * - Multi-delivery scheduling with quantity tracking
 * - Status workflow from creation to completion
 * 
 */

/**
 * Tab types for General Manager Dashboard navigation
 * @typedef {("contract-collaboration" | "database-system")} TabType
 */
export type TabType = "contract-collaboration" | "database-system";

/**
 * Main Contract interface representing a complete seafood purchase contract
 * 
 * @interface Contract
 * @property {string} id - Unique contract identifier (format: L{timestamp}.{random}.00)
 * @property {string} databaseId - Database UUID for API operations (optional for backward compatibility)
 * @property {string} type - Contract type (New, Add, Change)
 * @property {string} supplierId - UUID of assigned supplier (optional for backward compatibility)
 * @property {string} supplierName - Display name for the supplier on this contract
 * @property {string} status - Contract status (New, Open, Agreed, Completed)
 * @property {Array<{size: string, price: number}>} basePricing - Base prices for different shrimp sizes
 * @property {Array<{sizeRange: string, penaltyAmount: number, unit: string}>} sizePenalties - Penalties for off-size shrimp
 * @property {Array<{date: string, quantity: number, unit: string, sizeRange: string}>} deliveryDetails - Delivery schedule and quantities
 * @property {Date} createdAt - Contract creation timestamp
 */
export interface Contract {
  id: string;
  databaseId?: string;
  type: string;
  supplierId?: string;
  supplierName: string;
  status: string;
  basePricing: Array<{ size: string; price: number }>;
  sizePenalties: Array<{ sizeRange: string; penaltyAmount: number; unit: string }>;
  deliveryDetails: Array<{ date: string; quantity: number; unit: string; sizeRange: string }>;
  createdAt: Date;
  transferredToDb?: boolean;
  transferredAt?: Date;
}

/**
 * Form interface for contract creation/editing with string values for inputs
 * 
 * @interface NewContractForm
 * @property {string} contractId - Contract ID input field
 * @property {string} type - Contract type selection
 * @property {string} supplierId - Selected supplier UUID from dropdown
 * @property {string} supplierName - Display name for supplier (editable)
 * @property {string} status - Contract status selection
 * @property {Array<BasePricing>} basePricing - Array of base pricing entries with IDs
 * @property {Array<SizePenalty>} sizePenalties - Array of size penalty entries with IDs
 * @property {Array<DeliveryDetail>} deliveryDetails - Array of delivery detail entries with IDs
 */
export interface NewContractForm {
  contractId: string;
  type: string;
  supplierId: string;
  supplierName: string;
  status: string;
  basePricing: Array<{ id: string; size: string; price: string }>;
  sizePenalties: Array<{ id: string; sizeRange: string; penaltyAmount: string; unit: string }>;
  deliveryDetails: Array<{ id: string; date: string; quantity: string; unit: string; sizeRange: string }>;
}

/**
 * Base pricing entry for form management
 * 
 * @interface BasePricing
 * @property {string} id - Unique identifier for form management
 * @property {string} size - Shrimp size (e.g., "20", "30", "40")
 * @property {string} price - Price per pound as string for input handling
 */
export interface BasePricing {
  id: string;
  size: string;
  price: string;
}

/**
 * Size penalty entry for out-of-specification shrimp
 * 
 * @interface SizePenalty
 * @property {string} id - Unique identifier for form management
 * @property {string} sizeRange - Size range (e.g., "100-150", "151-200")
 * @property {string} penaltyAmount - Penalty amount as string for input handling
 * @property {string} unit - Penalty unit (Rp/s, Rp/kg, Rp/sz)
 */
export interface SizePenalty {
  id: string;
  sizeRange: string;
  penaltyAmount: string;
  unit: string;
}

/**
 * Delivery detail entry for scheduled deliveries
 * 
 * @interface DeliveryDetail
 * @property {string} id - Unique identifier for form management
 * @property {string} date - Delivery date (e.g., "27 Mei")
 * @property {string} quantity - Delivery quantity as string for input handling
 * @property {string} unit - Quantity unit (mt, kg, ton)
 * @property {string} sizeRange - Expected size range for this delivery
 */
export interface DeliveryDetail {
  id: string;
  date: string;
  quantity: string;
  unit: string;
  sizeRange: string;
}

/**
 * Enhanced base pricing entry with interpolation support
 * Extends the basic BasePricing with additional metadata for pricing calculations
 * 
 * @interface EnhancedBasePricing
 * @property {string} id - Unique identifier for form management
 * @property {string} size - Shrimp size as string for input handling
 * @property {string} price - Price per pound as string for input handling
 * @property {boolean} isInterpolated - Whether this price was calculated via interpolation (optional)
 * @property {string} calculationNote - Note about how this price was determined (optional)
 */
export interface EnhancedBasePricing extends BasePricing {
  isInterpolated?: boolean;
  calculationNote?: string;
}

/**
 * Pricing interpolation metadata for contracts
 * Contains configuration and calculated pricing information
 * 
 * @interface PricingInterpolationData
 * @property {boolean} isEnabled - Whether interpolation is enabled for this contract
 * @property {number} minSize - Minimum size for pricing calculations
 * @property {number} maxSize - Maximum size in base pricing range
 * @property {number} penaltyStartSize - Size where penalty calculations begin (typically 101)
 * @property {Date} lastCalculated - When pricing was last calculated
 * @property {string} calculatedBy - User who performed the calculation (GM username)
 */
export interface PricingInterpolationData {
  isEnabled: boolean;
  minSize: number;
  maxSize: number;
  penaltyStartSize: number;
  lastCalculated: Date;
  calculatedBy: string;
}

/**
 * Enhanced contract interface with pricing interpolation support
 * Extends the base Contract interface with additional pricing calculation metadata
 * 
 * @interface ContractWithPricing
 * @extends Contract
 * @property {PricingInterpolationData} pricingData - Interpolation configuration and metadata
 * @property {EnhancedBasePricing[]} enhancedBasePricing - Base pricing with interpolation metadata
 */
export interface ContractWithPricing extends Contract {
  pricingData: PricingInterpolationData;
  enhancedBasePricing: EnhancedBasePricing[];
}

/**
 * Enhanced form interface with pricing interpolation support
 * Extends the base form with pricing calculation capabilities
 * 
 * @interface NewContractFormWithPricing
 * @extends NewContractForm
 * @property {PricingInterpolationData} pricingData - Interpolation configuration
 * @property {EnhancedBasePricing[]} enhancedBasePricing - Enhanced pricing entries
 * @property {boolean} showPricingCalculator - Whether to show the pricing calculator in UI
 */
export interface NewContractFormWithPricing extends Omit<NewContractForm, 'basePricing'> {
  pricingData: PricingInterpolationData;
  enhancedBasePricing: EnhancedBasePricing[];
  showPricingCalculator: boolean;
}