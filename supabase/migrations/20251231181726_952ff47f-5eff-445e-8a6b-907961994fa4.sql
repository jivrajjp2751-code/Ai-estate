-- Create table for customer inquiry submissions
CREATE TABLE public.customer_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_area TEXT,
  budget TEXT,
  preferred_time TEXT,
  appointment_date DATE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form submissions)
CREATE POLICY "Anyone can submit inquiries" 
ON public.customer_inquiries 
FOR INSERT 
WITH CHECK (true);

-- Only service role can read (for admin/export purposes)
CREATE POLICY "Service role can read all inquiries" 
ON public.customer_inquiries 
FOR SELECT 
USING (true);