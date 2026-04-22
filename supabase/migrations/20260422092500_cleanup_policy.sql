-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cleanup job
-- This will run every day at 03:00 AM
SELECT cron.schedule(
  'cleanup-old-chat-files',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mrqdmvkpmyielmbokuih.supabase.co/functions/v1/delete-old-files',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM secrets.get('SERVICE_ROLE_KEY'))
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Note: You might need to manually set the SERVICE_ROLE_KEY in your Vault 
-- or replace it with the hardcoded key if you prefer (not recommended).
-- Alternatively, if you don't have vault/secrets schema, you can use a simpler approach.
