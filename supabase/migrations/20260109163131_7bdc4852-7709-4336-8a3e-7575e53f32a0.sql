-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('nails', 'lashes')),
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  popular BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service_id UUID REFERENCES public.services(id) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  notes TEXT,
  status appointment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('nails', 'lashes')),
  image_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_hours table
CREATE TABLE public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  UNIQUE (day_of_week)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles (only admins can manage roles)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for services (public read, admin write)
CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for appointments (public insert, admin manage)
CREATE POLICY "Anyone can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for gallery_images (public read, admin write)
CREATE POLICY "Anyone can view active gallery images"
ON public.gallery_images FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage gallery images"
ON public.gallery_images FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for business_hours (public read, admin write)
CREATE POLICY "Anyone can view business hours"
ON public.business_hours FOR SELECT
USING (true);

CREATE POLICY "Admins can manage business hours"
ON public.business_hours FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services from the existing data
INSERT INTO public.services (name, category, description, duration, price, popular) VALUES
('Full Set Acrylics', 'nails', 'Full set of sculpted acrylic nails with your choice of shape and length', '2 hrs', 65, true),
('Acrylic Fill', 'nails', 'Maintenance fill for existing acrylic nails', '1.5 hrs', 45, false),
('Gel Manicure', 'nails', 'Long-lasting gel polish with nail shaping and cuticle care', '1 hr', 40, true),
('Classic Manicure', 'nails', 'Traditional manicure with nail shaping, cuticle care, and polish', '45 min', 25, false),
('Spa Pedicure', 'nails', 'Relaxing pedicure with exfoliation, massage, and polish', '1 hr', 50, false),
('Nail Art Add-on', 'nails', 'Custom nail art designs (per nail)', '15 min', 5, false),
('Classic Lash Set', 'lashes', 'Natural-looking lash extensions, one extension per natural lash', '2 hrs', 120, true),
('Hybrid Lash Set', 'lashes', 'Mix of classic and volume lashes for a textured look', '2.5 hrs', 150, false),
('Volume Lash Set', 'lashes', 'Multiple lightweight extensions per lash for dramatic fullness', '3 hrs', 180, true),
('Lash Fill', 'lashes', 'Maintenance fill for existing lash extensions (2-3 weeks)', '1 hr', 60, false),
('Lash Removal', 'lashes', 'Safe removal of existing lash extensions', '30 min', 25, false);

-- Insert default business hours (Mon-Sat 9am-6pm, Sun closed)
INSERT INTO public.business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(0, NULL, NULL, true),           -- Sunday - Closed
(1, '09:00', '18:00', false),    -- Monday
(2, '09:00', '18:00', false),    -- Tuesday
(3, '09:00', '18:00', false),    -- Wednesday
(4, '09:00', '18:00', false),    -- Thursday
(5, '09:00', '18:00', false),    -- Friday
(6, '10:00', '16:00', false);    -- Saturday

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update gallery images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));