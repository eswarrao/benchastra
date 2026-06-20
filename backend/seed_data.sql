-- =============================================================
-- seed_data.sql  –  run AFTER users exist (signup or init_db.py)
-- Dynamically finds the most-recently-created client and vendor.
-- Safe to re-run — cleans up previous seed rows first.
--
-- Usage:
--   psql -U postgres -d benchbridge -f backend/seed_data.sql
--
-- To target specific users instead, set the email variables below.
-- =============================================================

DO $$
DECLARE
  -- Override these to target a specific account; NULL = most recent by role
  v_client_email  TEXT := NULL;
  v_vendor_email  TEXT := NULL;

  v_client_id     INT;
  v_vendor_id     INT;
  v_req1_id       INT;
  v_req2_id       INT;
  v_req3_id       INT;
  v_req4_id       INT;
  v_req5_id       INT;
  v_res1_id       INT;
  v_res2_id       INT;
  v_res3_id       INT;
  v_res4_id       INT;
  v_res5_id       INT;
  v_res6_id       INT;
  v_con1_id       INT;
BEGIN

  -- ── Resolve user IDs ──────────────────────────────────────
  IF v_client_email IS NOT NULL THEN
    SELECT id INTO v_client_id FROM users WHERE email = v_client_email;
  ELSE
    -- Most recently created client (i.e. your own signup account)
    SELECT id INTO v_client_id FROM users WHERE role = 'client' ORDER BY id DESC LIMIT 1;
  END IF;

  IF v_vendor_email IS NOT NULL THEN
    SELECT id INTO v_vendor_id FROM users WHERE email = v_vendor_email;
  ELSE
    SELECT id INTO v_vendor_id FROM users WHERE role = 'vendor' ORDER BY id DESC LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'No client user found. Sign up as a client first (or run python init_db.py).';
  END IF;
  IF v_vendor_id IS NULL THEN
    RAISE EXCEPTION 'No vendor user found. Sign up as a vendor first (or run python init_db.py).';
  END IF;

  RAISE NOTICE 'Seeding data  →  client_id = %,  vendor_id = %', v_client_id, v_vendor_id;

  -- ── Clean up previous seed data (safe, targets named IDs only) ──
  DELETE FROM subscriptions  WHERE user_id IN (v_client_id, v_vendor_id);

  DELETE FROM messages
    WHERE (sender_id = v_client_id AND receiver_id = v_vendor_id)
       OR (sender_id = v_vendor_id AND receiver_id = v_client_id);

  DELETE FROM notifications  WHERE user_id IN (v_client_id, v_vendor_id);

  DELETE FROM invoices
    WHERE invoice_id IN ('INV-2025-001','INV-2025-002','INV-2025-003');

  DELETE FROM contracts      WHERE contract_id = 'CON-2025-001';

  DELETE FROM matches
    WHERE requirement_id IN (
      SELECT id FROM requirements
      WHERE requirement_id IN ('REQ-001','REQ-002','REQ-003','REQ-004','REQ-005')
    );

  DELETE FROM requirements
    WHERE requirement_id IN ('REQ-001','REQ-002','REQ-003','REQ-004','REQ-005');

  DELETE FROM resources
    WHERE resource_id IN ('RES-001','RES-002','RES-003','RES-004','RES-005','RES-006');

  -- ── Requirements ──────────────────────────────────────────
  INSERT INTO requirements
    (requirement_id, client_id, role, experience_min, experience_max,
     positions, skills, must_have_skills, good_to_have_skills,
     budget_min, budget_max, duration, work_mode,
     start_date, location, description, status)
  VALUES ('REQ-001', v_client_id, 'DevOps Engineer', 5, 8, 2,
    '["AWS","Docker","Kubernetes","Terraform"]'::json,
    '["AWS","Kubernetes"]'::json,
    '["Ansible","Jenkins"]'::json,
    100000, 150000, '12 Months', 'Hybrid', 'Immediate', 'Bangalore',
    'Looking for a senior DevOps engineer to manage cloud infrastructure.', 'Open')
  RETURNING id INTO v_req1_id;

  INSERT INTO requirements
    (requirement_id, client_id, role, experience_min, experience_max,
     positions, skills, must_have_skills, good_to_have_skills,
     budget_min, budget_max, duration, work_mode,
     start_date, location, description, status)
  VALUES ('REQ-002', v_client_id, 'Java Developer', 7, 10, 1,
    '["Java","Spring Boot","Microservices","PostgreSQL"]'::json,
    '["Java","Spring Boot"]'::json,
    '["Kafka","Redis"]'::json,
    120000, 180000, '6 Months', 'Remote', 'Immediate', 'Pune',
    'Lead Java developer for a microservices-based banking platform.', 'Open')
  RETURNING id INTO v_req2_id;

  INSERT INTO requirements
    (requirement_id, client_id, role, experience_min, experience_max,
     positions, skills, must_have_skills, good_to_have_skills,
     budget_min, budget_max, duration, work_mode,
     start_date, location, description, status)
  VALUES ('REQ-003', v_client_id, 'React Frontend Developer', 3, 6, 3,
    '["React","TypeScript","Tailwind CSS","REST APIs"]'::json,
    '["React","TypeScript"]'::json,
    '["Next.js","GraphQL"]'::json,
    80000, 120000, '6 Months', 'Remote', 'Immediate', 'Hyderabad',
    'Frontend developers for a talent marketplace SaaS product.', 'Open')
  RETURNING id INTO v_req3_id;

  INSERT INTO requirements
    (requirement_id, client_id, role, experience_min, experience_max,
     positions, skills, must_have_skills, good_to_have_skills,
     budget_min, budget_max, duration, work_mode,
     start_date, location, description, status)
  VALUES ('REQ-004', v_client_id, 'Data Engineer', 4, 7, 1,
    '["Python","Apache Spark","Databricks","Azure"]'::json,
    '["Python","Spark"]'::json,
    '["dbt","Airflow"]'::json,
    110000, 160000, '12 Months', 'Hybrid', 'Immediate', 'Bangalore',
    'Build and maintain data pipelines for analytics platform.', 'Open')
  RETURNING id INTO v_req4_id;

  INSERT INTO requirements
    (requirement_id, client_id, role, experience_min, experience_max,
     positions, skills, must_have_skills, good_to_have_skills,
     budget_min, budget_max, duration, work_mode,
     start_date, location, description, status)
  VALUES ('REQ-005', v_client_id, 'Scrum Master', 3, 6, 1,
    '["Agile","Scrum","Jira","Confluence"]'::json,
    '["Scrum"]'::json,
    '["SAFe","Kanban"]'::json,
    90000, 130000, '6 Months', 'Onsite', 'Immediate', 'Chennai',
    'Experienced Scrum Master for a digital transformation programme.', 'Closed')
  RETURNING id INTO v_req5_id;

  -- ── Resources ─────────────────────────────────────────────
  INSERT INTO resources
    (resource_id, vendor_id, name, skill_domain, experience, experience_years,
     availability, availability_days, base_rate, location,
     email, phone, summary, skills, status)
  VALUES ('RES-001', v_vendor_id, 'Arjun Mehta', 'DevOps / Cloud',
    '6 yrs', 6, 'Immediate', 0, 130000, 'Bangalore',
    'arjun.mehta@vendor.com', '+91 98100 11111',
    'AWS-certified DevOps professional with strong Kubernetes and Terraform expertise.',
    '["AWS","Kubernetes","Terraform","Docker","Jenkins","Ansible"]'::json, 'Available')
  RETURNING id INTO v_res1_id;

  INSERT INTO resources
    (resource_id, vendor_id, name, skill_domain, experience, experience_years,
     availability, availability_days, base_rate, location,
     email, phone, summary, skills, status)
  VALUES ('RES-002', v_vendor_id, 'Priya Sharma', 'Java / Backend',
    '8 yrs', 8, '15 days', 15, 160000, 'Pune',
    'priya.sharma@vendor.com', '+91 98100 22222',
    'Senior Java developer with deep Spring Boot and microservices experience.',
    '["Java","Spring Boot","Microservices","PostgreSQL","Kafka","Redis"]'::json, 'Available')
  RETURNING id INTO v_res2_id;

  INSERT INTO resources
    (resource_id, vendor_id, name, skill_domain, experience, experience_years,
     availability, availability_days, base_rate, location,
     email, phone, summary, skills, status)
  VALUES ('RES-003', v_vendor_id, 'Rohan Verma', 'React / Frontend',
    '4 yrs', 4, 'Immediate', 0, 95000, 'Hyderabad',
    'rohan.verma@vendor.com', '+91 98100 33333',
    'Frontend specialist in React and TypeScript with UI/UX sensibility.',
    '["React","TypeScript","Tailwind CSS","Next.js","REST APIs"]'::json, 'Available')
  RETURNING id INTO v_res3_id;

  INSERT INTO resources
    (resource_id, vendor_id, name, skill_domain, experience, experience_years,
     availability, availability_days, base_rate, location,
     email, phone, summary, skills, status)
  VALUES ('RES-004', v_vendor_id, 'Sneha Patel', 'Data Engineering',
    '5 yrs', 5, '30 days', 30, 140000, 'Bangalore',
    'sneha.patel@vendor.com', '+91 98100 44444',
    'Data engineer with Spark, Databricks and Azure Data Factory experience.',
    '["Python","Apache Spark","Databricks","Azure","dbt","Airflow"]'::json, 'Available')
  RETURNING id INTO v_res4_id;

  INSERT INTO resources
    (resource_id, vendor_id, name, skill_domain, experience, experience_years,
     availability, availability_days, base_rate, location,
     email, phone, summary, skills, status)
  VALUES ('RES-005', v_vendor_id, 'Kiran Nair', 'Agile / Scrum',
    '5 yrs', 5, 'Immediate', 0, 110000, 'Chennai',
    'kiran.nair@vendor.com', '+91 98100 55555',
    'Certified Scrum Master with SAFe experience across large agile programmes.',
    '["Agile","Scrum","Jira","Confluence","SAFe","Kanban"]'::json, 'Busy')
  RETURNING id INTO v_res5_id;

  INSERT INTO resources
    (resource_id, vendor_id, name, skill_domain, experience, experience_years,
     availability, availability_days, base_rate, location,
     email, phone, summary, skills, status)
  VALUES ('RES-006', v_vendor_id, 'Deepak Kumar', 'Full Stack',
    '7 yrs', 7, 'Immediate', 0, 155000, 'Mumbai',
    'deepak.kumar@vendor.com', '+91 98100 66666',
    'Full-stack engineer comfortable across React frontend and Node/Java backends.',
    '["React","Node.js","Java","PostgreSQL","Docker","AWS"]'::json, 'Available')
  RETURNING id INTO v_res6_id;

  -- ── Matches ───────────────────────────────────────────────
  INSERT INTO matches (requirement_id, resource_id, match_score, status)
  VALUES
    (v_req1_id, v_res1_id, 92, 'Shortlisted'),
    (v_req1_id, v_res6_id, 78, 'Pending'),
    (v_req2_id, v_res2_id, 95, 'Shortlisted'),
    (v_req3_id, v_res3_id, 88, 'Shortlisted'),
    (v_req3_id, v_res6_id, 82, 'Pending'),
    (v_req4_id, v_res4_id, 91, 'Shortlisted'),
    (v_req5_id, v_res5_id, 89, 'Shortlisted');

  -- ── Contract ──────────────────────────────────────────────
  INSERT INTO contracts
    (contract_id, client_id, vendor_id, requirement_id, resource_id,
     rate, billing_cycle, start_date, end_date, description, status)
  VALUES
    ('CON-2025-001', v_client_id, v_vendor_id, v_req1_id, v_res5_id,
     130000, 'Monthly', '2025-01-15', '2026-01-14',
     'DevOps engineer – 12-month engagement for cloud infrastructure management.',
     'Active')
  RETURNING id INTO v_con1_id;

  -- ── Invoices ──────────────────────────────────────────────
  INSERT INTO invoices (invoice_id, user_id, contract_id, amount, status, due_date, paid_at)
  VALUES
    ('INV-2025-001', v_client_id, v_con1_id, 130000, 'Paid',  '2025-02-01', '2025-01-30'),
    ('INV-2025-002', v_client_id, v_con1_id, 130000, 'Paid',  '2025-03-01', '2025-02-28'),
    ('INV-2025-003', v_client_id, v_con1_id, 130000, 'Pending','2025-04-01', NULL);

  -- ── Notifications ─────────────────────────────────────────
  INSERT INTO notifications (user_id, title, message, type, is_read)
  VALUES
    (v_client_id, 'New Match Found',
     'We found 3 matching profiles for your DevOps Engineer requirement REQ-001.',
     'match', false),
    (v_client_id, 'Contract Activated',
     'Contract CON-2025-001 with Test Vendor Solutions is now Active.',
     'contract', false),
    (v_client_id, 'Invoice Due',
     'Invoice INV-2025-003 of ₹1,30,000 is due on 1 April 2025.',
     'system', false),
    (v_client_id, 'New Resource Available',
     'A new Java developer (8 yrs experience) has been added to the marketplace.',
     'system', true),
    (v_vendor_id, 'Contract Request Received',
     'You have a new contract request for Kiran Nair from Test Client.',
     'contract', false),
    (v_vendor_id, 'Invoice Paid',
     'Invoice INV-2025-002 of ₹1,30,000 has been marked as paid.',
     'system', true),
    (v_vendor_id, 'Resource Profile Viewed',
     'Your resource Arjun Mehta''s profile was viewed by a client.',
     'system', true),
    (v_vendor_id, 'New Requirement Posted',
     'A client posted a new React Frontend Developer requirement matching your bench.',
     'match', false);

  -- ── Messages ──────────────────────────────────────────────
  INSERT INTO messages (sender_id, receiver_id, message, is_read)
  VALUES
    (v_client_id, v_vendor_id,
     'Hi, we are interested in Arjun Mehta for our DevOps requirement. Is he available?',
     true),
    (v_vendor_id, v_client_id,
     'Hello! Yes, Arjun is available immediately. His rate is ₹1,30,000/month. Shall I share his detailed profile?',
     true),
    (v_client_id, v_vendor_id,
     'Yes please. Also, can we schedule a quick call this week to discuss the engagement?',
     true),
    (v_vendor_id, v_client_id,
     'Absolutely. I have shared Arjun''s profile. We can do a call on Wednesday at 3 PM IST. Does that work?',
     true),
    (v_client_id, v_vendor_id,
     'Wednesday 3 PM works perfectly. We will send a calendar invite.',
     false),
    (v_vendor_id, v_client_id,
     'Great! Looking forward to it. We can also discuss the contract terms during the call.',
     false);

  -- ── Subscriptions ─────────────────────────────────────────
  INSERT INTO subscriptions
    (user_id, plan, amount, billing_cycle, start_date, end_date, is_active)
  VALUES
    (v_client_id, 'Professional', 9999,  'Monthly', '2025-01-01', '2026-01-01', true),
    (v_vendor_id, 'Enterprise',   19999, 'Monthly', '2025-01-01', '2026-01-01', true);

  RAISE NOTICE 'Done. Seed data inserted for client_id=%, vendor_id=%.', v_client_id, v_vendor_id;
END $$;


-- ── Verification ──────────────────────────────────────────────
SELECT 'requirements'   AS tbl, COUNT(*) FROM requirements
UNION ALL SELECT 'resources',   COUNT(*) FROM resources
UNION ALL SELECT 'matches',     COUNT(*) FROM matches
UNION ALL SELECT 'contracts',   COUNT(*) FROM contracts
UNION ALL SELECT 'invoices',    COUNT(*) FROM invoices
UNION ALL SELECT 'messages',    COUNT(*) FROM messages
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions;
