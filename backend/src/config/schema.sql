-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('general_manager', 'supplier', 'administrator')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts table (this is where JSONB magic happens!)
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_id VARCHAR(100) UNIQUE,
    contract_type VARCHAR(20) CHECK (contract_type IN ('New', 'Add', 'Change')) NOT NULL,
    supplier_id UUID REFERENCES users(id), -- FK to users table for reliable supplier assignment
    supplier_name VARCHAR(255), -- Optional display name for contract (can be customized)
    status VARCHAR(20) CHECK (status IN ('Open', 'Closed')) DEFAULT 'Open',
    created_by UUID REFERENCES users(id),
    base_pricing JSONB, -- Your dynamic pricing magic! 🎯
    size_penalties JSONB, -- Penalty rules
    deliveries JSONB, -- Delivery details from suppliers
    supplier_filled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_supplier_reference CHECK (supplier_id IS NOT NULL OR supplier_name IS NOT NULL)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    performed_by UUID REFERENCES users(id),
    changes JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_contracts_supplier_id ON contracts(supplier_id); -- Primary supplier lookup
CREATE INDEX idx_contracts_supplier_name ON contracts(supplier_name); -- Backward compatibility
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_id, entity_type);