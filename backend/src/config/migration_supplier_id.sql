-- Migration: Add supplier_id foreign key to contracts table
-- This migrates from name-based supplier assignment to ID-based relationships

-- Step 1: Add supplier_id column as nullable initially
ALTER TABLE contracts 
ADD COLUMN supplier_id UUID REFERENCES users(id);

-- Step 2: Make supplier_name optional (keep for display purposes)
ALTER TABLE contracts 
ALTER COLUMN supplier_name DROP NOT NULL;

-- Step 3: Create index for performance on supplier_id lookups
CREATE INDEX idx_contracts_supplier_id ON contracts(supplier_id);

-- Step 4: Add comment to document the change
COMMENT ON COLUMN contracts.supplier_id IS 'Foreign key to users table - replaces name-based supplier assignment';
COMMENT ON COLUMN contracts.supplier_name IS 'Display name for contract - optional, defaults to user.name';

-- Step 5: Attempt to populate supplier_id for existing contracts
-- This tries to match existing supplier_name values to user accounts
UPDATE contracts 
SET supplier_id = users.id 
FROM users 
WHERE LOWER(contracts.supplier_name) = LOWER(users.name) 
  AND users.role = 'supplier'
  AND contracts.supplier_id IS NULL;

-- Step 6: Add constraint that contracts must have either supplier_id or supplier_name
-- (for backward compatibility during transition)
ALTER TABLE contracts 
ADD CONSTRAINT check_supplier_reference 
CHECK (supplier_id IS NOT NULL OR supplier_name IS NOT NULL);

-- Optional: Query to check migration results
-- Uncomment to see how many contracts were successfully migrated
/*
SELECT 
  COUNT(*) as total_contracts,
  COUNT(supplier_id) as migrated_contracts,
  COUNT(CASE WHEN supplier_id IS NULL THEN 1 END) as unmigrated_contracts
FROM contracts;
*/

-- Optional: Query to see unmigrated contracts
-- Uncomment to see which contracts couldn't be automatically migrated
/*
SELECT unique_id, supplier_name, 'No matching user account' as issue
FROM contracts 
WHERE supplier_id IS NULL 
ORDER BY created_at DESC;
*/

-- Migration Complete
-- Note: Unmigrated contracts will continue to work with name-based matching
-- but new contracts should use supplier_id for better reliability