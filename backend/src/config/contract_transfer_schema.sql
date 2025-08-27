/**
 * @fileoverview Contract Transfer Database Schema
 * 
 * Additional table for storing transferred contract data into the Database System.
 * This is separate from the main contracts table and stores finalized contract data.
 * 
 * 
 * 
 */

-- Contract transfers table - stores finalized contract data transferred from closed contracts
CREATE TABLE IF NOT EXISTS contract_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contract identification
    contract_id VARCHAR(100) NOT NULL, -- Original contract unique_id (e.g., L302)
    original_contract_uuid UUID REFERENCES contracts(id), -- Link to original contract
    
    -- Transfer metadata
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When contract was transferred
    transferred_by UUID REFERENCES users(id) NOT NULL, -- GM who transferred the contract
    
    -- Contract basic info
    supplier_name VARCHAR(255) NOT NULL,
    
    -- Delivery details (broken down as specified)
    bongkar JSONB NOT NULL, -- Delivery dates array: ["27 Mei", "30 Mei"]
    size_ranges JSONB NOT NULL, -- Size ranges array: ["20-25", "30-90"]  
    tons JSONB NOT NULL, -- Delivery quantities array: [7, 5]
    
    -- Pricing information
    dynamic_pricing JSONB NOT NULL, -- Base pricing structure
    size_penalties JSONB, -- Size penalty rules
    
    -- Additional fields for future use
    index_value INTEGER DEFAULT 0, -- Can be zeroed out for now
    notes TEXT DEFAULT '', -- Empty for now
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'Transferred' CHECK (status IN ('Transferred', 'Processed', 'Archived')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_transfers_contract_id ON contract_transfers(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_transfers_supplier ON contract_transfers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_contract_transfers_date ON contract_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_contract_transfers_transferred_by ON contract_transfers(transferred_by);
CREATE INDEX IF NOT EXISTS idx_contract_transfers_status ON contract_transfers(status);

-- Add transfer status to original contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS transferred_to_db BOOLEAN DEFAULT FALSE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP NULL;

-- Index for transfer status
CREATE INDEX IF NOT EXISTS idx_contracts_transferred ON contracts(transferred_to_db);

-- Comments for documentation
COMMENT ON TABLE contract_transfers IS 'Stores finalized contract data transferred from closed contracts';
COMMENT ON COLUMN contract_transfers.bongkar IS 'Array of delivery dates extracted from delivery details';
COMMENT ON COLUMN contract_transfers.size_ranges IS 'Array of size ranges extracted from delivery details';
COMMENT ON COLUMN contract_transfers.tons IS 'Array of delivery quantities extracted from delivery details';
COMMENT ON COLUMN contract_transfers.dynamic_pricing IS 'Base pricing structure set by GM';
COMMENT ON COLUMN contract_transfers.size_penalties IS 'Size penalty rules applied to contract';