-- Block disposable/temporary email signups at the database level
-- This is the last line of defense if frontend and API checks are bypassed

CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
  domain TEXT PRIMARY KEY,
  added_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read blocked domains" ON public.blocked_email_domains FOR SELECT USING (true);

-- Seed with top domains from Kickbox/Burner-Email-Providers open-source lists
INSERT INTO public.blocked_email_domains (domain) VALUES
  ('mailinator.com'), ('guerrillamail.com'), ('tempmail.com'), ('10minutemail.com'),
  ('yopmail.com'), ('trashmail.com'), ('dispostable.com'), ('getairmail.com'),
  ('sharklasers.com'), ('throwaway.email'), ('temp-mail.org'), ('fakeinbox.com'),
  ('mailnesia.com'), ('maildrop.cc'), ('discard.email'), ('burnermail.io'),
  ('mohmal.com'), ('emailondeck.com'), ('getnada.com'), ('tempail.com'),
  ('guerrillamailblock.com'), ('grr.la'), ('guerrillamail.info'), ('guerrillamail.net'),
  ('guerrillamail.de'), ('crazymailing.com'), ('harakirimail.com'), ('tempr.email'),
  ('mailsac.com'), ('mytemp.email'), ('inboxkitten.com'), ('minutemail.com'),
  ('spamgourmet.com'), ('trashmail.net'), ('yopmail.fr'), ('mailcatch.com'),
  ('tempinbox.com'), ('trash-mail.com'), ('binkmail.com'), ('filzmail.com'),
  ('jetable.org'), ('tmail.ws'), ('mailexpire.com'), ('incognitomail.org'),
  ('mailforspam.com'), ('spam4.me'), ('mailinator.net'), ('tempmailo.com'),
  ('temp-mail.de'), ('temp-mail.ru'), ('temp-mail.live'), ('tempmail.eu'),
  ('tempmailer.com'), ('tempomail.fr'), ('temporaryemail.net'),
  ('temporaryinbox.com'), ('throwawayemailaddress.com'), ('trashmail.io'),
  ('trashmail.org'), ('trashmail.ws'), ('trashmailer.com'), ('trashymail.com')
ON CONFLICT DO NOTHING;

-- Trigger function to block disposable emails on signup
CREATE OR REPLACE FUNCTION public.check_disposable_email()
RETURNS TRIGGER AS $$
DECLARE
  domain_part TEXT;
BEGIN
  domain_part := lower(split_part(NEW.email, '@', 2));
  IF EXISTS (SELECT 1 FROM public.blocked_email_domains WHERE domain = domain_part) THEN
    RAISE EXCEPTION 'Disposable or temporary email addresses are not permitted. Please use a permanent email.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger on auth.users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_disposable_email_signup'
  ) THEN
    CREATE TRIGGER prevent_disposable_email_signup
      BEFORE INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.check_disposable_email();
  END IF;
END;
$$;
