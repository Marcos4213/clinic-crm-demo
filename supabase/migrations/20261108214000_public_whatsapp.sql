alter table public.clinic_settings
  add column public_whatsapp text not null default '';

alter table public.clinic_settings
  add constraint clinic_settings_public_whatsapp_len
  check (char_length(public_whatsapp) <= 80);

alter table public.clinic_settings
  add constraint clinic_settings_public_whatsapp_shape
  check (
    public_whatsapp = ''
    or public_whatsapp ~ '^https://wa\.me/[0-9]{8,15}$'
    or public_whatsapp ~ '^https://wa\.me/qr/[A-Za-z0-9]{4,64}$'
    or public_whatsapp ~ '^https://wa\.me/message/[A-Za-z0-9]{4,64}$'
  );
