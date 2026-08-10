-- Supabase Schema for Real Efficiency Tracker
-- Phase 2: Complete team configurations with correct work types

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table with correct work type configurations
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  members JSONB NOT NULL,
  work_types JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly entries table
CREATE TABLE weekly_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id TEXT REFERENCES teams(id),
  week_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  work_type_data JSONB NOT NULL,
  working_days INTEGER DEFAULT 5,
  leave_days DECIMAL DEFAULT 0,
  weekly_rating DECIMAL DEFAULT 0,
  week_total DECIMAL NOT NULL,
  target_points DECIMAL DEFAULT NULL, -- For Tech team target story points
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, week_id, member_name)
);

-- Insert teams with correct work type configurations from code
INSERT INTO teams (id, name, members, work_types) VALUES 

-- B2B Team (uses this.workTypes)
('b2b', 'B2B Team', 
 '["Deepak", "Anjali Rawat", "Swati Juyal", "Deepak Kumar"]',
 '{
   "ost": {"level": "L1", "name": "OST", "perDay": 20},
   "screen_capture": {"level": "L1", "name": "Screen Capture", "perDay": 2},
   "first_cut": {"level": "L1", "name": "1st Cut", "perDay": 1},
   "hand_animation": {"level": "L2", "name": "Hand Animation", "perDay": 6},
   "scene_animation": {"level": "L3", "name": "Scene Animation", "perDay": 7},
   "character_animation": {"level": "L3", "name": "Character Animation", "perDay": 1},
   "full_animation": {"level": "L3", "name": "Full Animation", "perDay": 1},
   "intro": {"level": "L3", "name": "Intro", "perDay": 0.15}
 }'),

-- Varsity Team (uses this.varsityWorkTypes)
('varsity', 'Varsity Team',
 '["Aalim", "Satyavrat Sharma", "Manish", "Apoorv Suman", "Anmol Anand"]', 
 '{
   "ost": {"level": "L1", "name": "OST", "perDay": 20},
   "screen_capture": {"level": "L1", "name": "Screen Capture (5 min)", "perDay": 2},
   "hand_animation": {"level": "L1", "name": "Hand Animation", "perDay": 6},
   "first_cut": {"level": "L1", "name": "1st Cut", "perDay": 1},
   "fss_animation": {"level": "L2", "name": "FSS Animation", "perDay": 7},
   "character_animation": {"level": "L3", "name": "Character Animation", "perDay": 1},
   "vo_animation": {"level": "L3", "name": "VO Animation", "perDay": 1},
   "intro": {"level": "L3", "name": "Intro", "perDay": 0.15}
 }'),

-- Zero1 - Bratish Team (uses this.zero1WorkTypes)
('zero1', 'Zero1 - Bratish Team', 
 '["Bratish", "Saiyam Verma", "Akriti Singh", "Manish Chauhan", "Mohd. Wasim"]', 
 '{
   "ost": {"level": "L1", "name": "OST", "perDay": 20},
   "screen_capture": {"level": "L1", "name": "Screen Capture", "perDay": 2},
   "hand_animation": {"level": "L1", "name": "Hand Animation", "perDay": 6},
   "first_cut_storyboard": {"level": "L2", "name": "1st Cut + Storyboard", "perDay": 1},
   "script_discussion": {"level": "L2", "name": "Script Discussion + Moodboard", "perDay": 3},
   "thumbnail_ideation": {"level": "L2", "name": "Thumbnail Ideation", "perDay": 4},
   "script_review": {"level": "L2", "name": "Script Review", "perDay": 3},
   "shoot_data_copy": {"level": "L2", "name": "Shoot + Data copy", "perDay": 3},
   "fss_animation": {"level": "L3", "name": "FSS Animation", "perDay": 7},
   "character_animation": {"level": "L3", "name": "Character Animation", "perDay": 1},
   "vo_animation": {"level": "L3", "name": "VO Animation", "perDay": 1},
   "intro": {"level": "L3", "name": "Intro", "perDay": 0.15},
   "shot_division": {"level": "L3", "name": "Shot Division", "perDay": 0.67}
 }'),

-- Zero1 - Harish Team (uses this.harishWorkTypes)
('harish', 'Zero1 - Harish Team',
 '["Harish Rawat", "Rishabh Bangwal", "Pratik Sharma", "Vikas Kumar"]',
 '{
   "ost": {"level": "L1", "name": "OST", "perDay": 20},
   "screen_capture": {"level": "L1", "name": "Screen Capture", "perDay": 2},
   "hand_animation": {"level": "L1", "name": "Hand Animation", "perDay": 6},
   "first_cut_storyboard": {"level": "L2", "name": "1st Cut + Storyboard", "perDay": 1},
   "script_discussion": {"level": "L2", "name": "Script Discussion + Moodboard", "perDay": 3},
   "thumbnail_ideation": {"level": "L2", "name": "Thumbnail Ideation", "perDay": 4},
   "script_review": {"level": "L2", "name": "Script Review", "perDay": 3},
   "shoot_data_copy": {"level": "L2", "name": "Shoot + Data copy", "perDay": 3},
   "fss_animation": {"level": "L3", "name": "FSS Animation", "perDay": 7},
   "character_animation": {"level": "L3", "name": "Character Animation", "perDay": 1},
   "vo_animation": {"level": "L3", "name": "VO Animation", "perDay": 1},
   "intro": {"level": "L3", "name": "Intro", "perDay": 0.15},
   "shot_division": {"level": "L3", "name": "Shot Division", "perDay": 0.67}
 }'),

-- Audio Team (uses this.audioWorkTypes)
('audio', 'Audio Team',
 '["Amandeep", "Bhavya Menon", "Rahul", "Ashutosh", "Naveen"]',
 '{
   "reel": {"level": "L1", "name": "Reel", "perDay": 3},
   "short_videos_ads": {"level": "L1", "name": "Short Videos/Ads", "perDay": 2},
   "live_shoot_1hr": {"level": "L1", "name": "Live Shoot - 1 Hour", "perDay": 8},
   "dubbing_1hr": {"level": "L1", "name": "Dubbing - 1 Hour", "perDay": 6},
   "master_upload": {"level": "L1", "name": "Master Upload", "perDay": 3},
   "podcast_1hr_no_animation": {"level": "L2", "name": "Podcast (1 Hr) w/o Animation", "perDay": 1},
   "yt_long_form": {"level": "L3", "name": "YT Long Form", "perDay": 0.67},
   "video_8_10_mins_lf": {"level": "L3", "name": "Video (8-10 mins) LF", "perDay": 0.67}
 }'),

-- Shorts Team (uses this.shortsWorkTypes)
('shorts', 'Shorts Team',
 '["Divyanshu Mishra", "Abhishek Sharma", "Dheeraj Rajvania", "Aayush Srivastava", "Manoj Kumar"]',
 '{
   "ost": {"level": "L1", "name": "OST", "perDay": 20},
   "screen_capture": {"level": "L1", "name": "Screen Capture", "perDay": 2},
   "hand_animation": {"level": "L1", "name": "Hand Animation", "perDay": 6},
   "first_cut_storyboard": {"level": "L2", "name": "1st Cut + Storyboard", "perDay": 1},
   "script_discussion": {"level": "L2", "name": "Script Discussion + Moodboard", "perDay": 3},
   "thumbnail_ideation": {"level": "L2", "name": "Thumbnail Ideation", "perDay": 4},
   "script_review": {"level": "L2", "name": "Script Review", "perDay": 3},
   "shoot_data_copy": {"level": "L2", "name": "Shoot + Data copy", "perDay": 3},
   "fss_animation": {"level": "L3", "name": "FSS Animation", "perDay": 7},
   "character_animation": {"level": "L3", "name": "Character Animation", "perDay": 1},
   "vo_animation": {"level": "L3", "name": "VO Animation", "perDay": 1},
   "intro": {"level": "L3", "name": "Intro", "perDay": 0.15},
   "shot_division": {"level": "L3", "name": "Shot Division", "perDay": 0.67}
 }'),

-- Graphics Team (uses this.graphicsWorkTypes)
('graphics', 'Graphics Team',
    '["Amit Joshi", "Rakhi Dhama", "Raj", "Abhishek Shukla", "Mayank", "Anubha", "Pranchal Chaudhary", "Piyush Vaid", "Vaibhav Singhal", "Ishika", "Aman"]',
 '{
   "graphics_l1": {"level": "L1", "name": "Graphics", "perDay": 5},
   "ppt_slides": {"level": "L1", "name": "PPT Slides", "perDay": 30},
   "research": {"level": "L1", "name": "Research", "perDay": 1},
   "graphics_l2": {"level": "L2", "name": "Graphics", "perDay": 2}
 }'),

-- Tech Team (uses this.techWorkTypes - story points based)
('tech', 'Tech Team',
 '["Supriya", "Tilak", "Rishi", "Chandan", "Harshita"]',
 '{
   "story_points": {"level": "SP", "name": "Story Points", "perDay": 3}
 }'),

-- Product Team (uses this.productWorkTypes - story points based)
('product', 'Product Team',
 '["Akshay", "Ankush", "Noor"]',
 '{
   "story_points": {"level": "SP", "name": "Story Points", "perDay": 1}
 }');

-- Create indexes for better performance
CREATE INDEX idx_weekly_entries_team_week ON weekly_entries(team_id, week_id);
CREATE INDEX idx_weekly_entries_member ON weekly_entries(team_id, member_name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weekly_entries_updated_at
    BEFORE UPDATE ON weekly_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
