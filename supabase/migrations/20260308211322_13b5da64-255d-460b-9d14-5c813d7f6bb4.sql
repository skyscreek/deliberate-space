
-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

-- Generate usernames from display_name for existing profiles
UPDATE public.profiles SET username = 
  lower(regexp_replace(regexp_replace(display_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
  || '-' || substr(id::text, 1, 4);

ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET DEFAULT '';

-- Auto-generate username on new profile creation
CREATE OR REPLACE FUNCTION public.generate_profile_username()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  base_username := lower(regexp_replace(regexp_replace(NEW.display_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_username := left(base_username, 30);
  base_username := regexp_replace(base_username, '-+$', '');
  
  final_username := base_username;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username AND id != NEW.id) THEN
      NEW.username := final_username;
      RETURN NEW;
    END IF;
    counter := counter + 1;
    final_username := base_username || '-' || counter;
  END LOOP;
END;
$function$;

CREATE TRIGGER set_profile_username
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.username IS NULL OR NEW.username = '')
  EXECUTE FUNCTION public.generate_profile_username();
