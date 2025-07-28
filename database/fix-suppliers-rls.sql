-- Fix RLS policies for suppliers table
-- This allows authenticated users to manage suppliers

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_all_suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_select_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete_policy" ON public.suppliers;

-- Enable RLS on suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "allow_all_suppliers" ON public.suppliers 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Alternative: More specific policies (commented out for now)
-- CREATE POLICY "suppliers_select_policy" ON public.suppliers 
-- FOR SELECT TO authenticated USING (true);

-- CREATE POLICY "suppliers_insert_policy" ON public.suppliers 
-- FOR INSERT TO authenticated WITH CHECK (true);

-- CREATE POLICY "suppliers_update_policy" ON public.suppliers 
-- FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- CREATE POLICY "suppliers_delete_policy" ON public.suppliers 
-- FOR DELETE TO authenticated USING (true);

-- Fix RLS policies for deliveries table as well
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_all_deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_select_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_insert_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_update_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_delete_policy" ON public.deliveries;

-- Enable RLS on deliveries table
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "allow_all_deliveries" ON public.deliveries 
FOR ALL TO authenticated USING (true) WITH CHECK (true); 