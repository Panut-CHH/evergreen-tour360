-- Create tours table to store virtual tours
CREATE TABLE public.tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- Public can view active tours (for sharing via URL)
CREATE POLICY "Anyone can view active tours" 
ON public.tours 
FOR SELECT 
USING (is_active = true);

-- Create admin_users table for authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can view their own record
CREATE POLICY "Admins can view own record"
ON public.admin_users
FOR SELECT
USING (auth.uid() = user_id);

-- Create policies for admin users to manage tours
CREATE POLICY "Admins can create tours"
ON public.tours
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update tours"
ON public.tours
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete tours"
ON public.tours
FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tours_updated_at
BEFORE UPDATE ON public.tours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for tour images
INSERT INTO storage.buckets (id, name, public) VALUES ('tour-images', 'tour-images', true);

-- Storage policies
CREATE POLICY "Anyone can view tour images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tour-images');

CREATE POLICY "Authenticated users can upload tour images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'tour-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tour images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'tour-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tour images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'tour-images' AND auth.role() = 'authenticated');