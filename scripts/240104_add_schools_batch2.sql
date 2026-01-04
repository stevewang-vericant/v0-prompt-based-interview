-- File: 240104_add_schools_batch2.sql
-- Purpose: Add additional schools to the database
-- Affected Tables: schools
-- Dependencies: None
-- Date: 2024-01-04
--
-- This script adds new schools to the schools table.
-- Schools that already exist (by code or name) are skipped.
-- Default password: asdf123!
-- Default prompts are automatically assigned.

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'phillips-academy-andover',
  'Phillips Academy Andover',
  'admin@phillips-academy-andover.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'phillips-exeter-academy',
  'Phillips Exeter Academy',
  'admin@phillips-exeter-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'groton-school',
  'Groton School',
  'admin@groton-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-pauls-school',
  'St. Paul''s School',
  'admin@st-pauls-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-hotchkiss-school',
  'The Hotchkiss School',
  'admin@the-hotchkiss-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'deerfield-academy',
  'Deerfield Academy',
  'admin@deerfield-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'milton-academy',
  'Milton Academy',
  'admin@milton-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'cate-school',
  'Cate School',
  'admin@cate-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-thacher-school',
  'The Thacher School',
  'admin@the-thacher-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'suffield-academy',
  'Suffield Academy',
  'admin@suffield-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'dana-hall-school',
  'Dana Hall School',
  'admin@dana-hall-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-hill-school',
  'The Hill School',
  'admin@the-hill-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-georges-school',
  'St. George''s School',
  'admin@st-georges-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'williston-northampton-school',
  'Williston Northampton School',
  'admin@williston-northampton-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-stony-brook-school',
  'The Stony Brook School',
  'admin@the-stony-brook-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'northfield-mount-hermon-school',
  'Northfield Mount Hermon School',
  'admin@northfield-mount-hermon-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'stevenson-school',
  'Stevenson School',
  'admin@stevenson-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'culver-academies',
  'Culver Academies',
  'admin@culver-academies.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'westminster-school-ct',
  'Westminster School, CT',
  'admin@westminster-school-ct.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'princeton-international-school-of-mathematics-and',
  'Princeton International School of Mathematics and Science',
  'admin@princeton-international-school-of-mathematics-and.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-athenian-school',
  'The Athenian School',
  'admin@the-athenian-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-bolles-school',
  'The Bolles School',
  'admin@the-bolles-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'woodberry-forest-school',
  'Woodberry Forest School',
  'admin@woodberry-forest-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'holderness-school',
  'Holderness School',
  'admin@holderness-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'windermere-preparatory-school',
  'Windermere Preparatory School',
  'admin@windermere-preparatory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'lolani-school',
  '''lolani School',
  'admin@lolani-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-ethel-walker-school',
  'The Ethel Walker School',
  'admin@the-ethel-walker-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'baylor-school',
  'Baylor School',
  'admin@baylor-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-village-school',
  'The Village School',
  'admin@the-village-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'shady-side-academy',
  'Shady Side Academy',
  'admin@shady-side-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'thomas-jefferson-school',
  'Thomas Jefferson School',
  'admin@thomas-jefferson-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'millbrook-school',
  'Millbrook School',
  'admin@millbrook-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'westover-school',
  'Westover School',
  'admin@westover-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-grier-school',
  'The Grier School',
  'admin@the-grier-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'portsmouth-abbey-school',
  'Portsmouth Abbey School',
  'admin@portsmouth-abbey-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-masters-school',
  'The Masters School',
  'admin@the-masters-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'avon-old-farms-school',
  'Avon Old Farms School',
  'admin@avon-old-farms-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'saint-marys-school',
  'Saint Mary''s School',
  'admin@saint-marys-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'fountain-valley-school',
  'Fountain Valley School',
  'admin@fountain-valley-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'chaminade-college-prep-school',
  'Chaminade College Prep School',
  'admin@chaminade-college-prep-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'indian-springs-school',
  'Indian Springs School',
  'admin@indian-springs-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'wayland-academy',
  'Wayland Academy',
  'admin@wayland-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'darlington-school',
  'Darlington School',
  'admin@darlington-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-frederick-gunn-school',
  'The Frederick Gunn School',
  'admin@the-frederick-gunn-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-storm-king-school',
  'The Storm King School',
  'admin@the-storm-king-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'santa-catalina-school',
  'Santa Catalina School',
  'admin@santa-catalina-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'worcester-academy',
  'Worcester Academy',
  'admin@worcester-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'justin-siena-high-school',
  'Justin-Siena High School',
  'admin@justin-siena-high-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-macduffie-school',
  'The MacDuffie School',
  'admin@the-macduffie-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'cats-academy-boston',
  'CATS Academy Boston',
  'admin@cats-academy-boston.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'annie-wright-school',
  'Annie Wright School',
  'admin@annie-wright-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'wasatch-academy',
  'Wasatch Academy',
  'admin@wasatch-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'gilmour-academy',
  'Gilmour Academy',
  'admin@gilmour-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'thornton-academy',
  'Thornton Academy',
  'admin@thornton-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-knox-school',
  'The Knox School',
  'admin@the-knox-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-annes-belfield-school',
  'St. Anne''s-Belfield School',
  'admin@st-annes-belfield-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'linden-hall-school-for-girls',
  'Linden Hall School for Girls',
  'admin@linden-hall-school-for-girls.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'garrison-forest-school',
  'Garrison Forest School',
  'admin@garrison-forest-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'hoosac-school',
  'Hoosac School',
  'admin@hoosac-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'maumee-valley-country-day-school',
  'Maumee Valley Country Day School',
  'admin@maumee-valley-country-day-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'miss-halls-school',
  'Miss Hall''s School',
  'admin@miss-halls-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-albans-school',
  'St. Albans School',
  'admin@st-albans-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ross-school',
  'Ross School',
  'admin@ross-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'shattuck-st-marys-school',
  'Shattuck-St. Mary''s School',
  'admin@shattuck-st-marys-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'dublin-school',
  'Dublin School',
  'admin@dublin-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-perkiomen-school',
  'The Perkiomen School',
  'admin@the-perkiomen-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'montverde-academy',
  'Montverde Academy',
  'admin@montverde-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'saint-johns-preparatory-school',
  'Saint John''s Preparatory School',
  'admin@saint-johns-preparatory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-timothys-school',
  'St. Timothy''s School',
  'admin@st-timothys-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'buffalo-seminary',
  'Buffalo Seminary',
  'admin@buffalo-seminary.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-johnsbury-academy',
  'St. Johnsbury Academy',
  'admin@st-johnsbury-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'miller-school-of-albemarle',
  'Miller School of Albemarle',
  'admin@miller-school-of-albemarle.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'rabun-gap-nacoochee-school',
  'Rabun Gap-Nacoochee School',
  'admin@rabun-gap-nacoochee-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-newman-school',
  'The Newman School',
  'admin@the-newman-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-putney-school',
  'The Putney School',
  'admin@the-putney-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'marianapolis-preparatory-school',
  'Marianapolis Preparatory School',
  'admin@marianapolis-preparatory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'gould-academy',
  'Gould Academy',
  'admin@gould-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'stoneleigh-burnham-school',
  'Stoneleigh-Burnham School',
  'admin@stoneleigh-burnham-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'vermont-academy',
  'Vermont Academy',
  'admin@vermont-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-brook-hill-school',
  'The Brook Hill School',
  'admin@the-brook-hill-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'springfield-commonwealth-academy',
  'Springfield Commonwealth Academy',
  'admin@springfield-commonwealth-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'salisbury-school',
  'Salisbury School',
  'admin@salisbury-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'solebury-school',
  'Solebury School',
  'admin@solebury-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-linsly-school',
  'The Linsly School',
  'admin@the-linsly-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'la-lumiere-school',
  'La Lumiere School',
  'admin@la-lumiere-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-andrews-school-ri',
  'St. Andrew''s School - RI',
  'admin@st-andrews-school-ri.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'proctor-academy',
  'Proctor Academy',
  'admin@proctor-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'salem-academy',
  'Salem Academy',
  'admin@salem-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'delphian-school',
  'Delphian School',
  'admin@delphian-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'mastery-school-of-hawken',
  'Mastery School of Hawken',
  'admin@mastery-school-of-hawken.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'new-hampton-school',
  'New Hampton School',
  'admin@new-hampton-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'chapel-hill-chauncy-hall-school',
  'Chapel Hill-Chauncy Hall School',
  'admin@chapel-hill-chauncy-hall-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'colorado-rocky-mountain-school',
  'Colorado Rocky Mountain School',
  'admin@colorado-rocky-mountain-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'south-kent-school',
  'South Kent School',
  'admin@south-kent-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-harvey-school',
  'The Harvey School',
  'admin@the-harvey-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'fryeburg-academy',
  'Fryeburg Academy',
  'admin@fryeburg-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'lake-tahoe-preparatory-school',
  'Lake Tahoe Preparatory School',
  'admin@lake-tahoe-preparatory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'midland-school',
  'Midland School',
  'admin@midland-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'hebron-academy',
  'Hebron Academy',
  'admin@hebron-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'hawaii-preparatory-academy',
  'Hawai''i Preparatory Academy',
  'admin@hawaii-preparatory-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'maine-central-institute',
  'Maine Central Institute',
  'admin@maine-central-institute.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'villanova-preparatory-school',
  'Villanova Preparatory School',
  'admin@villanova-preparatory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'mercyhurst-preparatory-school',
  'Mercyhurst Preparatory School',
  'admin@mercyhurst-preparatory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'woodstock-academy',
  'Woodstock Academy',
  'admin@woodstock-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'flintridge-sacred-heart-academy',
  'Flintridge Sacred Heart Academy',
  'admin@flintridge-sacred-heart-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'woodlands-academy-of-the-sacred-heart',
  'Woodlands Academy of the Sacred Heart',
  'admin@woodlands-academy-of-the-sacred-heart.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'christchurch-school',
  'Christchurch School',
  'admin@christchurch-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'tallulah-falls-school',
  'Tallulah Falls School',
  'admin@tallulah-falls-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'tmi-the-episcopal-school-of-texas',
  'TMI - The Episcopal School of Texas',
  'admin@tmi-the-episcopal-school-of-texas.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'hyde-school',
  'Hyde School',
  'admin@hyde-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'international-leadership-of-texas-iltexas',
  'International Leadership of Texas (ILTexas)',
  'admin@international-leadership-of-texas-iltexas.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'dunn-school',
  'Dunn School',
  'admin@dunn-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ben-lippen-school',
  'Ben Lippen School',
  'admin@ben-lippen-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'besant-hill-school',
  'Besant Hill School',
  'admin@besant-hill-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'kents-hill-school',
  'Kents Hill School',
  'admin@kents-hill-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'blue-ridge-school',
  'Blue Ridge School',
  'admin@blue-ridge-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'stuart-hall-school',
  'Stuart Hall School',
  'admin@stuart-hall-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'verde-valley-school',
  'Verde Valley School',
  'admin@verde-valley-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'tilton-school',
  'Tilton School',
  'admin@tilton-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'buxton-school',
  'Buxton School',
  'admin@buxton-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'north-cross-school',
  'North Cross School',
  'admin@north-cross-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'brewster-academy',
  'Brewster Academy',
  'admin@brewster-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'oakwood-friends-school',
  'Oakwood Friends School',
  'admin@oakwood-friends-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'andrews-osborne-academy',
  'Andrews Osborne Academy',
  'admin@andrews-osborne-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-calverton-school',
  'The Calverton School',
  'admin@the-calverton-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'oak-hill-academy',
  'Oak Hill Academy',
  'admin@oak-hill-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'washington-academy',
  'Washington Academy',
  'admin@washington-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-kiski-school',
  'The Kiski School',
  'admin@the-kiski-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-margarets-school',
  'St. Margaret''s School',
  'admin@st-margarets-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'west-nottingham-academy',
  'West Nottingham Academy',
  'admin@west-nottingham-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'saint-stanislaus',
  'Saint Stanislaus',
  'admin@saint-stanislaus.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ef-academy-new-york',
  'EF Academy New York',
  'admin@ef-academy-new-york.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'oldfields-school',
  'Oldfields School',
  'admin@oldfields-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'northwood-school',
  'Northwood School',
  'admin@northwood-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'saint-bede-academy',
  'Saint Bede Academy',
  'admin@saint-bede-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'monte-vista-christian-school',
  'Monte Vista Christian School',
  'admin@monte-vista-christian-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-andrews-sewanee-school',
  'St. Andrew''s-Sewanee School',
  'admin@st-andrews-sewanee-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-croix-lutheran-academy',
  'St. Croix Lutheran Academy',
  'admin@st-croix-lutheran-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-marvelwood-school',
  'The Marvelwood School',
  'admin@the-marvelwood-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'martin-luther-high-school',
  'Martin Luther High School',
  'admin@martin-luther-high-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'lyndon-institute',
  'Lyndon Institute',
  'admin@lyndon-institute.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'oak-grove-school',
  'Oak Grove School',
  'admin@oak-grove-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'scattergood-friends-school',
  'Scattergood Friends School',
  'admin@scattergood-friends-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'lexington-christian-academy',
  'Lexington Christian Academy',
  'admin@lexington-christian-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'foxcroft-academy',
  'Foxcroft Academy',
  'admin@foxcroft-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'rice-memorial-high-school',
  'Rice Memorial High School',
  'admin@rice-memorial-high-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-boys-latin-school-of-maryland',
  'The Boys'' Latin School of Maryland',
  'admin@the-boys-latin-school-of-maryland.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admiral-farragut-academy',
  'Admiral Farragut Academy',
  'admin@admiral-farragut-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-kings-academy-tn',
  'The King''s Academy-TN',
  'admin@the-kings-academy-tn.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'southwestern-academy-ca',
  'Southwestern Academy (CA)',
  'admin@southwestern-academy-ca.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'cotter-schools',
  'Cotter Schools',
  'admin@cotter-schools.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'north-cedar-academy',
  'North Cedar Academy',
  'admin@north-cedar-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'academy-of-the-new-church-secondary-schools',
  'Academy of the New Church Secondary Schools',
  'admin@academy-of-the-new-church-secondary-schools.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'florida-preparatory-academy',
  'Florida Preparatory Academy',
  'admin@florida-preparatory-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'subiaco-academy',
  'Subiaco Academy',
  'admin@subiaco-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'san-marcos-academy',
  'San Marcos Academy',
  'admin@san-marcos-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'south-hills-academy',
  'South Hills Academy',
  'admin@south-hills-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-bernard-preparatory-school',
  'St. Bernard Preparatory School',
  'admin@st-bernard-preparatory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'george-stevens-academy',
  'George Stevens Academy',
  'admin@george-stevens-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ojai-valley-school',
  'Ojai Valley School',
  'admin@ojai-valley-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-thomas-more-school',
  'St. Thomas More School',
  'admin@st-thomas-more-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'academy-of-the-sacred-heart',
  'Academy of the Sacred Heart',
  'admin@academy-of-the-sacred-heart.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'rock-point-school',
  'Rock Point School',
  'admin@rock-point-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'houghton-academy',
  'Houghton Academy',
  'admin@houghton-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'archbishop-riordan-high-school',
  'Archbishop Riordan High School',
  'admin@archbishop-riordan-high-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'olney-friends-school',
  'Olney Friends School',
  'admin@olney-friends-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'maur-hill-mount-academy',
  'Maur Hill - Mount Academy',
  'admin@maur-hill-mount-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-woodhall-school',
  'The Woodhall School',
  'admin@the-woodhall-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'forman-school',
  'Forman School',
  'admin@forman-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ef-academy-pasadena',
  'EF Academy Pasadena',
  'admin@ef-academy-pasadena.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'putnam-science-academy-ct',
  'Putnam Science Academy CT',
  'admin@putnam-science-academy-ct.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-leelanau-school',
  'The Leelanau School',
  'admin@the-leelanau-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'marshall-school',
  'Marshall School',
  'admin@marshall-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'darrow-school',
  'Darrow School',
  'admin@darrow-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-phelps-school',
  'The Phelps School',
  'admin@the-phelps-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'high-mowing-school',
  'High Mowing School',
  'admin@high-mowing-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'steamboat-mountain-school',
  'Steamboat Mountain School',
  'admin@steamboat-mountain-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'asia-pacific-international-school',
  'Asia Pacific International School',
  'admin@asia-pacific-international-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'thomas-more-prep-marian',
  'Thomas More Prep-Marian',
  'admin@thomas-more-prep-marian.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-montfort-academy',
  'The Montfort Academy',
  'admin@the-montfort-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'academy-of-the-holy-family',
  'Academy of the Holy Family',
  'admin@academy-of-the-holy-family.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'auburn-adventist-academy',
  'Auburn Adventist Academy',
  'admin@auburn-adventist-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'grand-river-academy',
  'Grand River Academy',
  'admin@grand-river-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bridgton-academy',
  'Bridgton Academy',
  'admin@bridgton-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'oakdale-christian-academy',
  'Oakdale Christian Academy',
  'admin@oakdale-christian-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'robinson-school',
  'Robinson School',
  'admin@robinson-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'lee-academy',
  'Lee Academy',
  'admin@lee-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'lustre-christian-high-school',
  'Lustre Christian High School',
  'admin@lustre-christian-high-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-hill-school-middleburg-va',
  'The Hill School, Middleburg VA',
  'admin@the-hill-school-middleburg-va.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'merrick-preparatory-school',
  'Merrick Preparatory School',
  'admin@merrick-preparatory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-margarets-school',
  'St. Margaret''s School',
  'admin@st-margarets-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'erie-first-christian-academy',
  'Erie First Christian Academy',
  'admin@erie-first-christian-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-orme-school',
  'The Orme School',
  'admin@the-orme-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ashley-hall',
  'Ashley Hall',
  'admin@ashley-hall.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'brandon-hall-school',
  'Brandon Hall School',
  'admin@brandon-hall-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'whittle-school-and-studios',
  'Whittle School and Studios',
  'admin@whittle-school-and-studios.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'randolph-macon-academy',
  'Randolph-Macon Academy',
  'admin@randolph-macon-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'canyonville-christian-academy',
  'Canyonville Christian Academy',
  'admin@canyonville-christian-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'summer-at-porters',
  'Summer at Porter''s',
  'admin@summer-at-porters.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'oprah-winfrey-leadership-academy-miss-porters-scho',
  'Oprah Winfrey Leadership Academy Miss Porter''s School Global Summit',
  'admin@oprah-winfrey-leadership-academy-miss-porters-scho.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'southwestern-academy-az',
  'Southwestern Academy AZ',
  'admin@southwestern-academy-az.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'shawnigan-lake-school',
  'Shawnigan Lake School',
  'admin@shawnigan-lake-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bodwell-high-school',
  'Bodwell High School',
  'admin@bodwell-high-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'brentwood-college-school',
  'Brentwood College School',
  'admin@brentwood-college-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-georges-school-vancouver',
  'St. George''s School, Vancouver',
  'admin@st-georges-school-vancouver.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-michaels-university-school',
  'St. Michaels University School',
  'admin@st-michaels-university-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-high-school-at-vancouver-island-university',
  'The High School at Vancouver Island University',
  'admin@the-high-school-at-vancouver-island-university.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-kings-academy-ca',
  'The King''s Academy, CA',
  'admin@the-kings-academy-ca.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'idyllwild-arts-academy',
  'Idyllwild Arts Academy',
  'admin@idyllwild-arts-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'walnut-hill-school-for-the-arts',
  'Walnut Hill School for the Arts',
  'admin@walnut-hill-school-for-the-arts.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-johns-ravenscourt-school',
  'St. John''s-Ravenscourt School',
  'admin@st-johns-ravenscourt-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'interlochen-arts-academy',
  'Interlochen Arts Academy',
  'admin@interlochen-arts-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'rothesay-netherwood',
  'Rothesay Netherwood',
  'admin@rothesay-netherwood.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'purnell-school',
  'Purnell School',
  'admin@purnell-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bronte-college',
  'Bronte College',
  'admin@bronte-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'fulford-academy',
  'Fulford Academy',
  'admin@fulford-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'j-addison-school',
  'J. Addison School',
  'admin@j-addison-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'nancy-campbell-academy',
  'Nancy Campbell Academy',
  'admin@nancy-campbell-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'robert-land-academy',
  'Robert Land Academy',
  'admin@robert-land-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'rosseau-lake-college',
  'Rosseau Lake College',
  'admin@rosseau-lake-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'branksome-hall',
  'Branksome Hall',
  'admin@branksome-hall.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'havergal-college',
  'Havergal College',
  'admin@havergal-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-bishop-strachan-school',
  'The Bishop Strachan School',
  'admin@the-bishop-strachan-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'trinity-college-school',
  'Trinity College School',
  'admin@trinity-college-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'upper-canada-college',
  'Upper Canada College',
  'admin@upper-canada-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-webb-schools-summer-program-junior-scholars-pr',
  'The Webb Schools Summer Program – Junior Scholars Program',
  'admin@the-webb-schools-summer-program-junior-scholars-pr.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'appleby-college',
  'Appleby College',
  'admin@appleby-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'albert-college',
  'Albert College',
  'admin@albert-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ashbury-college',
  'Ashbury College',
  'admin@ashbury-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bishops-college-school',
  'Bishop''s College School',
  'admin@bishops-college-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'stanstead-college',
  'Stanstead College',
  'admin@stanstead-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ashley-hall-school',
  'Ashley Hall School',
  'admin@ashley-hall-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'indian-mountain-school',
  'Indian Mountain School',
  'admin@indian-mountain-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'eaglebrook-school',
  'Eaglebrook School',
  'admin@eaglebrook-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'the-rectory-school',
  'The Rectory School',
  'admin@the-rectory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'applewild-school',
  'Applewild School',
  'admin@applewild-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-catherines-academy',
  'St. Catherine''s Academy',
  'admin@st-catherines-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'hampshire-country-school',
  'Hampshire Country School',
  'admin@hampshire-country-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'oakland-school',
  'Oakland School',
  'admin@oakland-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'rumsey-hall-school',
  'Rumsey Hall School',
  'admin@rumsey-hall-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'hillside-school-ma',
  'Hillside School, MA',
  'admin@hillside-school-ma.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'fay-school',
  'Fay School',
  'admin@fay-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bement-school',
  'Bement School',
  'admin@bement-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'cardigan-mountain-school',
  'Cardigan Mountain School',
  'admin@cardigan-mountain-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-marks-school-of-texas',
  'St. Mark''s School Of Texas',
  'admin@st-marks-school-of-texas.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'glenlyon-norfolk-school',
  'Glenlyon Norfolk School',
  'admin@glenlyon-norfolk-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'capecod-academy',
  'Capecod Academy',
  'admin@capecod-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ranney-school',
  'Ranney School',
  'admin@ranney-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'army-and-navy-academy',
  'Army and Navy Academy',
  'admin@army-and-navy-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'lman-manhattan-preparatory-school',
  'Léman Manhattan Preparatory School',
  'admin@lman-manhattan-preparatory-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'missouri-military-academy',
  'Missouri Military Academy',
  'admin@missouri-military-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'hackley-school',
  'Hackley School',
  'admin@hackley-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'international-junior-golf-academy',
  'International Junior Golf Academy',
  'admin@international-junior-golf-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'villanova-college',
  'Villanova College',
  'admin@villanova-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'american-heritage-schools',
  'American Heritage Schools',
  'admin@american-heritage-schools.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ideaventions-academy',
  'Ideaventions Academy',
  'admin@ideaventions-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'valley-forge-military-academy',
  'Valley Forge Military Academy',
  'admin@valley-forge-military-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'summer-at-stevenson',
  'Summer at Stevenson',
  'admin@summer-at-stevenson.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'fryeburg-academy',
  'Fryeburg Academy',
  'admin@fryeburg-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'fryeburg-academy-summer',
  'Fryeburg Academy Summer',
  'admin@fryeburg-academy-summer.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'queen-ethelburgas-college',
  'Queen Ethelburga''s College',
  'admin@queen-ethelburgas-college.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'moravian-academy',
  'Moravian Academy',
  'admin@moravian-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'fork-union-military-academy',
  'Fork Union Military Academy',
  'admin@fork-union-military-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'tasis-england',
  'TASIS England',
  'admin@tasis-england.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'truro-school',
  'Truro School',
  'admin@truro-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'st-leonards-school',
  'St Leonards School',
  'admin@st-leonards-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'mid-pacific-institute',
  'Mid-Pacific Institute',
  'admin@mid-pacific-institute.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'leighton-park-school',
  'Leighton Park School',
  'admin@leighton-park-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'epsom-college-malaysia',
  'Epsom College Malaysia',
  'admin@epsom-college-malaysia.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'institut-montana-switzerland',
  'Institut Montana Switzerland',
  'admin@institut-montana-switzerland.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'hawaii-preparatory-academy',
  'Hawaii Preparatory Academy',
  'admin@hawaii-preparatory-academy.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'farlington-school',
  'Farlington School',
  'admin@farlington-school.com',
  '$2b$10$.PbQEohL4MPujrstfH2b8uC234MbZJ1wFjWwwU0sKhPXSq0KrX.gG',
  true,
  ARRAY['f779c098-c5cb-4235-a37e-fa67ad8ec6cd', 'afaf49b6-374f-4826-945e-40f495ed92d5', '9551e94e-87e1-41fa-bec3-c93a8267b751', '831006b6-d28d-4bf8-8e49-f262b855e60f'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;
