
-- Inserir um usuário padrão no sistema de autenticação do Supabase
-- Email: admin@test.com
-- Senha: 123456
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Inserir o mesmo usuário na tabela identities para completar o registro
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'admin@test.com'),
  jsonb_build_object('sub', (SELECT id FROM auth.users WHERE email = 'admin@test.com')::text, 'email', 'admin@test.com'),
  'email',
  (SELECT id FROM auth.users WHERE email = 'admin@test.com')::text,
  now(),
  now(),
  now()
);
