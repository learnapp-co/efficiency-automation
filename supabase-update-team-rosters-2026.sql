-- Team roster updates (run in Supabase SQL Editor)
-- Matches real-efficiency-tracker.js active member lists

-- Tech: remove Rishi
UPDATE teams SET members = '[
  {"name": "Supriya"},
  {"name": "Tilak"},
  {"name": "Chandan"},
  {"name": "Harshita"},
  {"name": "Tushar"}
]'::jsonb
WHERE id = 'tech';

-- Product: remove Akshay
UPDATE teams SET members = '[
  {"name": "Ankush"},
  {"name": "Vaishnavi"},
  {"name": "Bhavya Oberoi"}
]'::jsonb
WHERE id = 'product';

-- Pre-production: remove Nikhil (no separate "editor" team in app)
UPDATE teams SET members = '[
  {"name": "Vandit"},
  {"name": "Abid"},
  {"name": "Mudit"}
]'::jsonb
WHERE id = 'preproduction';

-- Content: add Sanandan
UPDATE teams SET members = '[
  {"name": "Nishita"},
  {"name": "Shuchita"},
  {"name": "Sahil Mathur"},
  {"name": "Sanandan"}
]'::jsonb
WHERE id = 'content';

-- Social: remove Swapnil
UPDATE teams SET members = '[
  {"name": "Khushi"},
  {"name": "Siya"},
  {"name": "Rohit"},
  {"name": "Anish"},
  {"name": "Tanya"},
  {"name": "Somya"},
  {"name": "Satyam"}
]'::jsonb
WHERE id = 'social';

-- Verify
SELECT id, name, jsonb_pretty(members) AS members
FROM teams
WHERE id IN ('tech', 'product', 'preproduction', 'content', 'social')
ORDER BY id;
