-- Create storage bucket for analysis photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'analysis-photos',
  'analysis-photos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create policies for analysis-photos bucket
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'analysis-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'analysis-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'analysis-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create analyses table to store analysis results
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_urls TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  looks_score DECIMAL(3,1),
  strengths TEXT[],
  weaknesses TEXT[],
  priorities TEXT[],
  detailed_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analyses"
ON public.analyses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses"
ON public.analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
ON public.analyses
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();