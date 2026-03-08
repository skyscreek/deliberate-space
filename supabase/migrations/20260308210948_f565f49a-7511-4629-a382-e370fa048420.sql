
-- Add slug column to topics
ALTER TABLE public.topics ADD COLUMN slug text UNIQUE;

-- Generate slugs for existing topics from title
UPDATE public.topics SET slug = 
  lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) 
  || '-' || substr(id::text, 1, 4);

-- Make slug NOT NULL after backfilling
ALTER TABLE public.topics ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.topics ALTER COLUMN slug SET DEFAULT '';

-- Create function to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.generate_topic_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  -- Trim to reasonable length
  base_slug := left(base_slug, 60);
  -- Remove trailing hyphens
  base_slug := regexp_replace(base_slug, '-+$', '');
  
  final_slug := base_slug;
  LOOP
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.topics WHERE slug = final_slug AND id != NEW.id) THEN
      NEW.slug := final_slug;
      RETURN NEW;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
END;
$function$;

-- Attach trigger
CREATE TRIGGER set_topic_slug
  BEFORE INSERT ON public.topics
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION public.generate_topic_slug();
