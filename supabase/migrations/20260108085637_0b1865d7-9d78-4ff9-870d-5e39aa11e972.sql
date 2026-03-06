-- Allow authenticated users to insert their own admin record
CREATE POLICY "Users can insert own admin record"
ON public.admin_users
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update view_count on tours (for public viewing)
CREATE POLICY "Anyone can increment view count"
ON public.tours
FOR UPDATE
USING (is_active = true)
WITH CHECK (is_active = true);