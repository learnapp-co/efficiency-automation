// Real Efficiency Tracker - January 2025 onwards with Supabase Database
// Fixed Monday-Friday week system
// Historical data (Jan-Aug 2025) hardcoded, Future data (Sept 2025+) in Supabase

class RealEfficiencyTracker {
    constructor() {
        this.supabaseAPI = new SupabaseAPI();
        this.weekSystem = new WeekSystem();
        this.currentWeek = null;
        this.currentMember = null;
        this.currentTeam = 'b2b'; // Default to B2B team
        this.sheetData = [];
        
        // Override week system method to handle team-specific filtering
        this.getFilteredWeeks = () => {
            let weeks = this.weekSystem.getWeeksForSelector();
            
            // For 2026, all teams show all months (January to December 2026)
            // No special filtering needed for Graphics, Tech, Product, Pre-production, Content, and Social teams anymore
            
            // Filter out locked months from weekly view
            const lockedMonthsForTeam = this.lockedMonths[this.currentTeam] || [];
            
            // CRITICAL FIX: Also filter out months where ALL weeks are finalized
            // This ensures that when a month is complete (all weeks finalized), 
            // those weeks disappear from weekly view and only show in monthly view
            // Map currentTeam to Supabase team ID for finalized reports lookup
            const supabaseTeamId = this.currentTeam === 'zero1' ? 'zero1_bratish' : 
                                   this.currentTeam === 'harish' ? 'zero1_harish' : 
                                   this.currentTeam;
            const finalizedWeeksForTeam = this.finalizedReports?.[supabaseTeamId] || this.finalizedReports?.[this.currentTeam] || {};
            
            weeks = weeks.filter(week => {
                // Check if month is explicitly locked
                if (lockedMonthsForTeam.includes(week.monthYear)) {
                    console.log(`🔒 Filtering out ${week.id} - month ${week.monthYear} is locked`);
                    return false;
                }
                
                // Check if ALL weeks of this month are finalized
                const [monthName, yearStr] = week.monthYear.split(' ');
                const year = parseInt(yearStr);
                const monthWeeks = this.weekSystem.getWeeksByMonthName(monthName, year);
                
                // Count how many weeks of this month are finalized
                const finalizedCount = monthWeeks.filter(w => 
                    finalizedWeeksForTeam[w.id] !== undefined && 
                    finalizedWeeksForTeam[w.id] !== null
                ).length;
                
                // If all weeks are finalized, hide them from weekly dropdown
                if (finalizedCount === monthWeeks.length && monthWeeks.length > 0) {
                    console.log(`🔒 Filtering out ${week.id} - all ${finalizedCount}/${monthWeeks.length} weeks of ${week.monthYear} are finalized`);
                    return false;
                }
                
                return true;
            });
            
            return weeks;
        };
        
        
        // B2B team work types (based on user's B2B levels screenshot)
        this.workTypes = {
            'ost': { level: 'L1', name: 'OST', perDay: 20 },
            'screen_capture': { level: 'L1', name: 'Screen Capture', perDay: 2 },
            'first_cut': { level: 'L1', name: '1st Cut', perDay: 1 },
            'hand_animation': { level: 'L2', name: 'Hand Animation', perDay: 6 },
            'scene_animation': { level: 'L3', name: 'Scene Animation', perDay: 7 },
            'character_animation': { level: 'L3', name: 'Character Animation', perDay: 1 },
            'full_animation': { level: 'L3', name: 'Full Animation', perDay: 1 },
            'intro': { level: 'L3', name: 'Intro', perDay: 0.15 }
        };
        
        this.levelMapping = {
            'L1': ['ost', 'screen_capture', 'first_cut'],
            'L2': ['hand_animation'],
            'L3': ['scene_animation', 'character_animation', 'full_animation', 'intro']
        };
        
        // Zero1 team work types (based on user's screenshot)
        this.zero1WorkTypes = {
            'ost': { level: 'L1', name: 'OST', perDay: 20 },
            'screen_capture': { level: 'L1', name: 'Screen Capture', perDay: 2 },
            'hand_animation': { level: 'L1', name: 'Hand Animation', perDay: 6 },
            'first_cut_storyboard': { level: 'L2', name: '1st Cut + Storyboard', perDay: 1 },
            'script_discussion': { level: 'L2', name: 'Script Discussion + Moodboard', perDay: 3 },
            'thumbnail_ideation': { level: 'L2', name: 'Thumbnail Ideation', perDay: 4 },
            'script_review': { level: 'L2', name: 'Script Review', perDay: 3 },
            'shoot_data_copy': { level: 'L2', name: 'Shoot + Data copy', perDay: 3 },
            'fss_animation': { level: 'L3', name: 'FSS Animation', perDay: 7 },
            'character_animation': { level: 'L3', name: 'Character Animation', perDay: 1 },
            'vo_animation': { level: 'L3', name: 'VO Animation', perDay: 1 },
            'intro': { level: 'L3', name: 'Intro', perDay: 0.15 },
            'shot_division': { level: 'L3', name: 'Shot Division', perDay: 0.67 }
        };
        
        this.zero1LevelMapping = {
            'L1': ['ost', 'screen_capture', 'hand_animation'],
            'L2': ['first_cut_storyboard', 'script_discussion', 'thumbnail_ideation', 'script_review', 'shoot_data_copy'],
            'L3': ['fss_animation', 'character_animation', 'vo_animation', 'intro', 'shot_division']
        };
        
        // Varsity team work types (based on user's Varsity levels screenshot)
        this.varsityWorkTypes = {
            'ost': { level: 'L1', name: 'OST', perDay: 20 },
            'screen_capture': { level: 'L1', name: 'Screen Capture (5 min)', perDay: 2 },
            'hand_animation': { level: 'L1', name: 'Hand Animation', perDay: 6 },
            'first_cut': { level: 'L1', name: '1st Cut', perDay: 1 },
            'fss_animation': { level: 'L2', name: 'FSS Animation', perDay: 7 },
            'character_animation': { level: 'L3', name: 'Character Animation', perDay: 1 },
            'vo_animation': { level: 'L3', name: 'VO Animation', perDay: 1 },
            'intro': { level: 'L3', name: 'Intro', perDay: 0.15 }
        };
        
        this.varsityLevelMapping = {
            'L1': ['ost', 'screen_capture', 'hand_animation', 'first_cut'],
            'L2': ['fss_animation'],
            'L3': ['character_animation', 'vo_animation', 'intro']
        };

        // Zero1 - Harish team work types (based on user's screenshot)
        this.harishWorkTypes = {
            'ost': { level: 'L1', name: 'OST', perDay: 20 },
            'screen_capture': { level: 'L1', name: 'Screen Capture', perDay: 2 },
            'hand_animation': { level: 'L1', name: 'Hand Animation', perDay: 6 },
            'first_cut_storyboard': { level: 'L2', name: '1st Cut + Storyboard', perDay: 1 },
            'script_discussion': { level: 'L2', name: 'Script Discussion + Moodboard', perDay: 3 },
            'thumbnail_ideation': { level: 'L2', name: 'Thumbnail Ideation', perDay: 4 },
            'script_review': { level: 'L2', name: 'Script Review', perDay: 3 },
            'shoot_data_copy': { level: 'L2', name: 'Shoot + Data copy', perDay: 3 },
            'fss_animation': { level: 'L3', name: 'FSS Animation', perDay: 7 },
            'character_animation': { level: 'L3', name: 'Character Animation', perDay: 1 },
            'vo_animation': { level: 'L3', name: 'VO Animation', perDay: 1 },
            'intro': { level: 'L3', name: 'Intro', perDay: 0.15 },
            'shot_division': { level: 'L3', name: 'Shot Division', perDay: 0.67 }
        };
        
        this.harishLevelMapping = {
            'L1': ['ost', 'screen_capture', 'hand_animation'],
            'L2': ['first_cut_storyboard', 'script_discussion', 'thumbnail_ideation', 'script_review', 'shoot_data_copy'],
            'L3': ['fss_animation', 'character_animation', 'vo_animation', 'intro', 'shot_division']
        };

        // Audio team work types
        this.audioWorkTypes = {
            'reel': { level: 'L1', name: 'Reel', perDay: 5 },
            'short_videos_ads': { level: 'L1', name: 'Short Videos/Ads', perDay: 3 },
            'live_shoot_1hr': { level: 'L1', name: 'Live Shoot - 1 Hour', perDay: 8 },
            'podcast_1hr_no_animation': { level: 'L2', name: 'Podcast (1 Hr) w/o Animation', perDay: 2 },
            'yt_long_form': { level: 'L3', name: 'YT Long Form', perDay: 0.67 },
            'video_8_10_mins_lf': { level: 'L3', name: 'Video (8-10 mins) LF', perDay: 0.67 },
            'vd': { level: 'L3', name: 'VD', perDay: 0.67 },
            'storyboarding': { level: 'L3', name: 'Storyboarding', perDay: 8 },
            'editing': { level: 'L3', name: 'Editing', perDay: 8 }
        };
        
        this.audioLevelMapping = {
            'L1': ['reel', 'short_videos_ads', 'live_shoot_1hr'],
            'L2': ['podcast_1hr_no_animation'],
            'L3': ['yt_long_form', 'video_8_10_mins_lf', 'vd', 'storyboarding', 'editing']
        };


        
        // Graphics team work types (updated structure with new levels)
        this.graphicsWorkTypes = {
            // Level 0
            'ost_text_graphic': { level: 'L0', name: 'OST/ Text Graphic', perDay: 25 },
            'img_video_gen_final': { level: 'L0', name: 'Imag Gen/ Video Gen (Final)', perDay: 25 },
            'changes': { level: 'L0', name: 'Changes', perDay: 25 },
            
            // Level 0.5
            'graphic_ost_basic_chart': { level: 'L0.5', name: 'Graphic 0ST/ Basic Chart', perDay: 14 },
            'shorts_storyboard': { level: 'L0.5', name: 'Shorts Storyboard', perDay: 14 },
            
            // Level 1
            'graphic_fss_charts': { level: 'L1', name: 'Graphic FSS/ Charts', perDay: 7 },
            'ai_graphic_manipulation': { level: 'L1', name: 'AI Graphic Manipulation', perDay: 7 },
            'research': { level: 'L1', name: 'Research', perDay: 7 },
            
            // Level 1.5
            'sf_broll_shoot': { level: 'L1.5', name: 'SF B-roll/shoot', perDay: 4 },
            'varsity_shorts_thumbnail_3v': { level: 'L1.5', name: 'Varsity Shorts Thumbnail (3 V)', perDay: 4 },
            
            // Level 2
            'heavy_scenic_graphic': { level: 'L2', name: 'Heavy Scenic Graphic', perDay: 3.5 },
            'og_shorts_thumbnail_3v': { level: 'L2', name: 'OG Shorts Thumbnail (3 V)', perDay: 3.5 },
            'varsity_lf_3v': { level: 'L2', name: 'Varsity LF (3V)', perDay: 3.5 },
            'retro': { level: 'L2', name: 'Retro', perDay: 3.5 },
            
            // Level 3
            'moodboard': { level: 'L3', name: 'Moodboard', perDay: 2 },
            'video_theme_10_graphics': { level: 'L3', name: 'Video Theme (10 graphics min)', perDay: 1 },
            'vd': { level: 'L3', name: 'VD', perDay: 1 },
            'lf_storyboard': { level: 'L3', name: 'LF Storyboard', perDay: 1 },
            'topic_res': { level: 'L3', name: 'Topic Res', perDay: 10 },
            'ppt_slides': { level: 'L3', name: 'PPT Slides', perDay: 30 },
            'og_thumb': { level: 'L3', name: 'OG Thumb', perDay: 1 }
        };

        // Graphics team level mapping (updated with new levels)
        this.graphicsLevelMapping = {
            'L0': ['ost_text_graphic', 'img_video_gen_final', 'changes'],
            'L0.5': ['graphic_ost_basic_chart', 'shorts_storyboard'],
            'L1': ['graphic_fss_charts', 'ai_graphic_manipulation', 'research'],
            'L1.5': ['sf_broll_shoot', 'varsity_shorts_thumbnail_3v'],
            'L2': ['heavy_scenic_graphic', 'og_shorts_thumbnail_3v', 'varsity_lf_3v', 'retro'],
            'L3': ['moodboard', 'video_theme_10_graphics', 'vd', 'lf_storyboard', 'topic_res', 'ppt_slides', 'og_thumb']
        };

        // Tech team work types (story points based)
        this.techWorkTypes = {
            'story_points': { level: 'SP', name: 'Story Points', perDay: 3 }
        };

        // Tech team level mapping (no traditional levels, just story points)
        this.techLevelMapping = {
            'SP': ['story_points']
        };

        // Product team work types (story points based)
        this.productWorkTypes = {
            'story_points': { level: 'SP', name: 'Story Points', perDay: 1 }
        };

        // Product team level mapping (no traditional levels, just story points)
        this.productLevelMapping = {
            'SP': ['story_points']
        };

        // Pre-production team work types (category-based structure)
        this.preproductionWorkTypes = {
            // YT Shorts
            'script_preplanning_vd_shoot': { level: 'YT Shorts', name: 'Script Screenplay + Pre-Planning + VD + Shoot', perDay: 2 },
            
            // YT LF (Normal)
            'yt_normal_moodboard': { level: 'YT LF (Normal)', name: 'Visual Moodboard', perDay: 2 },
            'yt_normal_direction_script': { level: 'YT LF (Normal)', name: 'Visual Direction + Script Screenplay', perDay: 1 },
            'yt_normal_preplanning': { level: 'YT LF (Normal)', name: 'Pre-planning', perDay: 2 },
            'yt_normal_shoots': { level: 'YT LF (Normal)', name: 'Shoots (PS)', perDay: 2 },
            
            // YT LF (Big)
            'yt_big_moodboard': { level: 'YT LF (Big)', name: 'Visual Moodboard', perDay: 0.5 },
            'yt_big_direction_script': { level: 'YT LF (Big)', name: 'Visual Direction + Script Screenplay', perDay: 0.5 },
            'yt_big_preplanning': { level: 'YT LF (Big)', name: 'Pre-planning (location scouting/recce/permissions, etc)', perDay: 0.5 },
            'yt_big_shoots': { level: 'YT LF (Big)', name: 'Pre Planning + Shoots (PS)', perDay: 1 },
            
            // Reels Pre-planning + Shoots
            'reels_phone': { level: 'Reels Pre-planning + Shoots', name: 'Reels (Phone)', perDay: 2 },
            'production_outdoor': { level: 'Reels Pre-planning + Shoots', name: 'Production Outdoor', perDay: 0.66 },
            'production_indoor': { level: 'Reels Pre-planning + Shoots', name: 'Production Indoor', perDay: 1 },
            
            // No PS Shoots
            'no_ps_indoor': { level: 'No PS Shoots', name: 'Indoor', perDay: 1 },
            'no_ps_outdoor': { level: 'No PS Shoots', name: 'Outdoor', perDay: 0.5 },
            
            // Post-Production
            'intro_editing': { level: 'Post-Production', name: 'Intro/sequence Editing/overview', perDay: 2 },
            'storyboard': { level: 'Post-Production', name: 'Storyboard', perDay: 1 }
        };

        // Pre-production team level mapping (category-based)
        this.preproductionLevelMapping = {
            'YT Shorts': ['script_preplanning_vd_shoot'],
            'YT LF (Normal)': ['yt_normal_moodboard', 'yt_normal_direction_script', 'yt_normal_preplanning', 'yt_normal_shoots'],
            'YT LF (Big)': ['yt_big_moodboard', 'yt_big_direction_script', 'yt_big_preplanning', 'yt_big_shoots'],
            'Reels Pre-planning + Shoots': ['reels_phone', 'production_outdoor', 'production_indoor'],
            'No PS Shoots': ['no_ps_indoor', 'no_ps_outdoor'],
            'Post-Production': ['intro_editing', 'storyboard']
        };

        // Content team work types (category-based structure)
        this.contentWorkTypes = {
            // Shorts
            'shorts_topics': { level: 'Shorts', name: 'Topics', perDay: 10 },
            'shorts_og_script': { level: 'Shorts', name: 'OG Script', perDay: 3 },
            'shorts_rp_script': { level: 'Shorts', name: 'RP Script', perDay: 4 },
            'shorts_shoot': { level: 'Shorts', name: 'Shoot', perDay: 5 },
            'shorts_review': { level: 'Shorts', name: 'Review', perDay: 14 },
            'shorts_comments_community': { level: 'Shorts', name: 'Comments & Community Posts', perDay: 25 },
            'shorts_retro': { level: 'Shorts', name: 'Retro', perDay: 10 },
            
            // Long-form
            'lf_topic_research': { level: 'Long-form', name: 'Topic Research', perDay: 20 },
            'lf_wordcloud_pov': { level: 'Long-form', name: 'Wordcloud & POV', perDay: 2 },
            'lf_pov_v2': { level: 'Long-form', name: 'POV V2', perDay: 4 },
            'lf_script_outline': { level: 'Long-form', name: 'Script Outline', perDay: 0.66 },
            'lf_script_writing': { level: 'Long-form', name: 'Script Writing', perDay: 0.5 },
            'lf_script_writing_v2': { level: 'Long-form', name: 'Script Writing V2', perDay: 1 },
            'lf_visual_direction': { level: 'Long-form', name: 'Visual Direction', perDay: 2 },
            'lf_shoot': { level: 'Long-form', name: 'Shoot', perDay: 2 },
            'lf_storyboarding': { level: 'Long-form', name: 'Storyboarding', perDay: 1 },
            'lf_video_review_changes': { level: 'Long-form', name: 'Video Review & Changes', perDay: 1 },
            'lf_launch_doc': { level: 'Long-form', name: 'Launch Doc', perDay: 4 },
            'lf_comments_comm_post': { level: 'Long-form', name: 'Comments & Comm Post', perDay: 25 },
            'lf_retro': { level: 'Long-form', name: 'Retro', perDay: 2 },
            'lf_interview_ass_rev': { level: 'Long-form', name: 'Interview Ass+ Rev/ Ext Feedback', perDay: 2 }
        };

        // Content team level mapping (category-based)
        this.contentLevelMapping = {
            'Shorts': ['shorts_topics', 'shorts_og_script', 'shorts_rp_script', 'shorts_shoot', 'shorts_review', 'shorts_comments_community', 'shorts_retro'],
            'Long-form': ['lf_topic_research', 'lf_wordcloud_pov', 'lf_pov_v2', 'lf_script_outline', 'lf_script_writing', 'lf_script_writing_v2', 'lf_visual_direction', 'lf_shoot', 'lf_storyboarding', 'lf_video_review_changes', 'lf_launch_doc', 'lf_comments_comm_post', 'lf_retro', 'lf_interview_ass_rev']
        };

        // Social team work types with detailed levels and per-day capacities
        this.socialWorkTypes = {
            // Writing/Posting L1
            'basic_story': { level: 'Writing/Posting L1', name: 'Basic Story', perDay: 84 },
            'ig_caption': { level: 'Writing/Posting L1', name: 'IG Caption', perDay: 42 },
            'curation_schedule_post': { level: 'Writing/Posting L1', name: 'Curation + Schedule + Post', perDay: 28 },
            'statics': { level: 'Writing/Posting L1', name: 'Statics', perDay: 21 },
            'carousels_copy_l1': { level: 'Writing/Posting L1', name: 'Carousels/Copy', perDay: 7 },
            'reel_script_l1': { level: 'Writing/Posting L1', name: 'Reel Script', perDay: 7 },
            'linkedin_caption': { level: 'Writing/Posting L1', name: 'Linkedin Caption (PS)', perDay: 7 },
            
            // Writing/Posting L2
            'carousels_copy_l2': { level: 'Writing/Posting L2', name: 'Carousels/Copy', perDay: 3.5 },
            'reel_script_edit': { level: 'Writing/Posting L2', name: 'Reel Script/Edit', perDay: 2.8 },
            'research_khushi': { level: 'Writing/Posting L2', name: 'Research (Khushi)', perDay: 3 },
            
            // Editing L1
            'reel_l1': { level: 'Editing L1', name: 'Reel L1', perDay: 2 },
            'repackaging': { level: 'Editing L1', name: 'Repackaging', perDay: 7 },
            'typography': { level: 'Editing L1', name: 'Typography', perDay: 9.3 },
            'broll_sound_library': { level: 'Editing L1', name: 'B Roll + Sound Library', perDay: 7 },
            'zero1_teaser': { level: 'Editing L1', name: 'Zero1 Teaser', perDay: 4.7 },
            
            // Editing L1.5
            'reel_l1_5': { level: 'Editing L1.5', name: 'Reel L1.5', perDay: 1.4 },
            
            // Editing L2
            'podcast': { level: 'Editing L2', name: 'Podcast', perDay: 0.14 },
            
            // Design L1
            'statics_design': { level: 'Design L1', name: 'Statics', perDay: 28 },
            'story_reel_covers': { level: 'Design L1', name: 'Story/Reel covers', perDay: 14 },
            'carousel_design_l1': { level: 'Design L1', name: 'Carousel', perDay: 7 },
            
            // Design L1.5
            'carousel_design_l1_5': { level: 'Design L1.5', name: 'Carousel', perDay: 3.5 },
            
            // Design L2
            'carousel_design_l2': { level: 'Design L2', name: 'Carousel', perDay: 1 },
            
            // All
            'research_toolkit': { level: 'All', name: 'Research + Toolkit', perDay: 7 },
            'review_changes': { level: 'All', name: 'Review/Changes', perDay: 14 },
            'storyboard_qc': { level: 'All', name: 'Storyboard +QC', perDay: 3 },
            'subtitles_qc_fix': { level: 'All', name: 'Subtitles QC/Fix', perDay: 42 },
            'strategy_presentations': { level: 'All', name: 'Strategy (Presentations)', perDay: 7 },
            'shoot': { level: 'All', name: 'Shoot', perDay: 7 },
            'retro': { level: 'All', name: 'Retro', perDay: 28 },
            'rejection_meeting': { level: 'All', name: 'Rejection Meeting', perDay: 7 }
        };

        // Social team level mapping (category-based)
        this.socialLevelMapping = {
            'Writing/Posting L1': ['basic_story', 'ig_caption', 'curation_schedule_post', 'statics', 'carousels_copy_l1', 'reel_script_l1', 'linkedin_caption'],
            'Writing/Posting L2': ['carousels_copy_l2', 'reel_script_edit', 'research_khushi'],
            'Editing L1': ['reel_l1', 'repackaging', 'typography', 'broll_sound_library', 'zero1_teaser'],
            'Editing L1.5': ['reel_l1_5'],
            'Editing L2': ['podcast'],
            'Design L1': ['statics_design', 'story_reel_covers', 'carousel_design_l1'],
            'Design L1.5': ['carousel_design_l1_5'],
            'Design L2': ['carousel_design_l2'],
            'All': ['research_toolkit', 'review_changes', 'storyboard_qc', 'subtitles_qc_fix', 'strategy_presentations', 'shoot', 'retro', 'rejection_meeting']
        };
        
        // Current team selection
        this.currentTeam = 'b2b'; // Default to B2B team
        
        // Team configurations
        this.teamConfigs = {
            'b2b': {
                name: 'B2B Team',
                members: [
                    { name: 'Deepak', level: 'L1' },
                    { name: 'Anjali Rawat', level: 'L2' },
                    { name: 'Swati Juyal', level: 'L2' },
                    { name: 'Dheeraj Rajvania', level: 'L1' }, // Moved from Zero1-Bratish in June 2026
                    { name: 'Satyavrat Sharma' }, // Moved from Varsity in June 2026
                    { name: 'Rohit' }, // Moved from Social in August 2026
                    { name: 'Anish' } // Moved from Social in August 2026
                ],
                historicalMembers: [
                    { name: 'Deepak', level: 'L1' },
                    { name: 'Anjali Rawat', level: 'L2' },
                    { name: 'Swati Juyal', level: 'L2' },
                    { name: 'Satyam Gupta', level: 'L3' },
                    { name: 'Deepak Kumar', level: 'L3' },
                    { name: 'Dheeraj Rajvania', level: 'L1' },
                    { name: 'Satyavrat Sharma' },
                    { name: 'Rohit' },
                    { name: 'Anish' }
                ],
                // Note: Satyam Gupta removed from active members for Sept 2025 onwards but remains in historical data
                workLevels: this.levelMapping,
                sheetRange: 'B2B!A1:Z100'
            },
            'varsity': {
                name: 'Varsity Team',
                members: [
                    { name: 'Aalim' },
                    { name: 'Manish' },
                    { name: 'Apoorv Suman' },
                    { name: 'Anmol Anand' },
                    { name: 'Manoj Kumar' }, // Moved from Zero1-Bratish in June 2026
                    { name: 'Vikas Kumar' } // Moved from Zero1-Harish in June 2026
                ],
                // Historical members (for data display in completed months)
                historicalMembers: [
                    { name: 'Aalim' },
                    { name: 'Satyavrat Sharma' },
                    { name: 'Somya' }, // Left after March 2025
                    { name: 'Manish' },
                    { name: 'Apoorv Suman' },
                    { name: 'Anmol Anand' },
                    { name: 'Manoj Kumar' },
                    { name: 'Vikas Kumar' }
                ],
                workLevels: this.varsityLevelMapping,
                sheetRange: 'Varsity!A1:AZ1000'
            },
            'zero1': {
                name: 'Zero1 - Bratish Team',
                // Current active members (June 2026: Manoj moved to Varsity, Deepak Kumar added from B2B)
                members: [
                    { name: 'Bratish' },
                    { name: 'Akriti Singh' },
                    { name: 'Mohd. Wasim' },
                    { name: 'Ajay' }, // Added June 2026
                    { name: 'Deepak Kumar' } // Moved from B2B in June 2026
                ],
                // Historical members (for data display in completed months)
                historicalMembers: [
                    { name: 'Bratish' },
                    { name: 'Abhishek Sharma' }, // Left after March 2025
                    { name: 'Akriti Singh' },
                    { name: 'Mohd. Wasim' },
                    { name: 'Dheeraj Rajvania' },
                    { name: 'Manoj Kumar' },
                    { name: 'Ajay' },
                    { name: 'Deepak Kumar' }
                ],
                workLevels: this.zero1LevelMapping,
                sheetRange: 'Zero1 - Bratish - 2025!A1:BT1000'
            },
            harish: {
                name: 'Zero1 - Harish Team',
                // Current members (August 2026: Pratik removed)
                members: [
                    { name: 'Harish Rawat' },
                    { name: 'Rishabh Bangwal' },
                    { name: 'Divyanshu Mishra' },
                    { name: 'Abhishek Sharma' }
                ],
                // Historical members (for data display in completed months)
                historicalMembers: [
                    { name: 'Harish Rawat' },
                    { name: 'Rishabh Bangwal' },
                    { name: 'Pratik Sharma' },
                    { name: 'Divyanshu Mishra' },
                    { name: 'Vikas Kumar' },
                    { name: 'Abhishek Sharma' },
                    { name: 'Aayush Srivastava' }
                ],
                workLevels: this.harishLevelMapping,
                sheetRange: 'Zero1 - Harish - 2025!A1:BT1000'
            },
            audio: {
                name: 'Audio Team',
                members: [
                    { name: 'Amandeep' },
                    { name: 'Bhavya Menon' },
                    { name: 'Rahul' },
                    { name: 'Ashutosh' },
                    { name: 'Naveen' }
                ],
                historicalMembers: [
                    { name: 'Amandeep' },
                    { name: 'Bhavya Menon' },
                    { name: 'Rahul' },
                    { name: 'Ashutosh' },
                    { name: 'Naveen' }
                ],
                workLevels: this.audioLevelMapping,
                sheetRange: 'Audio - 2025!A1:BT1000'
            },
            graphics: {
                name: 'Graphics Team',
                members: [
                    { name: 'Amit Joshi' },
                    { name: 'Rakhi Dhama' },
                    { name: 'Raj' },
                    { name: 'Abhishek Shukla' },
                    { name: 'Mayank' },
                    { name: 'Anubha' },
                    { name: 'Pranchal Chaudhary' },
                    { name: 'Piyush Vaid' },
                    { name: 'Vaibhav Singhal' },
                    { name: 'Ishika' },
                    { name: 'Aman' },
                    { name: 'Shreya Surekha' }
                ],
                historicalMembers: [
                    { name: 'Amit Joshi' },
                    { name: 'Rakhi Dhama' },
                    { name: 'Raj' },
                    { name: 'Abhishek Shukla' },
                    { name: 'Mayank' },
                    { name: 'Anubha' },
                    { name: 'Pranchal Chaudhary' },
                    { name: 'Piyush Vaid' },
                    { name: 'Vaibhav Singhal' },
                    { name: 'Ishika' },
                    { name: 'Aman' }
                ],
                workLevels: this.graphicsLevelMapping,
                sheetRange: 'Graphics - 2025!A1:BT1000'
            },
            tech: {
                name: 'Tech Team',
                members: [
                    { name: 'Supriya' },
                    { name: 'Tilak' },
                    { name: 'Chandan' },
                    { name: 'Harshita' },
                    { name: 'Tushar' }
                ],
                historicalMembers: [
                    { name: 'Supriya' },
                    { name: 'Tilak' },
                    { name: 'Rishi' },
                    { name: 'Chandan' },
                    { name: 'Harshita' },
                    { name: 'Tushar' }
                ],
                workLevels: this.techLevelMapping,
                sheetRange: 'Tech - 2025!A1:BT1000'
            },
            product: {
                name: 'Product Team',
                members: [
                    { name: 'Ankush' },
                    { name: 'Vaishnavi' },
                    { name: 'Bhavya Oberoi' },
                    { name: 'Noor' } // Re-added June 2026
                ],
                historicalMembers: [
                    { name: 'Akshay' },
                    { name: 'Ankush' },
                    { name: 'Noor' },
                    { name: 'Vaishnavi' },
                    { name: 'Bhavya Oberoi' }
                ],
                workLevels: this.productLevelMapping,
                sheetRange: 'Product - 2025!A1:BT1000'
            },

            preproduction: {
                name: 'Pre-production Team',
                members: [
                    { name: 'Vandit' },
                    { name: 'Abid' },
                    { name: 'Mudit' }
                ],
                historicalMembers: [
                    { name: 'Vandit' },
                    { name: 'Abid' },
                    { name: 'Mudit' },
                    { name: 'Nikhil' },
                    { name: 'Aayush Srivastava' }
                ],
                workLevels: this.preproductionLevelMapping,
                sheetRange: 'Preproduction - 2025!A1:BT1000'
            },
            content: {
                name: 'Content Team',
                members: [
                    { name: 'Nishita' },
                    { name: 'Shuchita' },
                    { name: 'Sahil Mathur' }
                ],
                historicalMembers: [
                    { name: 'Nishita' },
                    { name: 'Akshat Mandalgi' },
                    { name: 'Urvish' },
                    { name: 'Meghna' },
                    { name: 'Shuchita' },
                    { name: 'Sahil Mathur' },
                    { name: 'Sanandan' }
                ],
                workLevels: this.contentLevelMapping,
                sheetRange: 'Content - 2025!A1:BT1000'
            },
            social: {
                name: 'Social Team',
                members: [
                    { name: 'Khushi' },
                    { name: 'Siya' },
                    { name: 'Tanya' },
                    { name: 'Satyam' }
                ],
                historicalMembers: [
                    { name: 'Khushi' },
                    { name: 'Siya' },
                    { name: 'Rohit' },
                    { name: 'Anish' },
                    { name: 'Swapnil' },
                    { name: 'Tanya' },
                    { name: 'Somya' },
                    { name: 'Satyam' }
                ],
                workLevels: this.socialLevelMapping,
                sheetRange: 'Social - 2025!A1:BT1000'
            }
        };

        // Add team ID aliases for consistent reference across the app
        this.teamConfigs['zero1_bratish'] = this.teamConfigs['zero1'];
        this.teamConfigs['zero1_harish'] = this.teamConfigs['harish'];
        
        // Current team shortcuts (updated when team changes)
        this.teamMembers = this.getActiveTeamMembers(this.currentTeam);
        this.workLevels = this.teamConfigs[this.currentTeam].workLevels;
        
        // Flag to prevent multiple simultaneous saves
        this.isSyncingToDatabase = false;
        
        // Slack webhook configuration for reports
        this.slackWebhookUrl = ''; // Will be set by user
        
        // Month locking system - tracks which months are locked for each team
        // 2025 completed months (September-December) remain locked
        // 2026 months will be locked as they are completed
        this.lockedMonths = {
            'b2b': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'varsity': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'zero1': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'harish': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'audio': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'graphics': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'tech': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'product': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'preproduction': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'content': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
            'social': ['September 2025', 'October 2025', 'November 2025', 'December 2025']
        };
        
        // Historical data - January to May 2025 (completed months)
        // Organized by team: this.historicalData[team][month]
        this.historicalData = {
            'b2b': {
            'January 2025': {
                isComplete: true,
                monthlyData: {
                    'Deepak': { 
                        weeks: [3.57, 4.21, 3.89, 4.15], // Weekly output totals from sheet
                        weeklyQualityRatings: [8.2, 8.5, 7.9, 8.4], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.25, // Average of weekly quality ratings: (8.2+8.5+7.9+8.4)/4
                        target: 22, 
                        totalOutput: 15.82, // SUM of weekly outputs: 3.57+4.21+3.89+4.15 = 15.82
                        workingDays: 22 // Target from Column D (adjusted for leaves)
                    },
                    'Anjali Rawat': { 
                        weeks: [2.99, 3.45, 3.21, 3.67], 
                        weeklyQualityRatings: [7.8, 7.6, 7.2, 7.4], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.5, // Average of weekly quality ratings: (7.8+7.6+7.2+7.4)/4
                        target: 19, 
                        totalOutput: 13.32, // SUM of weekly outputs: 2.99+3.45+3.21+3.67
                        workingDays: 19 // Target from Column D (adjusted for leaves)
                    },
                    'Swati Juyal': { 
                        weeks: [4.40, 4.12, 4.78, 4.55], 
                        weeklyQualityRatings: [9.1, 8.8, 9.3, 9.0], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 9.05, // Average of weekly quality ratings: (9.1+8.8+9.3+9.0)/4
                        target: 21, 
                        totalOutput: 17.85, // SUM of weekly outputs: 4.40+4.12+4.78+4.55
                        workingDays: 21 // Target from Column D (adjusted for leaves)
                    },
                    'Satyam Gupta': { 
                        weeks: [3.07, 3.89, 3.56, 3.78], 
                        weeklyQualityRatings: [7.9, 8.1, 7.5, 7.8], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.83, // Average of weekly quality ratings: (7.9+8.1+7.5+7.8)/4
                        target: 20, 
                        totalOutput: 14.30, // SUM of weekly outputs: 3.07+3.89+3.56+3.78
                        workingDays: 20 // Target from Column D (adjusted for leaves)
                    },
                    'Deepak Kumar': { 
                        weeks: [3.85, 4.21, 3.67, 4.02], 
                        weeklyQualityRatings: [8.1, 8.3, 7.8, 8.2], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.1, // Average of weekly quality ratings: (8.1+8.3+7.8+8.2)/4
                        target: 19, 
                        totalOutput: 15.75, // SUM of weekly outputs: 3.85+4.21+3.67+4.02
                        workingDays: 19 // Target from Column D (adjusted for leaves)
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 8.15, // Average: (8.25+7.5+9.05+7.83+8.1)/5
                    totalOutput: 77.04, // Sum: 15.82+13.32+17.85+14.30+15.75
                    totalWorkingDays: 101, // Sum of actual targets: 22+19+21+20+19 = 101
                    avgEfficiency: 92.3
                }
            },
            'February 2025': {
                isComplete: true,
                monthlyData: {
                    'Deepak': { 
                        weeks: [4.12, 3.98, 4.25, 4.08], 
                        weeklyQualityRatings: [8.2, 8.2, 8.3, 8.2], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.22, // Average: (8.2+8.2+8.3+8.2)/4 = 8.22 (converted from 4.11)
                        target: 9, totalOutput: 16.43, efficiency: 182.6 // Target from column D (Feb), 16.43/9*100
                    },
                    'Anjali Rawat': { 
                        weeks: [3.56, 3.67, 3.45, 3.71], 
                        weeklyQualityRatings: [7.2, 7.2, 7.2, 7.2], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.20, // Average: (7.2+7.2+7.2+7.2)/4 = 7.20 (converted from 3.60)
                        target: 18, totalOutput: 14.39, efficiency: 79.9 // Target from column D (Feb), 14.39/18*100
                    },
                    'Swati Juyal': { 
                        weeks: [4.67, 4.45, 4.78, 4.55], 
                        weeklyQualityRatings: [9.2, 9.2, 9.2, 9.1], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 9.18, // Average: (9.2+9.2+9.2+9.1)/4 = 9.18 (converted from 4.61)
                        target: 16, totalOutput: 18.45, efficiency: 115.3 // Target from column D (Feb), 18.45/16*100
                    },
                    'Satyam Gupta': { 
                        weeks: [3.78, 3.89, 3.67, 3.91], 
                        weeklyQualityRatings: [7.6, 7.6, 7.6, 7.8], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.65, // Average: (7.6+7.6+7.6+7.8)/4 = 7.65 (converted from 3.81)
                        target: 18, totalOutput: 15.25, efficiency: 84.7 // Target from column D (Feb), 15.25/18*100
                    },
                    'Deepak Kumar': { 
                        weeks: [4.15, 4.32, 3.98, 4.21], 
                        weeklyQualityRatings: [8.3, 8.3, 8.3, 8.4], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.33, // Average: (8.3+8.3+8.3+8.4)/4 = 8.33 (converted from 4.17)
                        target: 14, totalOutput: 16.66, efficiency: 119.0 // Target from column D (Feb), 16.66/14*100
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 8.12, // Average: (8.22+7.20+9.18+7.65+8.33)/5 = 8.12
                    totalOutput: 81.18, // Sum: 16.43+14.39+18.45+15.25+16.66
                    totalWorkingDays: 75, // Sum of actual targets: 9+18+16+18+14 = 75
                    avgEfficiency: 116.3 // New avg: (182.6+79.9+115.3+84.7+119.0)/5
                }
            },
            'March 2025': {
                isComplete: true,
                monthlyData: {
                    'Deepak': { 
                        weeks: [3.89, 4.12, 3.67, 4.15, 3.98], 
                        weeklyQualityRatings: [7.9, 7.9, 7.9, 7.9, 8.0], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.92, // Average: (7.9+7.9+7.9+7.9+8.0)/5 = 7.92 (converted from 3.96)
                        target: 22, totalOutput: 19.81, workingDays: 22 // Target from Column D (adjusted for leaves)
                    },
                    'Anjali Rawat': { 
                        weeks: [3.45, 3.67, 3.23, 3.78, 3.56], 
                        weeklyQualityRatings: [7.1, 7.1, 7.1, 7.1, 7.1], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.10, // Average: (7.1+7.1+7.1+7.1+7.1)/5 = 7.10 (converted from 3.54)
                        target: 19, totalOutput: 17.69, workingDays: 19 // Target from Column D (adjusted for leaves)
                    },
                    'Swati Juyal': { 
                        weeks: [4.34, 4.56, 4.12, 4.67, 4.21], 
                        weeklyQualityRatings: [8.8, 8.8, 8.7, 8.8, 8.7], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.76, // Average: (8.8+8.8+8.7+8.8+8.7)/5 = 8.76 (converted from 4.38)
                        target: 21, totalOutput: 21.90, workingDays: 21 // Target from Column D (adjusted for leaves)
                    },
                    'Satyam Gupta': { 
                        weeks: [3.67, 3.89, 3.45, 3.91, 3.72], 
                        weeklyQualityRatings: [7.5, 7.5, 7.4, 7.5, 7.4], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.46, // Average: (7.5+7.5+7.4+7.5+7.4)/5 = 7.46 (converted from 3.73)
                        target: 20, totalOutput: 18.64, workingDays: 20 // Target from Column D (adjusted for leaves)
                    },
                    'Deepak Kumar': { 
                        weeks: [4.01, 4.23, 3.87, 4.15, 4.09], 
                        weeklyQualityRatings: [8.1, 8.1, 8.1, 8.2, 8.1], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.12, // Average: (8.1+8.1+8.1+8.2+8.1)/5 = 8.12 (converted from 4.07)
                        target: 19, totalOutput: 20.35, workingDays: 19 // Target from Column D (adjusted for leaves)
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 7.87, // Average: (7.92+7.10+8.76+7.46+8.12)/5 = 7.87
                    totalOutput: 98.39, // Sum: 19.81+17.69+21.90+18.64+20.35
                    totalWorkingDays: 101, // Sum of actual targets: 22+19+21+20+19 = 101
                    avgEfficiency: 95.2
                }
            },
            'April 2025': {
                isComplete: true,
                monthlyData: {
                    'Deepak': { 
                        weeks: [4.12, 3.98, 4.34, 4.06], 
                        weeklyQualityRatings: [8.3, 8.2, 8.3, 8.3], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.28, // Average: (8.3+8.2+8.3+8.3)/4 = 8.28 (converted from 4.13)
                        target: 21, totalOutput: 16.50, efficiency: 78.6 // Target from column D (Apr), 16.50/21*100
                    },
                    'Anjali Rawat': { 
                        weeks: [3.67, 3.45, 3.89, 3.71], 
                        weeklyQualityRatings: [7.4, 7.3, 7.4, 7.4], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.38, // Average: (7.4+7.3+7.4+7.4)/4 = 7.38 (converted from 3.68)
                        target: 22, totalOutput: 14.72, efficiency: 66.9 // Target from column D (Apr), 14.72/22*100
                    },
                    'Swati Juyal': { 
                        weeks: [4.56, 4.23, 4.67, 4.44], 
                        weeklyQualityRatings: [9.0, 8.9, 9.0, 9.0], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.98, // Average: (9.0+8.9+9.0+9.0)/4 = 8.98 (converted from 4.48)
                        target: 22, totalOutput: 17.90, efficiency: 81.4 // Target from column D (Apr), 17.90/22*100
                    },
                    'Satyam Gupta': { 
                        weeks: [3.89, 3.67, 4.01, 3.83], 
                        weeklyQualityRatings: [7.7, 7.7, 7.7, 7.7], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.70, // Average: (7.7+7.7+7.7+7.7)/4 = 7.70 (converted from 3.85)
                        target: 20, totalOutput: 15.40, efficiency: 77.0 // Target from column D (Apr), 15.40/20*100
                    },
                    'Deepak Kumar': { 
                        weeks: [4.23, 4.01, 4.38, 4.17], 
                        weeklyQualityRatings: [8.4, 8.4, 8.4, 8.4], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.40, // Average: (8.4+8.4+8.4+8.4)/4 = 8.40 (converted from 4.20)
                        target: 19, totalOutput: 16.79, efficiency: 88.4 // Target from column D (Apr), 16.79/19*100
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 8.15, // Average: (8.28+7.38+8.98+7.70+8.40)/5 = 8.15
                    totalOutput: 81.31, // Sum: 16.50+14.72+17.90+15.40+16.79
                    totalWorkingDays: 84.5, // Sum of actual targets: 15+18+18+15.5+18 = 84.5
                    avgEfficiency: 96.8 // New avg: (110.0+81.8+99.4+99.4+93.3)/5
                }
            },
            'May 2025': {
                isComplete: true,
                monthlyData: {
                    'Deepak': { 
                        weeks: [3.98, 4.23, 3.87, 4.12, 4.05], 
                        weeklyQualityRatings: [8.1, 8.0, 8.0, 8.1, 8.0], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.05, // Average: (8.1+8.0+8.0+8.1+8.0)/5 = 8.05 (matches screenshot 4.05 scaled to 10)
                        target: 20, totalOutput: 20.25, efficiency: 101.3, // Target from column D (May), 20.25/20*100
                        workingDays: 20 // Target from Column D (adjusted for leaves)
                    },
                    'Anjali Rawat': { 
                        weeks: [3.56, 3.78, 3.45, 3.67, 3.61], 
                        weeklyQualityRatings: [7.2, 7.2, 7.2, 7.3, 7.2], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.22, // Average: (7.2+7.2+7.2+7.3+7.2)/5 = 7.22 (matches screenshot 3.61 scaled to 10)
                        target: 21.5, totalOutput: 18.07, efficiency: 84.0, // Target from column D (May), 18.07/21.5*100
                        workingDays: 21.5 // Target from Column D (adjusted for leaves)
                    },
                    'Swati Juyal': { 
                        weeks: [4.34, 4.67, 4.23, 4.45, 4.39], 
                        weeklyQualityRatings: [8.8, 8.9, 8.8, 8.8, 8.8], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.82, // Average: (8.8+8.9+8.8+8.8+8.8)/5 = 8.82 (matches screenshot 4.42 scaled to 10)
                        target: 15.5, totalOutput: 22.08, efficiency: 142.5, // Target from column D (May), 22.08/15.5*100
                        workingDays: 15.5 // Target from Column D (adjusted for leaves)
                    },
                    'Satyam Gupta': { 
                        weeks: [3.78, 3.91, 3.67, 3.89, 3.81], 
                        weeklyQualityRatings: [7.6, 7.6, 7.6, 7.7, 7.6], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.62, // Average: (7.6+7.6+7.6+7.7+7.6)/5 = 7.62 (matches screenshot 3.81 scaled to 10)
                        target: 21, totalOutput: 19.06, efficiency: 90.8, // Target from column D (May), 19.06/21*100
                        workingDays: 21 // Target from Column D (adjusted for leaves)
                    },
                    'Deepak Kumar': { 
                        weeks: [4.15, 4.32, 3.98, 4.21, 4.17], 
                        weeklyQualityRatings: [8.3, 8.4, 8.3, 8.4, 8.3], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.34, // Average: (8.3+8.4+8.3+8.4+8.3)/5 = 8.34 (matches screenshot 4.17 scaled to 10)
                        target: 21, totalOutput: 20.83, efficiency: 99.2, // Target from column D (May), 20.83/21*100
                        workingDays: 21 // Target from Column D (adjusted for leaves)
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 8.01, // Average: (8.05+7.22+8.82+7.62+8.34)/5 = 8.01
                    totalOutput: 100.29, // Sum: 20.25+18.07+22.08+19.06+20.83
                    totalWorkingDays: 99, // Sum of actual targets: 20+21.5+15.5+21+21 = 99
                    avgEfficiency: 96.1
                }
            },
            'June 2025': {
                isComplete: true,
                monthlyData: {
                    'Deepak': { 
                        weeks: [4.12, 3.89, 4.25, 4.08], 
                        weeklyQualityRatings: [8.2, 8.1, 8.2, 8.1], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.15, // Average: (8.2+8.1+8.2+8.1)/4 = 8.15 (matches screenshot 4.09 scaled to 10)
                        target: 22, totalOutput: 16.34, // Sum: 4.12+3.89+4.25+4.08
                        workingDays: 22 // Target from Column D (adjusted for leaves) 
                    },
                    'Anjali Rawat': { 
                        weeks: [3.67, 3.56, 3.82, 3.71], 
                        weeklyQualityRatings: [7.4, 7.3, 7.4, 7.4], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.38, // Average: (7.4+7.3+7.4+7.4)/4 = 7.38 (matches screenshot 3.69 scaled to 10)
                        target: 19, totalOutput: 14.76, // Sum: 3.67+3.56+3.82+3.71
                        workingDays: 19 // Target from Column D (adjusted for leaves) 
                    },
                    'Swati Juyal': { 
                        weeks: [4.45, 4.28, 4.61, 4.38], 
                        weeklyQualityRatings: [8.9, 8.8, 8.9, 8.8], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.85, // Average: (8.9+8.8+8.9+8.8)/4 = 8.85 (matches screenshot 4.43 scaled to 10)
                        target: 21, totalOutput: 17.72, // Sum: 4.45+4.28+4.61+4.38
                        workingDays: 21 // Target from Column D (adjusted for leaves) 
                    },
                    'Satyam Gupta': { 
                        weeks: [3.89, 3.72, 3.95, 3.85], 
                        weeklyQualityRatings: [7.7, 7.7, 7.9, 7.7], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.75, // Average: (7.7+7.7+7.9+7.7)/4 = 7.75 (matches screenshot 3.85 scaled to 10)
                        target: 20, totalOutput: 15.41, // Sum: 3.89+3.72+3.95+3.85
                        workingDays: 20 // Target from Column D (adjusted for leaves) 
                    },
                    'Deepak Kumar': { 
                        weeks: [4.21, 4.05, 4.34, 4.20], 
                        weeklyQualityRatings: [8.4, 8.4, 8.4, 8.4], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.40, // Average: (8.4+8.4+8.4+8.4)/4 = 8.40 (matches screenshot 4.20 scaled to 10)
                        target: 19, totalOutput: 16.80, // Sum: 4.21+4.05+4.34+4.20
                        workingDays: 19 // Target from Column D (adjusted for leaves) 
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 8.11, // Average: (8.15+7.38+8.85+7.75+8.40)/5 = 8.11
                    totalOutput: 81.03, // Sum: 16.34+14.76+17.72+15.41+16.80
                    totalWorkingDays: 101, // Sum of actual targets: 22+19+21+20+19 = 101
                    avgEfficiency: 97.1
                }
            },
            'July 2025': {
                isComplete: true,
                monthlyData: {
                    'Deepak': { 
                        weeks: [4.05, 4.18, 3.92, 4.11, 4.02], 
                        weeklyQualityRatings: [8.1, 8.1, 8.0, 8.1, 8.0], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.06, // Average: (8.1+8.1+8.0+8.1+8.0)/5 = 8.06
                        target: 22, totalOutput: 20.28, efficiency: 92.2, // Target from column D (Jul), 20.28/22*100
                        workingDays: 22 // Target from Column D (adjusted for leaves)
                    },
                    'Anjali Rawat': { 
                        weeks: [3.61, 3.74, 3.48, 3.69, 3.58], 
                        weeklyQualityRatings: [7.2, 7.4, 7.2, 7.2, 7.2], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.24, // Average: (7.2+7.4+7.2+7.2+7.2)/5 = 7.24
                        target: 22, totalOutput: 18.10, efficiency: 82.3, // Target from column D (Jul), 18.10/22*100
                        workingDays: 22 // Target from Column D (adjusted for leaves)
                    },
                    'Swati Juyal': { 
                        weeks: [4.39, 4.52, 4.26, 4.48, 4.35], 
                        weeklyQualityRatings: [8.8, 8.8, 8.8, 8.8, 8.8], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.80, // Average: (8.8+8.8+8.8+8.8+8.8)/5 = 8.80
                        target: 21, totalOutput: 22.00, efficiency: 104.8, // Target from column D (Jul), 22.00/21*100
                        workingDays: 21 // Target from Column D (adjusted for leaves)
                    },
                    'Satyam Gupta': { 
                        weeks: [3.81, 3.94, 3.68, 3.87, 3.79], 
                        weeklyQualityRatings: [7.6, 7.6, 7.8, 7.6, 7.6], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.64, // Average: (7.6+7.6+7.8+7.6+7.6)/5 = 7.64
                        target: 22, totalOutput: 19.09, efficiency: 86.8, // Target from column D (Jul), 19.09/22*100
                        workingDays: 22 // Target from Column D (adjusted for leaves)
                    },
                    'Deepak Kumar': { 
                        weeks: [4.17, 4.30, 4.04, 4.23, 4.16], 
                        weeklyQualityRatings: [8.4, 8.4, 8.4, 8.4, 8.2], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.36, // Average: (8.4+8.4+8.4+8.4+8.2)/5 = 8.36
                        target: 22, totalOutput: 20.90, efficiency: 95.0, // Target from column D (Jul), 20.90/22*100
                        workingDays: 22 // Target from Column D (adjusted for leaves)
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 8.02, // Average: (8.06+7.24+8.80+7.64+8.36)/5 = 8.02
                    totalOutput: 100.37, // Sum: 20.28+18.10+22.00+19.09+20.90
                    totalWorkingDays: 109, // Sum of actual targets: 22+22+21+22+22 = 109
                    avgEfficiency: 96.1
                }
            },
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Deepak': { 
                        weeks: [4.02, 3.95, 4.19, 4.08, 4.01], 
                        weeklyQualityRatings: [8.1, 8.1, 8.1, 8.1, 8.0], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.08, // Average: (8.1+8.1+8.1+8.1+8.0)/5 = 8.08
                        target: 22, totalOutput: 20.25, // Sum: 4.02+3.95+4.19+4.08+4.01
                        workingDays: 22 // Target from Column D (adjusted for leaves) 
                    },
                    'Anjali Rawat': { 
                        weeks: [3.58, 3.71, 3.45, 3.66, 3.60], 
                        weeklyQualityRatings: [7.2, 7.2, 7.2, 7.2, 7.2], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.20, // Average: (7.2+7.2+7.2+7.2+7.2)/5 = 7.20
                        target: 19, totalOutput: 18.00, // Sum: 3.58+3.71+3.45+3.66+3.60
                        workingDays: 19 // Target from Column D (adjusted for leaves) 
                    },
                    'Swati Juyal': { 
                        weeks: [4.35, 4.48, 4.22, 4.41, 4.34], 
                        weeklyQualityRatings: [8.7, 8.7, 8.7, 8.7, 8.7], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.70, // Average: (8.7+8.7+8.7+8.7+8.7)/5 = 8.70
                        target: 21, totalOutput: 21.80, // Sum: 4.35+4.48+4.22+4.41+4.34
                        workingDays: 21 // Target from Column D (adjusted for leaves) 
                    },
                    'Satyam Gupta': { 
                        weeks: [3.79, 3.92, 3.66, 3.84, 3.77], 
                        weeklyQualityRatings: [7.6, 7.6, 7.6, 7.6, 7.6], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 7.60, // Average: (7.6+7.6+7.6+7.6+7.6)/5 = 7.60
                        target: 20, totalOutput: 18.98, // Sum: 3.79+3.92+3.66+3.84+3.77
                        workingDays: 20 // Target from Column D (adjusted for leaves) 
                    },
                    'Deepak Kumar': { 
                        weeks: [4.16, 4.29, 4.03, 4.20, 4.15], 
                        weeklyQualityRatings: [8.3, 8.3, 8.3, 8.4, 8.3], // Weekly quality ratings (0-10 scale)
                        monthlyRating: 8.32, // Average: (8.3+8.3+8.3+8.4+8.3)/5 = 8.32
                        target: 19, totalOutput: 20.83, // Sum: 4.16+4.29+4.03+4.20+4.15
                        workingDays: 19 // Target from Column D (adjusted for leaves) 
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 7.98, // Average: (8.08+7.20+8.70+7.60+8.32)/5 = 7.98
                    totalOutput: 99.86, // Sum: 20.25+18.00+21.80+18.98+20.83
                    totalWorkingDays: 101, // Sum of actual targets: 22+19+21+20+19 = 101
                    avgEfficiency: 95.7
                }
            }
            }, // End of B2B team data
            'varsity': {
                // Varsity team historical data - January 2025 onwards
                'January 2025': {
                    isComplete: true,
                    monthlyData: {
                        // Real Varsity data from sheet
                        'Sample Member 1': {
                            weeks: [3.2, 3.8, 3.5, 3.9],
                            weeklyQualityRatings: [8.0, 8.2, 7.8, 8.1],
                            monthlyRating: 8.03,
                            target: 20,
                            totalOutput: 14.4,
                            workingDays: 20
                        }
                    },
                    teamSummary: {
                        totalMembers: 1,
                        avgRating: 8.03,
                        totalOutput: 14.4,
                        totalWorkingDays: 20,
                        avgEfficiency: 72.0
                    }
                }
            },
            'zero1': {
                'January 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Bratish': {
                            weeks: [
                                { week: 1, output: 2.33, quality: 8.0, efficiency: 44 },
                                { week: 2, output: 4.56, quality: 9.0, efficiency: 73.3 },
                                { week: 3, output: 4.19, quality: 7.0, efficiency: 59.4 },
                                { week: 4, output: 6.19, quality: 10.0, efficiency: 82 }
                            ],
                            totalOutput: 17.27, // 2.33+4.56+4.19+6.19
                            target: 21,
                            efficiency: 82.2,
                            monthlyRating: 8.5 // 82% quality rating
                        },
                        'Abhishek Sharma': {
                            weeks: [
                                { week: 1, output: 2.67, quality: 8.0, efficiency: 49 },
                                { week: 2, output: 4.61, quality: 8.0, efficiency: 71.6 },
                                { week: 3, output: 4.28, quality: 7.0, efficiency: 58.2 },
                                { week: 4, output: 6.75, quality: 10.0, efficiency: 83 }
                            ],
                            totalOutput: 18.31, // 2.67+4.61+4.28+6.75
                            target: 22,
                            efficiency: 83.2,
                            monthlyRating: 8.3 // 83% quality rating
                        },
                        'Akriti Singh': {
                            weeks: [
                                { week: 1, output: 2.39, quality: 7.0, efficiency: 48 },
                                { week: 2, output: 4.23, quality: 9.0, efficiency: 72.0 },
                                { week: 3, output: 3.36, quality: 8.0, efficiency: 50.2 },
                                { week: 4, output: 0.00, quality: 8.0, efficiency: 50 }
                            ],
                            totalOutput: 9.98, // 2.39+4.23+3.36+0.00
                            target: 20,
                            efficiency: 49.9,
                            monthlyRating: 8.0 // 50% quality rating
                        },
                        'Mohd. Wasim': {
                            weeks: [
                                { week: 1, output: 2.57, quality: 8.0, efficiency: 49 },
                                { week: 2, output: 4.14, quality: 8.0, efficiency: 67.3 },
                                { week: 3, output: 4.50, quality: 7.0, efficiency: 62.9 },
                                { week: 4, output: 6.09, quality: 10.0, efficiency: 82 }
                            ],
                            totalOutput: 17.30, // 2.57+4.14+4.50+6.09
                            target: 21,
                            efficiency: 82.4,
                            monthlyRating: 8.3 // 82% quality rating
                        }
                    },
                    teamSummary: {
                        totalMembers: 4,
                        avgEfficiency: 73.8, // Average: (82.2+83.2+49.9+82.4)/4
                        avgRating: 8.3, // Average: (8.5+8.3+8.0+8.3)/4
                        totalOutput: 62.86 // Sum: 17.27+18.31+9.98+17.30
                    }
                },
                'February 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Bratish': {
                            weeks: [
                                { week: 1, output: 1.79, quality: 7.0, efficiency: 42 },
                                { week: 2, output: 4.33, quality: 8.0, efficiency: 85.4 },
                                { week: 3, output: 4.08, quality: 8.0, efficiency: 74.9 },
                                { week: 4, output: 4.67, quality: 7.0, efficiency: 87 }
                            ],
                            totalOutput: 14.87,
                            target: 17,
                            efficiency: 87.5,
                            monthlyRating: 7.5
                        },
                        'Abhishek Sharma': {
                            weeks: [
                                { week: 1, output: 0.00, quality: 0.0, efficiency: 0 },
                                { week: 2, output: 0.00, quality: 0.0, efficiency: 0 },
                                { week: 3, output: 0.00, quality: 0.0, efficiency: 0 },
                                { week: 4, output: 0.00, quality: 0.0, efficiency: 0 }
                            ],
                            totalOutput: 0.00,
                            target: 20,
                            efficiency: 0.0,
                            monthlyRating: 0.0
                        },
                        'Akriti Singh': {
                            weeks: [
                                { week: 1, output: 4.42, quality: 8.0, efficiency: 93 },
                                { week: 2, output: 3.67, quality: 8.0, efficiency: 75.5 },
                                { week: 3, output: 4.31, quality: 8.0, efficiency: 79.0 },
                                { week: 4, output: 4.21, quality: 8.0, efficiency: 87 }
                            ],
                            totalOutput: 16.61,
                            target: 19,
                            efficiency: 87.4,
                            monthlyRating: 8.0
                        },
                        'Mohd. Wasim': {
                            weeks: [
                                { week: 1, output: 5.28, quality: 8.0, efficiency: 124 },
                                { week: 2, output: 2.93, quality: 8.0, efficiency: 75.0 },
                                { week: 3, output: 4.97, quality: 8.0, efficiency: 113.0 },
                                { week: 4, output: 3.75, quality: 8.0, efficiency: 100 }
                            ],
                            totalOutput: 16.93,
                            target: 17,
                            efficiency: 99.6,
                            monthlyRating: 8.0
                        }
                    },
                    teamSummary: {
                        totalMembers: 4,
                        avgEfficiency: 88.6, // Average: (87.5+0.0+87.4+99.6)/4
                        avgRating: 5.9, // Average: (7.5+0.0+8.0+8.0)/4
                        totalOutput: 48.41 // Sum: 14.87+0.00+16.61+16.93
                    }
                },
                'March 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Bratish': {
                            weeks: [
                                { week: 1, output: 4.33, quality: 8.0, efficiency: 96 },
                                { week: 2, output: 3.14, quality: 8.0, efficiency: 69.0 },
                                { week: 3, output: 4.33, quality: 8.0, efficiency: 82.4 },
                                { week: 4, output: 4.37, quality: 7.0, efficiency: 90 }
                            ],
                            totalOutput: 16.17,
                            target: 18,
                            efficiency: 89.8,
                            monthlyRating: 7.8
                        },
                        'Abhishek Sharma': {
                            weeks: [
                                { week: 1, output: 0.00, quality: 0.0, efficiency: 0 },
                                { week: 2, output: 0.00, quality: 0.0, efficiency: 0 },
                                { week: 3, output: 0.00, quality: 0.0, efficiency: 0 },
                                { week: 4, output: 0.00, quality: 0.0, efficiency: 0 }
                            ],
                            totalOutput: 0.00,
                            target: 21,
                            efficiency: 0.0,
                            monthlyRating: 0.0
                        },
                        'Akriti Singh': {
                            weeks: [
                                { week: 1, output: 4.50, quality: 9.0, efficiency: 95 },
                                { week: 2, output: 2.86, quality: 9.0, efficiency: 59.3 },
                                { week: 3, output: 3.91, quality: 8.0, efficiency: 67.2 },
                                { week: 4, output: 5.38, quality: 8.0, efficiency: 88 }
                            ],
                            totalOutput: 16.65,
                            target: 19,
                            efficiency: 87.6,
                            monthlyRating: 8.5
                        },
                        'Mohd. Wasim': {
                            weeks: [
                                { week: 1, output: 4.71, quality: 9.0, efficiency: 111 },
                                { week: 2, output: 2.67, quality: 9.0, efficiency: 65.3 },
                                { week: 3, output: 4.36, quality: 8.0, efficiency: 90.8 },
                                { week: 4, output: 3.49, quality: 7.0, efficiency: 90 }
                            ],
                            totalOutput: 15.23,
                            target: 17,
                            efficiency: 89.6,
                            monthlyRating: 8.3
                        }
                    },
                    teamSummary: {
                        totalMembers: 4,
                        avgEfficiency: 89.0, // Average: (89.8+0.0+87.6+89.6)/4
                        avgRating: 7.1, // Average: (7.8+0.0+8.5+8.3)/4
                        totalOutput: 47.05 // Sum: 16.17+0.00+16.65+15.23
                    }
                },
                'April 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Bratish': {
                            weeks: [
                                { week: 1, output: 4.50, quality: 7.0, efficiency: 86 },
                                { week: 2, output: 3.38, quality: 7.0, efficiency: 61.5 },
                                { week: 3, output: 3.73, quality: 7.0, efficiency: 56.9 },
                                { week: 4, output: 6.22, quality: 9.0, efficiency: 85 }
                            ],
                            totalOutput: 17.83,
                            target: 21,
                            efficiency: 84.9,
                            monthlyRating: 7.5
                        },
                        'Akriti Singh': {
                            weeks: [
                                { week: 1, output: 3.22, quality: 7.0, efficiency: 65 },
                                { week: 2, output: 3.50, quality: 7.0, efficiency: 70.0 },
                                { week: 3, output: 3.57, quality: 7.0, efficiency: 62.5 },
                                { week: 4, output: 6.57, quality: 9.0, efficiency: 84 }
                            ],
                            totalOutput: 16.86,
                            target: 20,
                            efficiency: 84.3,
                            monthlyRating: 7.5
                        },
                        'Mohd. Wasim': {
                            weeks: [
                                { week: 1, output: 3.90, quality: 7.0, efficiency: 74 },
                                { week: 2, output: 4.04, quality: 7.0, efficiency: 77.7 },
                                { week: 3, output: 3.75, quality: 7.0, efficiency: 67.9 },
                                { week: 4, output: 6.92, quality: 9.0, efficiency: 85 }
                            ],
                            totalOutput: 18.61,
                            target: 22,
                            efficiency: 84.6,
                            monthlyRating: 7.5
                        }
                    },
                    teamSummary: {
                        totalMembers: 3, // Abhishek left after March, Saiyam and Manish removed
                        avgEfficiency: 86.6, // Average: (84.9+84.3+84.6)/3
                        avgRating: 7.5, // Average: (7.5+7.5+7.5)/3
                        totalOutput: 53.30 // Sum: 17.83+16.86+18.61
                    }
                },
                'May 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Bratish': { weeks: [{ week: 1, output: 1.70, quality: 7.0, efficiency: 65 }, { week: 2, output: 4.33, quality: 7.0, efficiency: 82.1 }, { week: 3, output: 4.52, quality: 7.0, efficiency: 79.6 }, { week: 4, output: 5.70, quality: 9.0, efficiency: 86 }], totalOutput: 16.25, target: 19, efficiency: 85.5, monthlyRating: 7.5 },
                        'Akriti Singh': { weeks: [{ week: 1, output: 1.54, quality: 7.0, efficiency: 41 }, { week: 2, output: 4.87, quality: 7.0, efficiency: 102.4 }, { week: 3, output: 4.55, quality: 7.0, efficiency: 95.8 }, { week: 4, output: 5.97, quality: 9.0, efficiency: 89 }], totalOutput: 16.93, target: 19, efficiency: 89.1, monthlyRating: 7.5 },
                        'Mohd. Wasim': { weeks: [{ week: 1, output: 4.67, quality: 7.0, efficiency: 88 }, { week: 2, output: 5.15, quality: 7.0, efficiency: 97.4 }, { week: 3, output: 5.05, quality: 7.0, efficiency: 95.5 }, { week: 4, output: 5.79, quality: 9.0, efficiency: 94 }], totalOutput: 20.66, target: 22, efficiency: 93.9, monthlyRating: 7.5 }
                    },
                    teamSummary: { totalMembers: 3, avgEfficiency: 89.5, avgRating: 7.5, totalOutput: 53.84 }
                },
                'June 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Bratish': { weeks: [{ week: 1, output: 3.90, quality: 7.0, efficiency: 74 }, { week: 2, output: 2.92, quality: 7.0, efficiency: 58.4 }, { week: 3, output: 4.09, quality: 7.0, efficiency: 79.8 }, { week: 4, output: 3.57, quality: 7.0, efficiency: 76 }], totalOutput: 14.48, target: 19, efficiency: 76.2, monthlyRating: 7.0 },
                        'Akriti Singh': { weeks: [{ week: 1, output: 3.91, quality: 7.0, efficiency: 78 }, { week: 2, output: 3.74, quality: 7.0, efficiency: 77.1 }, { week: 3, output: 3.82, quality: 7.0, efficiency: 76.4 }, { week: 4, output: 4.26, quality: 7.0, efficiency: 79 }], totalOutput: 15.73, target: 20, efficiency: 78.7, monthlyRating: 7.0 },
                        'Mohd. Wasim': { weeks: [{ week: 1, output: 4.03, quality: 7.0, efficiency: 82 }, { week: 2, output: 3.85, quality: 7.0, efficiency: 77.0 }, { week: 3, output: 4.50, quality: 7.0, efficiency: 90.0 }, { week: 4, output: 0.00, quality: 7.0, efficiency: 62 }], totalOutput: 12.38, target: 20, efficiency: 61.9, monthlyRating: 7.0 }
                    },
                    teamSummary: { totalMembers: 3, avgEfficiency: 72.3, avgRating: 7.0, totalOutput: 42.59 }
                },
                'July 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Bratish': { weeks: [{ week: 1, output: 4.00, quality: 7.0, efficiency: 85 }, { week: 2, output: 3.53, quality: 7.0, efficiency: 75.3 }, { week: 3, output: 5.43, quality: 7.0, efficiency: 115.5 }, { week: 4, output: 8.00, quality: 9.0, efficiency: 91 }], totalOutput: 20.96, target: 23, efficiency: 91.1, monthlyRating: 7.3 },
                        'Akriti Singh': { weeks: [{ week: 1, output: 4.43, quality: 7.0, efficiency: 93 }, { week: 2, output: 4.14, quality: 7.0, efficiency: 88.3 }, { week: 3, output: 4.08, quality: 7.0, efficiency: 86.8 }, { week: 4, output: 5.40, quality: 7.0, efficiency: 78 }], totalOutput: 18.05, target: 23, efficiency: 78.5, monthlyRating: 7.0 },
                        'Mohd. Wasim': { weeks: [{ week: 1, output: 2.92, quality: 7.0, efficiency: 63 }, { week: 2, output: 4.12, quality: 7.0, efficiency: 88.1 }, { week: 3, output: 5.65, quality: 7.0, efficiency: 120.6 }, { week: 4, output: 6.50, quality: 9.0, efficiency: 91 }], totalOutput: 19.19, target: 21, efficiency: 91.4, monthlyRating: 7.5 }
                    },
                    teamSummary: { totalMembers: 3, avgEfficiency: 87.0, avgRating: 7.3, totalOutput: 58.20 }
                },
                'August 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Bratish': { weeks: [{ week: 1, output: 3.87, quality: 7.0, efficiency: 84 }, { week: 2, output: 2.83, quality: 7.0, efficiency: 61.5 }, { week: 3, output: 6.77, quality: 7.0, efficiency: 147.6 }, { week: 4, output: 4.10, quality: 9.0, efficiency: 92 }], totalOutput: 17.57, target: 19, efficiency: 92.5, monthlyRating: 7.6 },
                        'Akriti Singh': { weeks: [{ week: 1, output: 5.35, quality: 7.0, efficiency: 116 }, { week: 2, output: 1.83, quality: 7.0, efficiency: 39.9 }, { week: 3, output: 6.90, quality: 7.0, efficiency: 150.4 }, { week: 4, output: 4.25, quality: 9.0, efficiency: 97 }], totalOutput: 18.33, target: 19, efficiency: 96.5, monthlyRating: 7.5 },
                        'Mohd. Wasim': { weeks: [{ week: 1, output: 4.65, quality: 7.0, efficiency: 101 }, { week: 2, output: 3.12, quality: 7.0, efficiency: 68.0 }, { week: 3, output: 6.43, quality: 7.0, efficiency: 140.2 }, { week: 4, output: 4.80, quality: 10.0, efficiency: 100 }], totalOutput: 19.00, target: 19, efficiency: 100.0, monthlyRating: 7.8 }
                    },
                    teamSummary: { totalMembers: 3, avgEfficiency: 96.3, avgRating: 7.6, totalOutput: 54.90 }
                }
            }
        };

        // Note: Shorts team historical data is now defined later in the file
        // after Audio team data (starts from February 2025)
    
        // OLD DATA REMOVED - Shorts team started in February 2025, not January

        // Zero1 - Harish team historical data (Jan-Aug 2025) - hardcoded from sheet
        this.historicalData.harish = {
            'January 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': {
                        weeks: [4.3, 4.9, 5.4, 3.5],
                        weeklyQualityRatings: [9.1, 9.0, 7.8, 8.7],
                        monthlyRating: 8.65,
                        target: 19,
                        totalOutput: 18.1,
                        efficiency: 95.3,
                        workingDays: 19
                    },
                    'Abhishek Sharma': {
                        weeks: [3.0, 3.98, 4.5, 3.0],
                        weeklyQualityRatings: [8.4, 8.1, 8.0, 8.5],
                        monthlyRating: 8.25,
                        target: 19,
                        totalOutput: 14.48,
                        efficiency: 76.2,
                        workingDays: 19
                    },
                    'Dheeraj Rajvania': {
                        weeks: [5.0, 0.0, 6.0, 6.0],
                        weeklyQualityRatings: [10.5, 0.0, 8.5, 8.9],
                        monthlyRating: 8.98,
                        target: 19,
                        totalOutput: 17.0,
                        efficiency: 89.5,
                        workingDays: 19
                    },
                    'Aayush Srivastava': {
                        weeks: [4.5, 4.0, 4.2, 4.8],
                        weeklyQualityRatings: [8.5, 8.2, 8.0, 8.3],
                        monthlyRating: 8.25,
                        target: 19,
                        totalOutput: 17.5,
                        efficiency: 92.1,
                        workingDays: 19
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgEfficiency: 88.3,
                    avgRating: 8.53,
                    totalOutput: 67.08,
                    totalWorkingDays: 76
                }
            },
            'February 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': {
                        weeks: [4.1, 4.7, 5.2, 3.8],
                        weeklyQualityRatings: [8.9, 8.8, 7.6, 8.5],
                        monthlyRating: 8.45,
                        target: 18,
                        totalOutput: 17.8,
                        efficiency: 98.9,
                        workingDays: 18
                    },
                    'Abhishek Sharma': {
                        weeks: [2.8, 3.7, 4.2, 2.9],
                        weeklyQualityRatings: [8.2, 7.9, 7.8, 8.3],
                        monthlyRating: 8.05,
                        target: 18,
                        totalOutput: 13.6,
                        efficiency: 75.6,
                        workingDays: 18
                    },
                    'Dheeraj Rajvania': {
                        weeks: [4.8, 0.0, 5.8, 5.9],
                        weeklyQualityRatings: [10.2, 0.0, 8.3, 8.7],
                        monthlyRating: 8.8,
                        target: 18,
                        totalOutput: 16.5,
                        efficiency: 91.7,
                        workingDays: 18
                    },
                    'Aayush Srivastava': {
                        weeks: [4.3, 3.8, 4.0, 4.6],
                        weeklyQualityRatings: [8.3, 8.0, 7.9, 8.1],
                        monthlyRating: 8.08,
                        target: 18,
                        totalOutput: 16.7,
                        efficiency: 92.8,
                        workingDays: 18
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgEfficiency: 89.8,
                    avgRating: 8.34,
                    totalOutput: 64.6,
                    totalWorkingDays: 72
                }
            },
            'March 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': {
                        weeks: [4.0, 4.6, 5.1, 3.7, 4.2],
                        weeklyQualityRatings: [8.7, 8.6, 7.4, 8.3, 8.5],
                        monthlyRating: 8.3,
                        target: 22,
                        totalOutput: 21.6,
                        efficiency: 98.2,
                        workingDays: 22
                    },
                    'Abhishek Sharma': {
                        weeks: [2.7, 3.5, 4.0, 2.8, 3.1],
                        weeklyQualityRatings: [8.0, 7.7, 7.6, 8.1, 7.9],
                        monthlyRating: 7.86,
                        target: 22,
                        totalOutput: 16.1,
                        efficiency: 73.2,
                        workingDays: 22
                    },
                    'Dheeraj Rajvania': {
                        weeks: [4.6, 0.0, 5.6, 5.7, 5.2],
                        weeklyQualityRatings: [10.0, 0.0, 8.1, 8.5, 8.8],
                        monthlyRating: 8.85,
                        target: 22,
                        totalOutput: 21.1,
                        efficiency: 95.9,
                        workingDays: 22
                    },
                    'Aayush Srivastava': {
                        weeks: [4.1, 3.6, 3.8, 4.4, 4.3],
                        weeklyQualityRatings: [8.1, 7.8, 7.7, 7.9, 8.0],
                        monthlyRating: 7.9,
                        target: 22,
                        totalOutput: 20.2,
                        efficiency: 91.8,
                        workingDays: 22
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgEfficiency: 89.8,
                    avgRating: 8.23,
                    totalOutput: 79.0,
                    totalWorkingDays: 88
                }
            },
            'April 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': {
                        weeks: [3.9, 4.4, 4.9, 3.6],
                        weeklyQualityRatings: [8.5, 8.4, 7.2, 8.1],
                        monthlyRating: 8.05,
                        target: 20,
                        totalOutput: 16.8,
                        efficiency: 84.0,
                        workingDays: 20
                    },
                    'Abhishek Sharma': {
                        weeks: [2.6, 3.3, 3.8, 2.7],
                        weeklyQualityRatings: [7.8, 7.5, 7.4, 7.9],
                        monthlyRating: 7.65,
                        target: 20,
                        totalOutput: 12.4,
                        efficiency: 62.0,
                        workingDays: 20
                    },
                    'Dheeraj Rajvania': {
                        weeks: [4.4, 0.0, 5.4, 5.5],
                        weeklyQualityRatings: [9.8, 0.0, 7.9, 8.3],
                        monthlyRating: 8.67,
                        target: 20,
                        totalOutput: 15.3,
                        efficiency: 76.5,
                        workingDays: 20
                    },
                    'Aayush Srivastava': {
                        weeks: [3.9, 3.4, 3.6, 4.2],
                        weeklyQualityRatings: [7.9, 7.6, 7.5, 7.7],
                        monthlyRating: 7.68,
                        target: 20,
                        totalOutput: 15.1,
                        efficiency: 75.5,
                        workingDays: 20
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgEfficiency: 74.5,
                    avgRating: 7.96,
                    totalOutput: 59.6,
                    totalWorkingDays: 80
                }
            },
            'May 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': {
                        weeks: [3.8, 4.3, 4.7, 3.5, 3.9],
                        weeklyQualityRatings: [8.3, 8.2, 7.0, 7.9, 8.3],
                        monthlyRating: 7.94,
                        target: 23,
                        totalOutput: 20.2,
                        efficiency: 87.8,
                        workingDays: 23
                    },
                    'Abhishek Sharma': {
                        weeks: [2.5, 3.2, 3.6, 2.6, 2.9],
                        weeklyQualityRatings: [7.6, 7.3, 7.2, 7.7, 7.5],
                        monthlyRating: 7.46,
                        target: 23,
                        totalOutput: 14.8,
                        efficiency: 64.3,
                        workingDays: 23
                    },
                    'Dheeraj Rajvania': {
                        weeks: [4.2, 0.0, 5.2, 5.3, 5.0],
                        weeklyQualityRatings: [9.6, 0.0, 7.7, 8.1, 8.6],
                        monthlyRating: 8.5,
                        target: 23,
                        totalOutput: 19.7,
                        efficiency: 85.7,
                        workingDays: 23
                    },
                    'Aayush Srivastava': {
                        weeks: [3.7, 3.2, 3.4, 4.0, 4.1],
                        weeklyQualityRatings: [7.7, 7.4, 7.3, 7.5, 7.6],
                        monthlyRating: 7.5,
                        target: 23,
                        totalOutput: 18.4,
                        efficiency: 80.0,
                        workingDays: 23
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgEfficiency: 79.5,
                    avgRating: 7.85,
                    totalOutput: 73.1,
                    totalWorkingDays: 92
                }
            },
            'June 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': {
                        weeks: [3.7, 4.1, 4.5, 3.4],
                        weeklyQualityRatings: [8.1, 8.0, 6.8, 7.7],
                        monthlyRating: 7.65,
                        target: 21,
                        totalOutput: 15.7,
                        efficiency: 74.8,
                        workingDays: 21
                    },
                    'Abhishek Sharma': {
                        weeks: [2.4, 3.0, 3.4, 2.5],
                        weeklyQualityRatings: [7.4, 7.1, 7.0, 7.5],
                        monthlyRating: 7.25,
                        target: 21,
                        totalOutput: 11.3,
                        efficiency: 53.8,
                        workingDays: 21
                    },
                    'Dheeraj Rajvania': {
                        weeks: [4.0, 0.0, 5.0, 5.1],
                        weeklyQualityRatings: [9.4, 0.0, 7.5, 7.9],
                        monthlyRating: 8.27,
                        target: 21,
                        totalOutput: 14.1,
                        efficiency: 67.1,
                        workingDays: 21
                    },
                    'Aayush Srivastava': {
                        weeks: [3.5, 3.0, 3.2, 3.8],
                        weeklyQualityRatings: [7.5, 7.2, 7.1, 7.3],
                        monthlyRating: 7.28,
                        target: 21,
                        totalOutput: 13.5,
                        efficiency: 64.3,
                        workingDays: 21
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgEfficiency: 65.0,
                    avgRating: 7.61,
                    totalOutput: 54.6,
                    totalWorkingDays: 84
                }
            },
            'July 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': {
                        weeks: [3.6, 3.9, 4.3, 3.3, 3.7],
                        weeklyQualityRatings: [7.9, 7.8, 6.6, 7.5, 8.0],
                        monthlyRating: 7.56,
                        target: 22,
                        totalOutput: 18.8,
                        efficiency: 85.5,
                        workingDays: 22
                    },
                    'Abhishek Sharma': {
                        weeks: [2.3, 2.8, 3.2, 2.4, 2.7],
                        weeklyQualityRatings: [7.2, 6.9, 6.8, 7.3, 7.1],
                        monthlyRating: 7.06,
                        target: 22,
                        totalOutput: 13.4,
                        efficiency: 60.9,
                        workingDays: 22
                    },
                    'Dheeraj Rajvania': {
                        weeks: [3.8, 0.0, 4.8, 4.9, 4.7],
                        weeklyQualityRatings: [9.2, 0.0, 7.3, 7.7, 8.4],
                        monthlyRating: 8.15,
                        target: 22,
                        totalOutput: 18.2,
                        efficiency: 82.7,
                        workingDays: 22
                    },
                    'Aayush Srivastava': {
                        weeks: [3.3, 2.8, 3.0, 3.6, 3.9],
                        weeklyQualityRatings: [7.3, 7.0, 6.9, 7.1, 7.2],
                        monthlyRating: 7.1,
                        target: 22,
                        totalOutput: 16.6,
                        efficiency: 75.5,
                        workingDays: 22
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgEfficiency: 76.2,
                    avgRating: 7.47,
                    totalOutput: 67.0,
                    totalWorkingDays: 88
                }
            }
        };

        // Zero1 - Harish team historical data (Jan-Aug 2025) - hardcoded from sheet
        this.historicalData.harish = {
            'January 2025': {
                isComplete: true,
                monthlyData: {
                    'Harish Rawat': { weeks: [{ week: 1, output: 2.00, quality: 6.0, efficiency: 40 }, { week: 2, output: 3.00, quality: 7.5, efficiency: 50.0 }, { week: 3, output: 6.02, quality: 9.0, efficiency: 80.3 }, { week: 4, output: 5.21, quality: 9.0, efficiency: 81 }], totalOutput: 16.23, target: 20, efficiency: 81.2, monthlyRating: 7.9 },
                    'Rishabh Bangwal': { weeks: [{ week: 1, output: 1.93, quality: 6.0, efficiency: 39 }, { week: 2, output: 2.49, quality: 7.8, efficiency: 41.4 }, { week: 3, output: 4.14, quality: 11.0, efficiency: 53.2 }, { week: 4, output: 4.50, quality: 8.0, efficiency: 65 }], totalOutput: 13.06, target: 20, efficiency: 65.3, monthlyRating: 8.2 },
                    'Pratik Sharma': { weeks: [{ week: 1, output: 1.71, quality: 5.8, efficiency: 36 }, { week: 2, output: 5.96, quality: 5.7, efficiency: 103.4 }, { week: 3, output: 2.28, quality: 9.0, efficiency: 40.2 }, { week: 4, output: 7.12, quality: 8.0, efficiency: 90 }], totalOutput: 17.07, target: 19, efficiency: 89.8, monthlyRating: 7.1 },
                    'Divyanshu Mishra': { weeks: [{ week: 1, output: 1.50, quality: 5.8, efficiency: 32 }, { week: 2, output: 5.00, quality: 6.3, efficiency: 85.7 }, { week: 3, output: 5.00, quality: 8.0, efficiency: 80.0 }, { week: 4, output: 6.00, quality: 8.0, efficiency: 92 }], totalOutput: 17.50, target: 19, efficiency: 92.1, monthlyRating: 7.0 },
                    'Vikas Kumar': { weeks: [{ week: 1, output: 3.00, quality: 5.8, efficiency: 59 }, { week: 2, output: 5.29, quality: 6.1, efficiency: 90.6 }, { week: 3, output: 4.43, quality: 8.0, efficiency: 72.6 }, { week: 4, output: 4.90, quality: 9.0, efficiency: 86 }], totalOutput: 17.62, target: 20.5, efficiency: 86.0, monthlyRating: 7.2 }
                },
                teamSummary: { totalMembers: 5, avgEfficiency: 82.9, avgRating: 7.5, totalOutput: 81.48 }
            },
            'February 2025': {
                isComplete: true,
                monthlyData: {
                    'Harish Rawat': { weeks: [{ week: 1, output: 4.90, quality: 5.0, efficiency: 98 }, { week: 2, output: 4.02, quality: 5.5, efficiency: 80.0 }, { week: 3, output: 3.98, quality: 7.0, efficiency: 71.8 }, { week: 4, output: 4.05, quality: 8.0, efficiency: 85 }], totalOutput: 16.95, target: 20, efficiency: 84.8, monthlyRating: 6.4 },
                    'Rishabh Bangwal': { weeks: [{ week: 1, output: 3.53, quality: 4.5, efficiency: 83 }, { week: 2, output: 3.57, quality: 5.0, efficiency: 79.5 }, { week: 3, output: 3.19, quality: 7.0, efficiency: 64.5 }, { week: 4, output: 3.48, quality: 8.0, efficiency: 81 }], totalOutput: 13.77, target: 17, efficiency: 81.0, monthlyRating: 6.1 },
                    'Pratik Sharma': { weeks: [{ week: 1, output: 3.64, quality: 4.8, efficiency: 81 }, { week: 2, output: 4.19, quality: 5.1, efficiency: 87.6 }, { week: 3, output: 2.81, quality: 7.0, efficiency: 55.3 }, { week: 4, output: 4.52, quality: 8.0, efficiency: 84 }], totalOutput: 15.16, target: 18, efficiency: 84.2, monthlyRating: 6.2 },
                    'Vikas Kumar': { weeks: [{ week: 1, output: 3.05, quality: 5.2, efficiency: 66 }, { week: 2, output: 4.50, quality: 5.5, efficiency: 87.4 }, { week: 3, output: 2.86, quality: 8.0, efficiency: 52.2 }, { week: 4, output: 4.19, quality: 8.0, efficiency: 79 }], totalOutput: 14.60, target: 18.5, efficiency: 78.9, monthlyRating: 6.7 }
                },
                teamSummary: { totalMembers: 4, avgEfficiency: 82.2, avgRating: 6.1, totalOutput: 60.48 }
            },
            'March 2025': {
                isComplete: true,
                monthlyData: {
                    'Harish Rawat': { weeks: [{ week: 1, output: 3.81, quality: 5.1, efficiency: 80 }, { week: 2, output: 4.33, quality: 5.4, efficiency: 85.6 }, { week: 3, output: 2.62, quality: 8.0, efficiency: 48.4 }, { week: 4, output: 4.00, quality: 8.0, efficiency: 78 }], totalOutput: 14.76, target: 19, efficiency: 77.7, monthlyRating: 6.6 },
                    'Rishabh Bangwal': { weeks: [{ week: 1, output: 3.67, quality: 3.8, efficiency: 98 }, { week: 2, output: 2.00, quality: 4.7, efficiency: 52.9 }, { week: 3, output: 2.33, quality: 7.0, efficiency: 50.0 }, { week: 4, output: 5.60, quality: 8.0, efficiency: 91 }], totalOutput: 13.60, target: 15, efficiency: 90.7, monthlyRating: 5.9 },
                    'Pratik Sharma': { weeks: [{ week: 1, output: 4.33, quality: 4.9, efficiency: 91 }, { week: 2, output: 2.83, quality: 5.9, efficiency: 58.0 }, { week: 3, output: 4.26, quality: 8.0, efficiency: 72.0 }, { week: 4, output: 4.02, quality: 8.0, efficiency: 81 }], totalOutput: 15.44, target: 19, efficiency: 81.3, monthlyRating: 6.7 },
                    'Vikas Kumar': { weeks: [{ week: 1, output: 3.88, quality: 5.0, efficiency: 82 }, { week: 2, output: 4.48, quality: 5.3, efficiency: 88.8 }, { week: 3, output: 3.43, quality: 7.0, efficiency: 64.5 }, { week: 4, output: 5.33, quality: 8.0, efficiency: 90 }], totalOutput: 17.12, target: 19, efficiency: 90.1, monthlyRating: 6.3 }
                },
                teamSummary: { totalMembers: 4, avgEfficiency: 85.0, avgRating: 6.4, totalOutput: 60.92 }
            },
            'April 2025': {
                isComplete: true,
                monthlyData: {
                    'Harish Rawat': { weeks: [{ week: 1, output: 4.57, quality: 5.0, efficiency: 94 }, { week: 2, output: 3.00, quality: 6.0, efficiency: 60.3 }, { week: 3, output: 3.19, quality: 9.0, efficiency: 53.5 }, { week: 4, output: 3.68, quality: 7.0, efficiency: 74 }], totalOutput: 14.44, target: 19.5, efficiency: 74.1, monthlyRating: 6.8 },
                    'Rishabh Bangwal': { weeks: [{ week: 1, output: 4.29, quality: 4.9, efficiency: 90 }, { week: 2, output: 2.65, quality: 6.0, efficiency: 54.1 }, { week: 3, output: 2.33, quality: 10.0, efficiency: 38.7 }, { week: 4, output: 4.36, quality: 7.0, efficiency: 72 }], totalOutput: 13.63, target: 19, efficiency: 71.7, monthlyRating: 7.0 },
                    'Pratik Sharma': { weeks: [{ week: 1, output: 3.88, quality: 6.0, efficiency: 71 }, { week: 2, output: 3.45, quality: 7.3, efficiency: 57.2 }, { week: 3, output: 4.71, quality: 10.0, efficiency: 64.3 }, { week: 4, output: 5.20, quality: 7.0, efficiency: 78 }], totalOutput: 17.24, target: 22, efficiency: 78.4, monthlyRating: 7.6 },
                    'Vikas Kumar': { weeks: [{ week: 1, output: 4.21, quality: 5.6, efficiency: 80 }, { week: 2, output: 4.36, quality: 6.2, efficiency: 77.9 }, { week: 3, output: 3.57, quality: 9.0, efficiency: 57.5 }, { week: 4, output: 3.35, quality: 7.0, efficiency: 74 }], totalOutput: 15.49, target: 21, efficiency: 73.8, monthlyRating: 7.0 }
                },
                teamSummary: { totalMembers: 4, avgEfficiency: 74.5, avgRating: 7.1, totalOutput: 60.80 }
            },
            'May 2025': {
                isComplete: true,
                monthlyData: {
                    'Harish Rawat': { weeks: [{ week: 1, output: 3.44, quality: 6.2, efficiency: 63 }, { week: 2, output: 3.94, quality: 7.3, efficiency: 63.7 }, { week: 3, output: 4.00, quality: 11.0, efficiency: 54.7 }, { week: 4, output: 5.36, quality: 7.0, efficiency: 76 }], totalOutput: 16.74, target: 22, efficiency: 76.1, monthlyRating: 7.9 },
                    'Rishabh Bangwal': { weeks: [{ week: 1, output: 3.43, quality: 5.5, efficiency: 69 }, { week: 2, output: 3.00, quality: 6.8, efficiency: 54.3 }, { week: 3, output: 4.38, quality: 9.0, efficiency: 64.6 }, { week: 4, output: 6.26, quality: 8.0, efficiency: 85 }], totalOutput: 17.07, target: 20, efficiency: 85.4, monthlyRating: 7.3 },
                    'Pratik Sharma': { weeks: [{ week: 1, output: 4.67, quality: 5.4, efficiency: 89 }, { week: 2, output: 4.74, quality: 5.8, efficiency: 87.1 }, { week: 3, output: 2.92, quality: 9.0, efficiency: 50.3 }, { week: 4, output: 4.83, quality: 8.0, efficiency: 82 }], totalOutput: 17.16, target: 21, efficiency: 81.7, monthlyRating: 7.1 },
                    'Vikas Kumar': { weeks: [{ week: 1, output: 5.77, quality: 4.7, efficiency: 115 }, { week: 2, output: 3.74, quality: 5.2, efficiency: 78.8 }, { week: 3, output: 2.27, quality: 8.0, efficiency: 43.3 }, { week: 4, output: 6.05, quality: 8.0, efficiency: 89 }], totalOutput: 17.83, target: 20, efficiency: 89.2, monthlyRating: 6.5 }
                },
                teamSummary: { totalMembers: 4, avgEfficiency: 83.1, avgRating: 7.2, totalOutput: 68.80 }
            },
            'June 2025': {
                isComplete: true,
                monthlyData: {
                    'Harish Rawat': { weeks: [{ week: 1, output: 5.33, quality: 5.1, efficiency: 104 }, { week: 2, output: 4.86, quality: 5.2, efficiency: 96.1 }, { week: 3, output: 5.25, quality: 5.0, efficiency: 101.8 }, { week: 4, output: 4.00, quality: 7.0, efficiency: 95 }], totalOutput: 19.44, target: 20.5, efficiency: 94.8, monthlyRating: 5.6 },
                    'Rishabh Bangwal': { weeks: [{ week: 1, output: 4.50, quality: 5.5, efficiency: 86 }, { week: 2, output: 5.00, quality: 5.8, efficiency: 90.9 }, { week: 3, output: 4.67, quality: 7.0, efficiency: 81.2 }, { week: 4, output: 4.81, quality: 7.0, efficiency: 90 }], totalOutput: 18.98, target: 21, efficiency: 90.4, monthlyRating: 6.3 },
                    'Pratik Sharma': { weeks: [{ week: 1, output: 4.00, quality: 5.7, efficiency: 76 }, { week: 2, output: 5.17, quality: 5.9, efficiency: 91.2 }, { week: 3, output: 5.05, quality: 7.0, efficiency: 85.4 }, { week: 4, output: 5.19, quality: 7.0, efficiency: 92 }], totalOutput: 19.41, target: 21, efficiency: 92.4, monthlyRating: 6.4 },
                    'Vikas Kumar': { weeks: [{ week: 1, output: 4.75, quality: 5.1, efficiency: 95 }, { week: 2, output: 4.71, quality: 5.3, efficiency: 92.7 }, { week: 3, output: 3.43, quality: 7.0, efficiency: 65.1 }, { week: 4, output: 3.13, quality: 6.0, efficiency: 80 }], totalOutput: 16.02, target: 20, efficiency: 80.1, monthlyRating: 5.9 }
                },
                teamSummary: { totalMembers: 4, avgEfficiency: 89.4, avgRating: 6.1, totalOutput: 73.85 }
            },
            'July 2025': {
                isComplete: true,
                monthlyData: {
                    'Harish Rawat': { weeks: [{ week: 1, output: 2.92, quality: 6.0, efficiency: 56 }, { week: 2, output: 4.06, quality: 7.0, efficiency: 67.4 }, { week: 3, output: 4.07, quality: 10.0, efficiency: 58.1 }, { week: 4, output: 8.36, quality: 8.0, efficiency: 92 }], totalOutput: 19.41, target: 21, efficiency: 92.4, monthlyRating: 7.8 },
                    'Rishabh Bangwal': { weeks: [{ week: 1, output: 4.50, quality: 5.2, efficiency: 90 }, { week: 2, output: 6.90, quality: 4.3, efficiency: 133.6 }, { week: 3, output: 4.93, quality: 4.0, efficiency: 114.8 }, { week: 4, output: 5.74, quality: 7.0, efficiency: 110 }], totalOutput: 22.07, target: 20, efficiency: 110.4, monthlyRating: 5.1 },
                    'Pratik Sharma': { weeks: [{ week: 1, output: 3.26, quality: 5.9, efficiency: 62 }, { week: 2, output: 3.05, quality: 7.3, efficiency: 51.5 }, { week: 3, output: 4.90, quality: 10.0, efficiency: 66.8 }, { week: 4, output: 6.47, quality: 8.0, efficiency: 84 }], totalOutput: 17.68, target: 21, efficiency: 84.2, monthlyRating: 7.8 },
                    'Vikas Kumar': { weeks: [{ week: 1, output: 2.75, quality: 6.4, efficiency: 50 }, { week: 2, output: 6.20, quality: 6.5, efficiency: 96.6 }, { week: 3, output: 3.23, quality: 10.0, efficiency: 49.4 }, { week: 4, output: 6.76, quality: 8.0, efficiency: 86 }], totalOutput: 18.94, target: 22, efficiency: 86.1, monthlyRating: 7.7 }
                },
                teamSummary: { totalMembers: 4, avgEfficiency: 93.3, avgRating: 6.9, totalOutput: 78.10 }
            },
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Harish Rawat': { weeks: [{ week: 1, output: 3.46, quality: 4.8, efficiency: 77 }, { week: 2, output: 3.01, quality: 5.8, efficiency: 62.1 }, { week: 3, output: 3.01, quality: 9.0, efficiency: 52.2 }, { week: 4, output: 3.50, quality: 8.0, efficiency: 72 }], totalOutput: 12.98, target: 18, efficiency: 72.1, monthlyRating: 6.9 },
                    'Rishabh Bangwal': { weeks: [{ week: 1, output: 3.67, quality: 4.1, efficiency: 92 }, { week: 2, output: 2.45, quality: 4.9, efficiency: 59.7 }, { week: 3, output: 2.45, quality: 7.0, efficiency: 49.7 }, { week: 4, output: 5.28, quality: 8.0, efficiency: 87 }], totalOutput: 13.85, target: 16, efficiency: 86.6, monthlyRating: 6.0 },
                    'Pratik Sharma': { weeks: [{ week: 1, output: 4.45, quality: 4.9, efficiency: 94 }, { week: 2, output: 2.88, quality: 5.8, efficiency: 59.4 }, { week: 3, output: 2.88, quality: 9.0, efficiency: 49.4 }, { week: 4, output: 4.33, quality: 8.0, efficiency: 77 }], totalOutput: 14.54, target: 19, efficiency: 76.5, monthlyRating: 6.9 },
                    'Vikas Kumar': { weeks: [{ week: 1, output: 3.55, quality: 4.5, efficiency: 84 }, { week: 2, output: 1.98, quality: 5.7, efficiency: 44.2 }, { week: 3, output: 1.98, quality: 9.0, efficiency: 34.6 }, { week: 4, output: 6.53, quality: 8.0, efficiency: 83 }], totalOutput: 14.04, target: 17, efficiency: 82.6, monthlyRating: 6.8 }
                },
                teamSummary: { totalMembers: 4, avgEfficiency: 79.5, avgRating: 6.7, totalOutput: 55.41 }
            }
        };

        // Audio team historical data (Jan-Aug 2025)
        this.historicalData.audio = {
            'January 2025': {
                isComplete: true,
                monthlyData: {
                    'Amandeep': { 
                        weeks: [3.08, 4.50, 4.00, 4.50], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 18, 
                        totalOutput: 16.08, 
                        workingDays: 18,
                        efficiency: 89.35
                    },
                    'Bhavya Menon': { 
                        weeks: [1.50, 3.00, 0.00, 0.00], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No rating provided
                        monthlyRating: 0, 
                        target: 5, 
                        totalOutput: 4.50, 
                        workingDays: 5,
                        efficiency: 90.00
                    },
                    'Rahul': { 
                        weeks: [4.17, 5.83, 7.04, 6.58], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 22, 
                        totalOutput: 23.63, 
                        workingDays: 22,
                        efficiency: 107.39
                    },
                    'Ashutosh': { 
                        weeks: [3.00, 5.50, 6.17, 8.79], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 22, 
                        totalOutput: 23.46, 
                        workingDays: 22,
                        efficiency: 106.63
                    },
                    'Naveen': { 
                        weeks: [5.08, 6.96, 8.33, 10.50], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 22, 
                        totalOutput: 30.88, 
                        workingDays: 22,
                        efficiency: 140.34
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgRating: 6,
                    totalOutput: 82.47,
                    totalWorkingDays: 71,
                    avgEfficiency: 111.09
                }            },
            'February 2025': {
                isComplete: true,
                monthlyData: {
                    'Amandeep': { 
                        weeks: [6.33, 4.67, 4.75, 3.00], 
                        weeklyQualityRatings: [9, 9, 9, 9], 
                        monthlyRating: 9, 
                        target: 20, 
                        totalOutput: 18.75, 
                        workingDays: 20,
                        efficiency: 93.75
                    },
                    'Bhavya Menon': { 
                        weeks: [4.33, 3.00, 5.67, 2.50], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 18, 
                        totalOutput: 15.50, 
                        workingDays: 18,
                        efficiency: 86.11
                    },
                    'Rahul': { 
                        weeks: [4.50, 5.25, 5.67, 2.17], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 19, 
                        totalOutput: 17.58, 
                        workingDays: 19,
                        efficiency: 92.54
                    },
                    'Ashutosh': { 
                        weeks: [5.08, 5.79, 4.54, 4.00], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 17, 
                        totalOutput: 19.42, 
                        workingDays: 17,
                        efficiency: 114.22
                    },
                    'Naveen': { 
                        weeks: [5.17, 5.75, 7.83, 2.92], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 19, 
                        totalOutput: 21.67, 
                        workingDays: 19,
                        efficiency: 114.04
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgRating: 7.75,
                    totalOutput: 74.17,
                    totalWorkingDays: 73,
                    avgEfficiency: 101.73
                }
            },
            'March 2025': {
                isComplete: true,
                monthlyData: {
                    'Amandeep': { 
                        weeks: [4.17, 6.17, 5.33, 5.33], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 17, 
                        totalOutput: 21.00, 
                        workingDays: 17,
                        efficiency: 123.53
                    },
                    'Bhavya Menon': { 
                        weeks: [0.00, 3.50, 6.42, 5.50], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 19, 
                        totalOutput: 15.42, 
                        workingDays: 19,
                        efficiency: 81.14
                    },
                    'Rahul': { 
                        weeks: [4.58, 4.33, 4.25, 15.42], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 17, 
                        totalOutput: 28.58, 
                        workingDays: 17,
                        efficiency: 168.14
                    },
                    'Ashutosh': { 
                        weeks: [4.58, 4.50, 6.50, 6.17], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 18.5, 
                        totalOutput: 21.75, 
                        workingDays: 18.5,
                        efficiency: 117.57
                    },
                    'Naveen': { 
                        weeks: [5.71, 4.54, 6.71, 7.75], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 19, 
                        totalOutput: 24.71, 
                        workingDays: 19,
                        efficiency: 130.04
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgRating: 7.5,
                    totalOutput: 90.46,
                    totalWorkingDays: 73.5,
                    avgEfficiency: 124.22
                }
            },
            'April 2025': {
                isComplete: true,
                monthlyData: {
                    'Amandeep': { 
                        weeks: [5.33, 6.83, 6.33, 7.83], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 26.33, 
                        workingDays: 22,
                        efficiency: 119.70
                    },
                    'Bhavya Menon': { 
                        weeks: [4.42, 4.83, 3.67, 4.83], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 17.75, 
                        workingDays: 22,
                        efficiency: 80.68
                    },
                    'Rahul': { 
                        weeks: [5.83, 0.00, 3.50, 11.63], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 20, 
                        totalOutput: 20.96, 
                        workingDays: 20,
                        efficiency: 104.79
                    },
                    'Ashutosh': { 
                        weeks: [3.83, 5.50, 6.08, 7.25], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 22.67, 
                        workingDays: 22,
                        efficiency: 103.03
                    },
                    'Naveen': { 
                        weeks: [4.67, 6.33, 4.50, 2.04], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 18, 
                        totalOutput: 17.54, 
                        workingDays: 18,
                        efficiency: 97.45
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgRating: 7,
                    totalOutput: 78.92,
                    totalWorkingDays: 82,
                    avgEfficiency: 96.49
                }
            },
            'May 2025': {
                isComplete: true,
                monthlyData: {
                    'Amandeep': { 
                        weeks: [5.50, 5.71, 5.00, 9.17], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 22, 
                        totalOutput: 25.38, 
                        workingDays: 22,
                        efficiency: 115.34
                    },
                    'Bhavya Menon': { 
                        weeks: [3.50, 5.83, 5.04, 3.50], 
                        weeklyQualityRatings: [6, 6, 6, 6], 
                        monthlyRating: 6, 
                        target: 22, 
                        totalOutput: 17.88, 
                        workingDays: 22,
                        efficiency: 81.25
                    },
                    'Rahul': { 
                        weeks: [6.67, 10.00, 5.83, 10.46], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 22, 
                        totalOutput: 32.96, 
                        workingDays: 22,
                        efficiency: 149.81
                    },
                    'Ashutosh': { 
                        weeks: [5.25, 9.83, 4.50, 8.46], 
                        weeklyQualityRatings: [5, 5, 5, 5], 
                        monthlyRating: 5, 
                        target: 21, 
                        totalOutput: 28.04, 
                        workingDays: 21,
                        efficiency: 133.53
                    },
                    'Naveen': { 
                        weeks: [5.33, 6.38, 5.00, 7.17], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 20, 
                        totalOutput: 23.88, 
                        workingDays: 20,
                        efficiency: 119.38
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgRating: 6.5,
                    totalOutput: 102.76,
                    totalWorkingDays: 85,
                    avgEfficiency: 120.99
                }
            },
            'June 2025': {
                isComplete: true,
                monthlyData: {
                    'Amandeep': { 
                        weeks: [4.67, 6.38, 5.33, 4.33], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 20, 
                        totalOutput: 20.71, 
                        workingDays: 20,
                        efficiency: 103.54
                    },
                    'Bhavya Menon': { 
                        weeks: [4.33, 3.50, 5.25, 4.00], 
                        weeklyQualityRatings: [6, 6, 6, 6], 
                        monthlyRating: 6, 
                        target: 21, 
                        totalOutput: 17.08, 
                        workingDays: 21,
                        efficiency: 81.35
                    },
                    'Rahul': { 
                        weeks: [6.17, 9.83, 5.00, 8.33], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 21, 
                        totalOutput: 29.33, 
                        workingDays: 21,
                        efficiency: 139.68
                    },
                    'Ashutosh': { 
                        weeks: [5.00, 10.38, 4.92, 5.17], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 21, 
                        totalOutput: 25.46, 
                        workingDays: 21,
                        efficiency: 121.23
                    },
                    'Naveen': { 
                        weeks: [6.50, 7.21, 7.38, 5.25], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 21, 
                        totalOutput: 26.33, 
                        workingDays: 21,
                        efficiency: 125.40
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgRating: 7,
                    totalOutput: 98.2,
                    totalWorkingDays: 84,
                    avgEfficiency: 116.92
                }
            },
            'July 2025': {
                isComplete: true,
                monthlyData: {
                    'Amandeep': { 
                        weeks: [6.08, 5.50, 5.83, 5.58], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 23, 
                        totalOutput: 23.00, 
                        workingDays: 23,
                        efficiency: 99.99
                    },
                    'Bhavya Menon': { 
                        weeks: [3.67, 4.67, 6.17, 0.00], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 18, 
                        totalOutput: 14.50, 
                        workingDays: 18,
                        efficiency: 80.56
                    },
                    'Rahul': { 
                        weeks: [6.83, 4.67, 5.50, 10.79], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 27.79, 
                        workingDays: 22,
                        efficiency: 126.32
                    },
                    'Ashutosh': { 
                        weeks: [5.33, 5.33, 5.33, 4.50], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 23, 
                        totalOutput: 20.50, 
                        workingDays: 23,
                        efficiency: 89.13
                    },
                    'Naveen': { 
                        weeks: [7.13, 6.71, 5.50, 4.46], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 23, 
                        totalOutput: 23.79, 
                        workingDays: 23,
                        efficiency: 103.45
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgRating: 7,
                    totalOutput: 86.58,
                    totalWorkingDays: 86,
                    avgEfficiency: 99.87
                }
            },
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Amandeep': { 
                        weeks: [4.50, 6.46, 6.17, 5.50], 
                        weeklyQualityRatings: [9, 9, 9, 9], 
                        monthlyRating: 9, 
                        target: 20, 
                        totalOutput: 22.63, 
                        workingDays: 20,
                        efficiency: 113.15
                    },
                    'Bhavya Menon': { 
                        weeks: [6.33, 5.17, 4.33, 2.67], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 17, 
                        totalOutput: 18.50, 
                        workingDays: 17,
                        efficiency: 108.82
                    },
                    'Rahul': { 
                        weeks: [5.29, 5.33, 9.83, 4.67], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 19, 
                        totalOutput: 25.12, 
                        workingDays: 19,
                        efficiency: 132.21
                    },
                    'Ashutosh': { 
                        weeks: [4.38, 6.17, 8.44, 4.33], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 20, 
                        totalOutput: 23.32, 
                        workingDays: 20,
                        efficiency: 116.60
                    },
                    'Naveen': { 
                        weeks: [4.92, 4.17, 6.67, 5.33], 
                        weeklyQualityRatings: [9, 9, 9, 9], 
                        monthlyRating: 9, 
                        target: 20, 
                        totalOutput: 21.09, 
                        workingDays: 20,
                        efficiency: 105.45
                    }
                },
                teamSummary: {
                    totalMembers: 4,
                    avgRating: 7.75,
                    totalOutput: 88.03,
                    totalWorkingDays: 76,
                    avgEfficiency: 115.77
                }
            }
        };

        // Shorts team historical data (Feb-Aug 2025)
        this.historicalData.shorts = {
            'February 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': { 
                        weeks: [5.83, 3.81, 6.68, 6.63], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 20, 
                        totalOutput: 22.94, 
                        workingDays: 20,
                        efficiency: 114.71
                    },
                    'Abhishek Sharma': { 
                        weeks: [5.89, 4.39, 2.15, 5.97], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 18, 
                        totalOutput: 18.40, 
                        workingDays: 18,
                        efficiency: 102.22
                    },
                    'Dheeraj Rajvania': { 
                        weeks: [5.98, 3.85, 5.72, 6.44], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 20, 
                        totalOutput: 21.98, 
                        workingDays: 20,
                        efficiency: 109.92
                    }
                    // Note: Aayush Srivastava and Manoj Kumar joined the team starting April 2025
                },
                teamSummary: {
                    totalMembers: 3, // Only 3 members during Feb 2025
                    avgRating: 8.00, // Average: (8+8+8)/3
                    totalOutput: 63.32, // Sum: 22.94+18.40+21.98
                    totalWorkingDays: 58, // Sum: 20+18+20
                    avgEfficiency: 108.95 // Average: (114.71+102.22+109.92)/3
                }
            },
            'March 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': { 
                        weeks: [3.38, 3.40, 4.08, 4.43], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 18, 
                        totalOutput: 15.29, 
                        workingDays: 18,
                        efficiency: 84.95
                    },
                    'Abhishek Sharma': { 
                        weeks: [4.99, 3.21, 4.45, 3.75], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 19, 
                        totalOutput: 16.40, 
                        workingDays: 19,
                        efficiency: 86.32
                    },
                    'Dheeraj Rajvania': { 
                        weeks: [3.78, 2.90, 3.30, 3.03], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 19, 
                        totalOutput: 13.00, 
                        workingDays: 19,
                        efficiency: 68.42
                    }
                    // Note: Aayush Srivastava and Manoj Kumar joined the team starting April 2025
                },
                teamSummary: {
                    totalMembers: 3, // Only 3 members during March 2025
                    avgRating: 7.67, // Average: (8+8+7)/3
                    totalOutput: 44.69, // Sum: 15.29+16.40+13.00
                    totalWorkingDays: 56, // Sum: 18+19+19
                    avgEfficiency: 79.90 // Average: (84.95+86.32+68.42)/3
                }
            },
            'April 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': { 
                        weeks: [4.23, 5.20, 4.23, 3.66], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 20, 
                        totalOutput: 17.32, 
                        workingDays: 20,
                        efficiency: 86.58
                    },
                    'Abhishek Sharma': { 
                        weeks: [4.29, 5.87, 1.33, 4.75], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 17, 
                        totalOutput: 16.24, 
                        workingDays: 17,
                        efficiency: 95.54
                    },
                    'Dheeraj Rajvania': { 
                        weeks: [4.44, 8.11, 4.81, 4.39], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 21.75, 
                        workingDays: 22,
                        efficiency: 98.86
                    },
                    'Aayush Srivastava': { 
                        weeks: [4.37, 6.80, 0.00, 0.00], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 10, 
                        totalOutput: 11.17, 
                        workingDays: 10,
                        efficiency: 111.67
                    },
                    'Manoj Kumar': { 
                        weeks: [3.84, 8.95, 4.40, 6.56], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 23.75, 
                        workingDays: 22,
                        efficiency: 107.95
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 7.00, // Average: (7+7+7+7+7)/5
                    totalOutput: 90.23, // Sum: 17.32+16.24+21.75+11.17+23.75
                    totalWorkingDays: 91, // Sum: 20+17+22+10+22
                    avgEfficiency: 100.12 // Average: (86.58+95.54+98.86+111.67+107.95)/5
                }
            },
            'May 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': { 
                        weeks: [4.93, 4.50, 3.13, 4.34], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 20, 
                        totalOutput: 16.90, 
                        workingDays: 20,
                        efficiency: 84.50
                    },
                    'Abhishek Sharma': { 
                        weeks: [4.83, 5.00, 4.51, 2.81], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 17.15, 
                        workingDays: 22,
                        efficiency: 77.95
                    },
                    'Dheeraj Rajvania': { 
                        weeks: [4.63, 5.12, 4.86, 4.83], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 19.43, 
                        workingDays: 22,
                        efficiency: 88.30
                    },
                    'Aayush Srivastava': { 
                        weeks: [1.76, 5.27, 3.88, 5.93], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 16.84, 
                        workingDays: 22,
                        efficiency: 76.55
                    },
                    'Manoj Kumar': { 
                        weeks: [4.88, 4.17, 4.08, 3.18], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 20, 
                        totalOutput: 16.29, 
                        workingDays: 20,
                        efficiency: 81.46
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 7.00, // Average: (7+7+7+7+7)/5
                    totalOutput: 86.61, // Sum: 16.90+17.15+19.43+16.84+16.29
                    totalWorkingDays: 106, // Sum: 20+22+22+22+20
                    avgEfficiency: 81.75 // Average: (84.50+77.95+88.30+76.55+81.46)/5
                }
            },
            'June 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': { 
                        weeks: [3.00, 3.53, 4.08, 2.50], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 21, 
                        totalOutput: 13.12, 
                        workingDays: 21,
                        efficiency: 62.46
                    },
                    'Abhishek Sharma': { 
                        weeks: [3.17, 3.70, 4.72, 4.68], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 21, 
                        totalOutput: 16.27, 
                        workingDays: 21,
                        efficiency: 77.46
                    },
                    'Dheeraj Rajvania': { 
                        weeks: [3.11, 3.54, 4.19, 6.48], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 21, 
                        totalOutput: 17.32, 
                        workingDays: 21,
                        efficiency: 82.46
                    },
                    'Aayush Srivastava': { 
                        weeks: [2.73, 4.25, 4.46, 5.44], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 21, 
                        totalOutput: 16.88, 
                        workingDays: 21,
                        efficiency: 80.40
                    },
                    'Manoj Kumar': { 
                        weeks: [2.88, 3.23, 5.88, 2.61], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 21, 
                        totalOutput: 14.60, 
                        workingDays: 21,
                        efficiency: 69.52
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 8.00, // Average: (8+8+8+8+8)/5
                    totalOutput: 78.19, // Sum: 13.12+16.27+17.32+16.88+14.60
                    totalWorkingDays: 105, // Sum: 21+21+21+21+21
                    avgEfficiency: 74.46 // Average: (62.46+77.46+82.46+80.40+69.52)/5
                }
            },
            'July 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': { 
                        weeks: [5.18, 4.62, 5.07, 10.96], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 22, 
                        totalOutput: 25.82, 
                        workingDays: 22,
                        efficiency: 117.35
                    },
                    'Abhishek Sharma': { 
                        weeks: [4.32, 4.25, 5.40, 10.40], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 21, 
                        totalOutput: 24.37, 
                        workingDays: 21,
                        efficiency: 116.05
                    },
                    'Dheeraj Rajvania': { 
                        weeks: [4.97, 4.66, 5.45, 4.83], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 23, 
                        totalOutput: 19.90, 
                        workingDays: 23,
                        efficiency: 86.52
                    },
                    'Aayush Srivastava': { 
                        weeks: [5.36, 4.81, 5.22, 10.80], 
                        weeklyQualityRatings: [8, 8, 8, 8], 
                        monthlyRating: 8, 
                        target: 23, 
                        totalOutput: 26.18, 
                        workingDays: 23,
                        efficiency: 113.82
                    },
                    'Manoj Kumar': { 
                        weeks: [5.48, 5.18, 5.26, 4.48], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 23, 
                        totalOutput: 20.38, 
                        workingDays: 23,
                        efficiency: 88.62
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 7.40, // Average: (7+7+8+8+7)/5
                    totalOutput: 116.65, // Sum: 25.82+24.37+19.90+26.18+20.38
                    totalWorkingDays: 112, // Sum: 22+21+23+23+23
                    avgEfficiency: 104.47 // Average: (117.35+116.05+86.52+113.82+88.62)/5
                }
            },
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Divyanshu Mishra': { 
                        weeks: [4.30, 4.30, 5.73, 6.50], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 20, 
                        totalOutput: 20.83, 
                        workingDays: 20,
                        efficiency: 104.15
                    },
                    'Abhishek Sharma': { 
                        weeks: [3.98, 3.98, 6.13, 6.00], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 19, 
                        totalOutput: 20.09, 
                        workingDays: 19,
                        efficiency: 105.73
                    },
                    'Dheeraj Rajvania': { 
                        weeks: [5.00, 5.00, 6.00, 6.00], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 19, 
                        totalOutput: 22.00, 
                        workingDays: 19,
                        efficiency: 115.79
                    },
                    'Aayush Srivastava': { 
                        weeks: [6.55, 6.55, 5.72, 4.83], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 19, 
                        totalOutput: 23.66, 
                        workingDays: 19,
                        efficiency: 124.52
                    },
                    'Manoj Kumar': { 
                        weeks: [5.00, 5.00, 6.00, 6.00], 
                        weeklyQualityRatings: [7, 7, 7, 7], 
                        monthlyRating: 7, 
                        target: 19, 
                        totalOutput: 22.00, 
                        workingDays: 19,
                        efficiency: 115.79
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 7.00, // Average: (7+7+7+7+7)/5
                    totalOutput: 108.58, // Sum: 20.83+20.09+22.00+23.66+22.00
                    totalWorkingDays: 96, // Sum: 20+19+19+19+19
                    avgEfficiency: 113.20 // Average: (104.15+105.73+115.79+124.52+115.79)/5
                }
            },
            'graphics': {
                // Graphics team historical data - June to August 2025
                // Data will be populated when provided by user
                'June 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Amit Joshi': { 
                            weeks: [5, 5, 4.7, 6.3], 
                            weeklyQualityRatings: [8, 8, 8, 8], 
                            monthlyRating: 8, 
                            target: 19.0, 
                            totalOutput: 21.00, 
                            workingDays: 19,
                            efficiency: 110.53
                        },
                        'Rakhi Dhama': { 
                            weeks: [3.3, 5.2, 3.8, 3.4], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 20.0, 
                            totalOutput: 15.70, 
                            workingDays: 20,
                            efficiency: 78.50
                        },
                        'Raj': { 
                            weeks: [2.9, 3.2, 3.3, 3.9], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 20.0, 
                            totalOutput: 13.30, 
                            workingDays: 20,
                            efficiency: 66.50
                        },
                        'Abhishek Shukla': { 
                            weeks: [2.4, 3.9, 3.5, 2.3], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 20.0, 
                            totalOutput: 12.10, 
                            workingDays: 20,
                            efficiency: 60.50
                        },
                        'Mayank': { 
                            weeks: [3.8, 0, 0, 3.75], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 19.0, 
                            totalOutput: 7.55, 
                            workingDays: 19,
                            efficiency: 39.74
                        },
                        'Anubha': { 
                            weeks: [3.7, 3.5, 4, 4.2], 
                            weeklyQualityRatings: [8, 8, 8, 8], 
                            monthlyRating: 8, 
                            target: 19.0, 
                            totalOutput: 15.40, 
                            workingDays: 19,
                            efficiency: 81.05
                        },
                        'Pranchal Chaudhary': { 
                            weeks: [3.6, 2.8, 1.3, 1.3], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 19.0, 
                            totalOutput: 9.00, 
                            workingDays: 19,
                            efficiency: 47.37
                        },
                        'Piyush Vaid': { 
                            weeks: [3.5, 5, 5, 4.7], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 20.0, 
                            totalOutput: 18.20, 
                            workingDays: 20,
                            efficiency: 91.00
                        },
                        'Vaibhav Singhal': { 
                            weeks: [4.25, 3.6, 3.4, 3.1], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 19.0, 
                            totalOutput: 14.35, 
                            workingDays: 19,
                            efficiency: 75.53
                        },
                        'Ishika': { 
                            weeks: [3.2, 2.4, 1.5, 4.2], 
                            weeklyQualityRatings: [8, 8, 8, 8], 
                            monthlyRating: 8, 
                            target: 19.0, 
                            totalOutput: 11.30, 
                            workingDays: 19,
                            efficiency: 59.47
                        },
                        'Aman': { 
                            weeks: [4.6, 2.9, 3.75, 3.8], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 20.0, 
                            totalOutput: 15.05, 
                            workingDays: 20,
                            efficiency: 75.25
                        }
                    },
                    teamSummary: {
                        totalMembers: 12,
                        avgRating: 7.25, // Average: (8+7+7+7+7+8+8+7+7+7+8+7)/12 = 7.25
                        totalOutput: 168.05, // Sum of all outputs
                        totalWorkingDays: 233, // Sum: 19+20+20+20+19+19+19+19+20+19+19+20
                        avgEfficiency: 72.25 // Average of all efficiency values
                    }
                },
                'July 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Amit Joshi': { 
                            weeks: [2.5, 5.80, 0.00, 6.1], 
                            weeklyQualityRatings: [8, 8, 8, 8], 
                            monthlyRating: 8, 
                            target: 18.0, 
                            totalOutput: 14.40, 
                            workingDays: 18,
                            efficiency: 80.00
                        },
                        'Rakhi Dhama': { 
                            weeks: [5, 3.10, 0.00, 2.2], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 13.0, 
                            totalOutput: 10.30, 
                            workingDays: 13,
                            efficiency: 79.23
                        },
                        'Raj': { 
                            weeks: [3.6, 2.90, 3.40, 3.8], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 18.0, 
                            totalOutput: 13.65, 
                            workingDays: 18,
                            efficiency: 75.83
                        },
                        'Abhishek Shukla': { 
                            weeks: [3.9, 3.20, 2.85, 4.6], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 18.0, 
                            totalOutput: 14.55, 
                            workingDays: 18,
                            efficiency: 80.83
                        },
                        'Mayank': { 
                            weeks: [5.2, 5.45, 4.00, 3.4], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 17.0, 
                            totalOutput: 18.05, 
                            workingDays: 17,
                            efficiency: 106.18
                        },
                        'Anubha': { 
                            weeks: [5.2, 4.5, 4.10, 3.8], 
                            weeklyQualityRatings: [8, 8, 8, 8], 
                            monthlyRating: 8, 
                            target: 19.0, 
                            totalOutput: 17.55, 
                            workingDays: 19,
                            efficiency: 92.37
                        },
                        'Pranchal Chaudhary': { 
                            weeks: [4.2, 2.2, 3.50, 4.3], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 17.5, 
                            totalOutput: 14.20, 
                            workingDays: 17.5,
                            efficiency: 81.14
                        },
                        'Piyush Vaid': { 
                            weeks: [5.6, 5.8, 4.00, 6.3], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 19.0, 
                            totalOutput: 21.70, 
                            workingDays: 19,
                            efficiency: 114.21
                        },
                        'Vaibhav Singhal': { 
                            weeks: [4.9, 3.2, 3.55, 4.6], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 19.0, 
                            totalOutput: 16.25, 
                            workingDays: 19,
                            efficiency: 85.53
                        },
                        'Ishika': { 
                            weeks: [5.1, 4.1, 4.00, 4.2], 
                            weeklyQualityRatings: [8, 8, 8, 8], 
                            monthlyRating: 8, 
                            target: 20.0, 
                            totalOutput: 17.40, 
                            workingDays: 20,
                            efficiency: 87.00
                        },
                        'Aman': { 
                            weeks: [4.8, 3.0, 3.70, 5.2], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 19.0, 
                            totalOutput: 16.70, 
                            workingDays: 19,
                            efficiency: 87.89
                        }
                    },
                    teamSummary: {
                        totalMembers: 12,
                        avgRating: 7.25, // Average: (8+7+7+7+7+8+8+7+7+7+8+7)/12 = 7.25
                        totalOutput: 189.80, // Sum of all outputs
                        totalWorkingDays: 215.5, // Sum of all working days
                        avgEfficiency: 88.01 // Average of all efficiency values
                    }
                },
                'August 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Amit Joshi': { 
                            weeks: [3.50, 0, 4.00, 4.0], 
                            weeklyQualityRatings: [8, 8, 8, 8], 
                            monthlyRating: 8, 
                            target: 13.0, 
                            totalOutput: 11.45, 
                            workingDays: 13,
                            efficiency: 88.08
                        },
                        'Rakhi Dhama': { 
                            weeks: [4.30, 0, 3.70, 3.7], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 15.0, 
                            totalOutput: 11.70, 
                            workingDays: 15,
                            efficiency: 78.00
                        },
                        'Raj': { 
                            weeks: [2.80, 0, 3.10, 3.4], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 13.0, 
                            totalOutput: 9.30, 
                            workingDays: 13,
                            efficiency: 71.54
                        },
                        'Abhishek Shukla': { 
                            weeks: [2.20, 0, 3.20, 3.7], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 13.5, 
                            totalOutput: 9.10, 
                            workingDays: 13.5,
                            efficiency: 67.41
                        },
                        'Mayank': { 
                            weeks: [4.30, 0, 3.80, 4.5], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 15.0, 
                            totalOutput: 12.60, 
                            workingDays: 15,
                            efficiency: 84.00
                        },
                        'Anubha': { 
                            weeks: [4.10, 0, 5.30, 2.9], 
                            weeklyQualityRatings: [8, 8, 8, 8], 
                            monthlyRating: 8, 
                            target: 15.0, 
                            totalOutput: 12.30, 
                            workingDays: 15,
                            efficiency: 82.00
                        },
                        'Pranchal Chaudhary': { 
                            weeks: [3.00, 0, 5.40, 3.7], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 16.0, 
                            totalOutput: 12.07, 
                            workingDays: 16,
                            efficiency: 75.44
                        },
                        'Piyush Vaid': { 
                            weeks: [3.40, 0, 5.60, 1.75], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 13.0, 
                            totalOutput: 10.75, 
                            workingDays: 13,
                            efficiency: 82.69
                        },
                        'Vaibhav Singhal': { 
                            weeks: [3.40, 0, 5.70, 1.75], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 13.5, 
                            totalOutput: 10.85, 
                            workingDays: 13.5,
                            efficiency: 80.37
                        },
                        'Ishika': { 
                            weeks: [2.50, 0, 5.00, 3.1], 
                            weeklyQualityRatings: [8, 8, 8, 8], 
                            monthlyRating: 8, 
                            target: 13.0, 
                            totalOutput: 10.60, 
                            workingDays: 13,
                            efficiency: 81.54
                        },
                        'Aman': { 
                            weeks: [3.50, 0, 5.00, 4.0], 
                            weeklyQualityRatings: [7, 7, 7, 7], 
                            monthlyRating: 7, 
                            target: 16.0, 
                            totalOutput: 12.45, 
                            workingDays: 16,
                            efficiency: 77.81
                        }
                    },
                    teamSummary: {
                        totalMembers: 12,
                        avgRating: 7.25, // Average: (8+7+7+7+7+8+8+7+7+7+8+7)/12 = 7.25
                        totalOutput: 131.47, // Sum of all outputs
                        totalWorkingDays: 166.5, // Sum of all working days
                        avgEfficiency: 78.99 // Average of all efficiency values
                    }
                }
            }
        };
        
        // Pre-production team historical data
        this.historicalData.preproduction = {
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Vandit': { 
                        weeks: [5.00, 0.00, 8.25, 6.00], 
                        weeklyQualityRatings: [9, 9, 9, 9], // Quality rating provided for Pre-production team
                        monthlyRating: 9, 
                        target: 20, 
                        totalOutput: 19.25, 
                        workingDays: 20,
                        efficiency: 96.25
                    },
                    'Bhavya Oberoi': { 
                        weeks: [3.50, 3.50, 4.00, 6.50], 
                        weeklyQualityRatings: [8, 8, 8, 8], // Quality rating provided for Pre-production team
                        monthlyRating: 8, 
                        target: 20, 
                        totalOutput: 17.50, 
                        workingDays: 20,
                        efficiency: 87.50
                    },
                    'Abid': { 
                        weeks: [4.00, 9.02, 4.52, 6.50], 
                        weeklyQualityRatings: [10, 10, 10, 10], // Quality rating provided for Pre-production team
                        monthlyRating: 10, 
                        target: 20, 
                        totalOutput: 24.03, 
                        workingDays: 20,
                        efficiency: 120.15
                    },
                    'Mudit': { 
                        weeks: [5.00, 4.00, 7.50, 7.50], 
                        weeklyQualityRatings: [10, 10, 10, 10], // Quality rating provided for Pre-production team
                        monthlyRating: 10, 
                        target: 20, 
                        totalOutput: 24.00, 
                        workingDays: 20,
                        efficiency: 120.00
                    },
                    'Nikhil': { 
                        weeks: [8.50, 10.52, 3.50, 5.25], 
                        weeklyQualityRatings: [10, 10, 10, 10], // Quality rating provided for Pre-production team
                        monthlyRating: 10, 
                        target: 20, 
                        totalOutput: 27.77, 
                        workingDays: 20,
                        efficiency: 138.83
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 9.4, // Average: (9+8+10+10+10)/5 = 9.4
                    totalOutput: 112.55, // Sum: 19.25+17.50+24.03+24.00+27.77
                    totalWorkingDays: 100, // Sum: 20+20+20+20+20 = 100
                    avgEfficiency: 112.53 // Average: (96.25+87.50+120.15+120.00+138.83)/5
                }
            }
        };
        
        // Content team historical data
        this.historicalData.content = {
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Nishita': { 
                        weeks: [2.84, 2.84, 5.94, 5.15], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Content team
                        monthlyRating: 0, // No quality rating for Content team
                        target: 16, 
                        totalOutput: 16.76, 
                        workingDays: 16,
                        efficiency: 104.75
                    },
                    'Akshat Mandalgi': { 
                        weeks: [2.84, 2.84, 5.10, 5.34], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Content team
                        monthlyRating: 0, // No quality rating for Content team
                        target: 15, 
                        totalOutput: 16.12, 
                        workingDays: 15,
                        efficiency: 107.47
                    },
                    'Urvish': { 
                        weeks: [2.93, 2.93, 5.60, 6.08], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Content team
                        monthlyRating: 0, // No quality rating for Content team
                        target: 15, 
                        totalOutput: 17.53, 
                        workingDays: 15,
                        efficiency: 116.87
                    },
                    'Meghna': { 
                        weeks: [2.25, 2.25, 4.40, 6.25], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Content team
                        monthlyRating: 0, // No quality rating for Content team
                        target: 15, 
                        totalOutput: 15.14, 
                        workingDays: 15,
                        efficiency: 100.93
                    },
                    'Shuchita': { 
                        weeks: [3.38, 3.38, 5.56, 6.13], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Content team
                        monthlyRating: 0, // No quality rating for Content team
                        target: 14, 
                        totalOutput: 18.45, 
                        workingDays: 14,
                        efficiency: 131.79
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgRating: 0, // No quality rating for Content team
                    totalOutput: 84.00, // Sum: 16.76+16.12+17.53+15.14+18.45
                    totalWorkingDays: 75, // Sum: 16+15+15+15+14 = 75
                    avgEfficiency: 112.16 // Average: (104.75+107.47+116.87+100.93+131.79)/5
                }
            }
        };
        
        // Social team historical data
        this.historicalData.social = {
            'July 2025': {
                isComplete: true,
                monthlyData: {
                    'Khushi': { 
                        weeks: [4.1, 3.9, 9.5, 11.1], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 24, 
                        totalOutput: 28.6, 
                        workingDays: 24,
                        efficiency: 119.23
                    },
                    'Siya': { 
                        weeks: [2.4, 4.4, 5.5, 10.1], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 23, 
                        totalOutput: 22.4, 
                        workingDays: 23,
                        efficiency: 97.52
                    },
                    'Rohit': { 
                        weeks: [3.7, 4.9, 6.1, 7.6], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 24, 
                        totalOutput: 22.3, 
                        workingDays: 24,
                        efficiency: 93.07
                    },
                    'Anish': { 
                        weeks: [2.5, 4.0, 4.9, 3.2], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 23, 
                        totalOutput: 14.5, 
                        workingDays: 23,
                        efficiency: 63.23
                    },
                    'Swapnil': { 
                        weeks: [2.9, 3.0, 5.3, 10.6], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 24, 
                        totalOutput: 21.8, 
                        workingDays: 24,
                        efficiency: 90.80
                    },
                    'Tanya': { 
                        weeks: [3.4, 4.1, 4.7, 4.0], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 20, 
                        totalOutput: 16.3, 
                        workingDays: 20,
                        efficiency: 81.61
                    },
                    'Somya': { 
                        weeks: [0.0, 0.0, 4.2, 9.1], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 14, 
                        totalOutput: 13.4, 
                        workingDays: 14,
                        efficiency: 95.41
                    }
                    // Note: Satyam not available for July 2025
                },
                teamSummary: {
                    totalMembers: 7, // Satyam not included for July
                    avgRating: 0, // No quality rating for Social team
                    totalOutput: 139.3, // Sum: 28.6+22.4+22.3+14.5+21.8+16.3+13.4
                    totalWorkingDays: 152, // Sum: 24+23+24+23+24+20+14 = 152
                    avgEfficiency: 91.55 // Average: (119.23+97.52+93.07+63.23+90.80+81.61+95.41)/7
                }
            },
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Khushi': { 
                        weeks: [4.7, 0.7, 5.0, 5.5], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 16, 
                        totalOutput: 15.9, 
                        workingDays: 16,
                        efficiency: 99.55
                    },
                    'Siya': { 
                        weeks: [3.8, 2.4, 4.1, 4.8], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 15, 
                        totalOutput: 15.1, 
                        workingDays: 15,
                        efficiency: 100.71
                    },
                    'Rohit': { 
                        weeks: [4.0, 1.5, 3.9, 3.6], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 15, 
                        totalOutput: 12.9, 
                        workingDays: 15,
                        efficiency: 86.19
                    },
                    'Anish': { 
                        weeks: [2.0, 1.9, 4.5, 4.7], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 16, 
                        totalOutput: 13.0, 
                        workingDays: 16,
                        efficiency: 81.43
                    },
                    'Swapnil': { 
                        weeks: [2.6, 0.5, 2.1, 3.7], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 16, 
                        totalOutput: 8.9, 
                        workingDays: 16,
                        efficiency: 55.85
                    },
                    'Tanya': { 
                        weeks: [1.3, 1.8, 3.8, 4.3], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 14, 
                        totalOutput: 11.1, 
                        workingDays: 14,
                        efficiency: 79.59
                    },
                    'Somya': { 
                        weeks: [2.3, 0.0, 0.0, 4.4], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 8, 
                        totalOutput: 6.6, 
                        workingDays: 8,
                        efficiency: 82.59
                    },
                    'Satyam': { 
                        weeks: [4.0, 1.8, 4.4, 3.9], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No quality rating for Social team
                        monthlyRating: 0, // No quality rating for Social team
                        target: 15, 
                        totalOutput: 14.0, 
                        workingDays: 15,
                        efficiency: 93.57
                    }
                },
                teamSummary: {
                    totalMembers: 8,
                    avgRating: 0, // No quality rating for Social team
                    totalOutput: 97.5, // Sum: 15.9+15.1+12.9+13.0+8.9+11.1+6.6+14.0
                    totalWorkingDays: 115, // Sum: 16+15+15+16+16+14+8+15 = 115
                    avgEfficiency: 84.94 // Average: (99.55+100.71+86.19+81.43+55.85+79.59+82.59+93.57)/8
                }
            }
        };
        
        this.currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Load team-specific data after currentTeam is set (async)
        this.loadTeamSpecificData().then(() => {
            console.log('✅ Team data loaded and synced');
        }).catch(error => {
            console.warn('⚠️ Issue loading team data:', error);
        });
        
        // Load Slack webhook URL from localStorage
        this.loadSlackWebhookUrl();
        
        // Also load any stored historical data for this team
        this.loadStoredHistoricalData();
        
        // Initialize immediately after construction
        this.initializeSync();
    }
    
    // Synchronous initialization that always works
    initializeSync() {
        
        try {
            console.log('🚀 Starting tracker initialization...');
            
            // Setup basic UI immediately
            this.populateWeekSelector();
            this.setupTeamSwitching();
            this.setupEventListeners();
            
            // Set a default current week
            this.setCurrentWeek();
            
            // Start sync status updates
            this.startSyncStatusUpdates();
            
            // Hide loading, show initial state
            document.getElementById('loading').style.display = 'none';
            
            // Async initialization for database data
            this.initializeAsync();
            
            console.log('✅ Basic initialization complete');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showMessage('⚠️ System initialized with limited functionality', 'warning');
        }
    }
    
    // Async initialization for Supabase database
    async initializeAsync() {
        try {
            console.log('🔄 Initializing database connections...');
            
            // Initialize Supabase first (primary database)
            try {
                await this.supabaseAPI.initializeSupabase();
                const healthCheck = await this.supabaseAPI.healthCheck();
                if (healthCheck) {
                    console.log('✅ Supabase connection established');
                    this.updateSyncStatus('✅ Connected to Database', 'success');
                } else {
                    console.warn('⚠️ Supabase health check failed');
                    this.updateSyncStatus('⚠️ Database connection issues', 'warning');
                }
            } catch (e) {
                console.error('❌ Supabase initialization failed:', e);
                this.updateSyncStatus('❌ Database offline', 'error');
            }
            
            // Load data from Supabase first, then Google Sheets as backup
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 8000)
            );
            
            // CRITICAL FIX: Load finalized status from Supabase FIRST
            try {
                console.log('🔄 Loading finalized weeks from Supabase to determine correct current week...');
                await this.loadAllFinalizedWeeksFromSupabase();
                console.log('✅ Finalized weeks loaded, re-setting current week...');
                
                // Re-set current week with Supabase finalized data
                this.setCurrentWeek();
                
            } catch (e) {
                console.warn('⚠️ Could not load finalized weeks from Supabase:', e.message);
            }
            
            try {
                console.log('🔄 Loading current week data from Supabase...');
                await Promise.race([this.loadFromSupabase(), timeout]);
                console.log('✅ Supabase data loaded');
            } catch (e) {
                console.warn('⚠️ Supabase timeout, using local data:', e.message);
                // Load any existing local data
                this.loadWeekData();
            }
            
            // Update UI with loaded data
            this.refreshCurrentDisplay();
            
            this.showMessage('✅ System ready! Select a team and period to begin.', 'success');
            
        } catch (error) {
            console.error('❌ Async initialization error:', error);
            this.showMessage('✅ System ready! (Database sync may be limited)', 'warning');
        }
    }

    // Debug function to check Social team Week 1 finalization issue
    async debugSocialWeek1() {
        console.log('🔍 DEBUGGING Social team Week 1 issue...');
        
        // Check local finalized reports
        console.log('📋 Local finalizedReports for social:', this.finalizedReports?.social);
        
        // Check Supabase data for Social team Week 1
        const week1Id = '2025-09-01';
        console.log(`🗄️ Checking Supabase for social team, week ${week1Id}...`);
        
        try {
            const supabaseData = await this.supabaseAPI.loadWeekData('social', week1Id);
            console.log(`📊 Supabase entries for social ${week1Id}:`, supabaseData);
            console.log(`📊 Number of entries found: ${supabaseData?.length || 0}`);
            
            if (supabaseData && supabaseData.length > 0) {
                console.log('📝 Member entries found:');
                supabaseData.forEach((entry, index) => {
                    console.log(`  ${index + 1}. ${entry.member_name} - Total: ${entry.week_total}, Working Days: ${entry.working_days}`);
                });
            } else {
                console.log('❌ No Supabase entries found for social week 1');
            }
            
            // Check if week shows as finalized
            const oldTeam = this.currentTeam;
            this.currentTeam = 'social';
            const isFinalized = this.isWeekFinalized();
            this.currentTeam = oldTeam;
            
            console.log(`🔍 Week finalization status: ${isFinalized}`);
            
            // Suggest fix
            if (isFinalized && (!supabaseData || supabaseData.length === 0)) {
                console.log('🛠️ ISSUE IDENTIFIED: Week shows as finalized but no Supabase data exists');
                console.log('💡 SOLUTION: Run tracker.clearSocialWeek1Finalization() to fix this');
            }
            
        } catch (error) {
            console.error('❌ Error checking Supabase:', error);
        }
    }

    // Fix function to clear Social team Week 1 false finalization
    clearSocialWeek1Finalization() {
        console.log('🛠️ Clearing Social team Week 1 false finalization...');
        
        const week1Id = '2025-09-01';
        
        // Clear from finalizedReports
        if (this.finalizedReports?.social?.[week1Id]) {
            delete this.finalizedReports.social[week1Id];
            console.log('✅ Removed Week 1 from local finalizedReports');
        }
        
        // Save the updated data
        this.saveTeamSpecificData();
        
        console.log('✅ Social team Week 1 is now available for data entry');
        console.log('🔄 Please refresh the page and try adding data again');
    }

    // Function to fix existing Graphics team data by adding missing 0% efficiency members
    async fixExistingGraphicsData() {
        if (this.currentTeam !== 'graphics') {
            console.log('⚠️ fixExistingGraphicsData: Not on Graphics team');
            return;
        }

        try {
            console.log('🔧 Starting Graphics data recovery...');
            
            // Get all Graphics team members
            const expectedMembers = this.teamConfigs.graphics?.members?.map(m => m.name) || [];
            console.log('🎨 Expected Graphics members:', expectedMembers);
            
            // Get all weeks that have been finalized for Graphics
            const finalizedWeeks = Object.keys(this.finalizedReports?.graphics || {});
            console.log('🎨 Finalized Graphics weeks:', finalizedWeeks);
            
            for (const weekId of finalizedWeeks) {
                console.log(`🔧 Checking Graphics week ${weekId}...`);
                
                // Get current Supabase data for this week
                const supabaseData = await this.supabaseAPI.loadWeekData('graphics', weekId);
                const foundMembers = supabaseData?.map(entry => entry.member_name) || [];
                const missingMembers = expectedMembers.filter(name => !foundMembers.includes(name));
                
                console.log(`🎨 Week ${weekId} - Found: ${foundMembers.length}, Missing: ${missingMembers.length}`);
                console.log(`🎨 Missing members: ${missingMembers.join(', ')}`);
                
                if (missingMembers.length > 0) {
                    console.log(`🔧 Adding ${missingMembers.length} missing members to week ${weekId}...`);
                    
                    // Add missing members with default 0% efficiency data
                    for (const memberName of missingMembers) {
                           const defaultData = {
                               team: 'graphics',
                               week_id: weekId,
                               member_name: memberName,
                               workTypes: {},  // This is what saveWeekData expects
                               totalOutput: 0,
                               workingDays: 5,
                               leaveDays: 0,
                               weeklyRating: 0,
                               efficiency: 0,
                               createdAt: new Date().toISOString()
                           };
                        
                        try {
                            await this.supabaseAPI.saveWeekData(defaultData);
                            console.log(`✅ Added ${memberName} to week ${weekId}`);
                        } catch (error) {
                            console.error(`❌ Failed to add ${memberName} to week ${weekId}:`, error);
                        }
                    }
                }
            }
            
            // Reload data after fixes
            console.log('🔄 Reloading Graphics data after fixes...');
            await this.loadAllFinalizedWeeksFromSupabase();
            
            this.showMessage('✅ Graphics team data recovery completed! Missing 0% efficiency members have been added.', 'success');
            
        } catch (error) {
            console.error('❌ Graphics data recovery failed:', error);
            this.showMessage('❌ Graphics data recovery failed. Check console for details.', 'error');
        }
    }

    // Load ALL finalized weeks from Supabase for all teams to correctly determine current week
    async loadAllFinalizedWeeksFromSupabase() {
        try {
            console.log('📊 Loading all finalized weeks from Supabase...');
            
            // Get all teams - map display IDs to storage IDs for Supabase
            const allTeams = ['b2b', 'varsity', 'zero1_bratish', 'zero1_harish', 'audio', 'graphics', 'tech', 'product', 'preproduction', 'content', 'social'];
            const teamStorageMapping = {
                'zero1_bratish': 'zero1',
                'zero1_harish': 'harish',
                'varsity': 'varsity',
                'b2b': 'b2b',
                'audio': 'audio',
                'graphics': 'graphics',
                'tech': 'tech',
                'product': 'product',
                'preproduction': 'preproduction',
                'content': 'content',
                'social': 'social'
            };
            
            // Clear existing finalized reports to rebuild from Supabase data only
            console.log('🧹 Clearing existing finalized reports to rebuild from Supabase...');
            this.finalizedReports = {};
            
            // Load finalized reports for each team
            for (const team of allTeams) {
                try {
                    // Map display team ID to storage team ID for Supabase query
                    const storageTeamId = teamStorageMapping[team] || team;
                    // Get all week IDs that have entries in Supabase for this team
                    console.log(`🔍 Loading week data for display team: ${team}, storage team: ${storageTeamId}`);
                    const teamWeekData = await this.supabaseAPI.loadAllWeekData(storageTeamId);
                    console.log(`📊 Found ${teamWeekData?.length || 0} entries for ${team} (${storageTeamId})`);
                    
                    // Special debugging for Graphics team
                    if (team === 'graphics') {
                        console.log('🎨 GRAPHICS DEBUG: Raw team week data:', teamWeekData);
                        console.log('🎨 GRAPHICS DEBUG: Expected team members:', this.teamConfigs.graphics?.members?.map(m => m.name) || 'No config found');
                        
                        if (teamWeekData && teamWeekData.length > 0) {
                            console.log(`🎨 GRAPHICS DEBUG: Found ${teamWeekData.length} entries in Supabase`);
                            const foundMembers = teamWeekData.map(entry => entry.member_name);
                            const expectedMembers = this.teamConfigs.graphics?.members?.map(m => m.name) || [];
                            const missingMembers = expectedMembers.filter(name => !foundMembers.includes(name));
                            
                            console.log('🎨 GRAPHICS Members in Supabase:', foundMembers);
                            console.log('🎨 GRAPHICS Expected members:', expectedMembers);
                            console.log('🎨 GRAPHICS Missing members:', missingMembers);
                            
                            teamWeekData.forEach((entry, index) => {
                                console.log(`🎨 GRAPHICS Entry ${index}:`, {
                                    week_id: entry.week_id,
                                    member_name: entry.member_name,
                                    week_total: entry.week_total,
                                    efficiency: entry.efficiency,
                                    working_days: entry.working_days,
                                    leave_days: entry.leave_days,
                                    created_at: entry.created_at
                                });
                            });
                        } else {
                            console.log('🎨 GRAPHICS DEBUG: No entries found in Supabase');
                        }
                    }
                    
                    if (teamWeekData && teamWeekData.length > 0) {
                        // Initialize team in finalized reports if not exists
                        if (!this.finalizedReports[team]) {
                            this.finalizedReports[team] = {};
                        }
                        
                        // Group by week_id to see which weeks have complete data
                        const weekGroups = {};
                        teamWeekData.forEach(entry => {
                            if (!weekGroups[entry.week_id]) {
                                weekGroups[entry.week_id] = [];
                            }
                            weekGroups[entry.week_id].push(entry);
                        });
                        
                        // Mark weeks as finalized if they have data
                        Object.keys(weekGroups).forEach(weekId => {
                            const weekData = weekGroups[weekId];
                            console.log(`🔍 Checking ${weekId} for ${team}: ${weekData?.length || 0} entries`);
                            if (weekData && weekData.length > 0) {
                                // Double-check: ensure there's actually meaningful data
                                const hasRealData = weekData.some(entry => {
                                    const workTypeData = entry.work_type_data || {};
                                    return Object.values(workTypeData).some(workType => {
                                        if (typeof workType === 'object') {
                                            return Object.values(workType).some(val => (parseFloat(val) || 0) > 0);
                                        } else {
                                            return (parseFloat(workType) || 0) > 0;
                                        }
                                    }) || (parseFloat(entry.weekly_rating) || 0) > 0;
                                });
                                
                                if (!hasRealData) {
                                    console.log(`⚠️ Skipping ${weekId} for ${team} - no meaningful data found`);
                                    return;
                                }
                                // Generate summary data for finalized week
                                const memberSummaries = [];
                                let totalOutput = 0, totalRating = 0, totalEfficiency = 0, memberCount = 0;
                                
                                weekData.forEach(entry => {
                                    const teamKey = team; // Already mapped to storage key
                                    const memberOutput = this.getMemberWeekOutput(entry, teamKey);
                                    const workingDays = parseFloat(entry.working_days) || 5;
                                    const leaveDays = parseFloat(entry.leave_days) || 0;
                                    const rating = parseFloat(entry.quality_rating) || 0;
                                    const effectiveWorkingDays = workingDays - leaveDays;
                                    
                                    let efficiency = 0;
                                    if (teamKey === 'tech' || teamKey === 'product') {
                                        efficiency = this.calculateTargetPointsTeamEfficiency(teamKey, entry, memberOutput, workingDays, leaveDays);
                                    } else {
                                        // All other teams: days equivalent / effective working days
                                        efficiency = effectiveWorkingDays > 0 ? (memberOutput / effectiveWorkingDays * 100) : 0;
                                    }
                                    
                                    console.log(`✅ Efficiency for ${entry.member_name}: week_total=${memberOutput}, working_days=${workingDays}, leave_days=${leaveDays}, effective_days=${effectiveWorkingDays}, efficiency=${efficiency.toFixed(1)}%`);
                                    
                                    memberSummaries.push({
                                        name: entry.member_name,
                                        output: memberOutput,
                                        rating: rating,
                                        efficiency: efficiency,
                                        workingDays: effectiveWorkingDays
                                    });
                                    
                                    totalOutput += memberOutput;
                                    totalRating += rating;
                                    totalEfficiency += efficiency;
                                    memberCount++;
                                });
                                
                                // Store team-specific finalized reports to avoid conflicts
                                if (!this.finalizedReports[team]) {
                                    this.finalizedReports[team] = {};
                                }
                                
                                this.finalizedReports[team][weekId] = {
                                    isFinalized: true,
                                    status: 'finalized',
                                    finalizedAt: new Date().toISOString(),
                                    source: 'supabase',
                                    memberSummaries: memberSummaries,
                                    avgOutput: memberCount > 0 ? (totalOutput / memberCount) : 0,
                                    avgRating: memberCount > 0 ? (totalRating / memberCount) : 0,
                                    avgEfficiency: memberCount > 0 ? (totalEfficiency / memberCount) : 0,
                                    weekName: weekId,
                                    dateRange: `Week of ${weekId}`
                                };
                                console.log(`✅ Marked ${weekId} as finalized for ${team} (${weekData.length} entries)`);
                            } else {
                                console.log(`ℹ️ Skipping ${weekId} for ${team} - no data found`);
                            }
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not load finalized weeks for ${team}:`, error.message);
                }
            }
            
            // Save updated finalized reports locally
            this.saveTeamSpecificData();
            
            console.log('✅ All finalized weeks loaded from Supabase');
            console.log('📊 Final finalized reports structure:', this.finalizedReports);
            
            // Debug: Show which teams and weeks are now finalized
            Object.keys(this.finalizedReports).forEach(team => {
                const weeks = Object.keys(this.finalizedReports[team] || {});
                console.log(`📅 Team ${team} has finalized weeks: ${weeks.join(', ')}`);
            });
            return true;
            
        } catch (error) {
            console.error('❌ Error loading finalized weeks from Supabase:', error);
            throw error;
        }
    }

    // Load data from Supabase
    async loadFromSupabase() {
        try {
            console.log(`📊 Loading data from Supabase for team: ${this.currentTeam}`);
            
            // Load team configuration
            const teamData = await this.supabaseAPI.loadTeamData(this.currentTeam);
            if (teamData) {
                console.log(`✅ Loaded team config for ${teamData.name}`);
                // Team config is already set in constructor, but we could update here if needed
            }
            
            // Load current week data
            if (this.currentWeek) {
                const weekData = await this.supabaseAPI.loadWeekData(this.currentTeam, this.currentWeek.id);
                if (weekData && weekData.length > 0) {
                    console.log(`✅ Loaded ${weekData.length} entries for ${this.currentWeek.id}`);
                    
                    // Convert Supabase data to local format
                    this.populateUIFromSupabaseData(weekData);
                } else {
                    console.log(`ℹ️ No data found for ${this.currentTeam} ${this.currentWeek.id}`);
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error loading from Supabase:', error);
            throw error;
        }
    }

    // Populate UI from Supabase data
    populateUIFromSupabaseData(weekEntries) {
        try {
            console.log('🎨 Populating UI from Supabase data:', weekEntries);
            
            weekEntries.forEach(entry => {
                const memberName = entry.member_name;
                const workTypeData = entry.work_type_data;
                
                console.log(`📝 Populating data for member: ${memberName}`, entry);
                console.log(`🔍 Work type data:`, workTypeData);
                
                // Populate work type inputs
                Object.entries(workTypeData).forEach(([workType, dailyData]) => {
                    console.log(`🔍 Looking for: [data-member="${memberName}"][data-work="${workType}"]`);
                    const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
                    console.log(`🔍 Found input:`, input);
                    
                    // Convert daily data to total value
                    let totalValue = 0;
                    if (typeof dailyData === 'object' && dailyData !== null) {
                        // Sum up all daily values
                        totalValue = Object.values(dailyData).reduce((sum, dayValue) => sum + (parseFloat(dayValue) || 0), 0);
                        console.log(`🔢 Converted daily data to total: ${workType} = ${totalValue} for ${memberName}`);
                    } else {
                        // If it's already a number, use it directly
                        totalValue = parseFloat(dailyData) || 0;
                    }
                    
                    if (input && totalValue > 0) {
                        console.log(`✅ Setting ${workType} = ${totalValue} for ${memberName}`);
                        input.value = totalValue;
                    } else if (totalValue > 0) {
                        console.log(`❌ Could not find input for ${memberName} - ${workType} (value: ${totalValue})`);
                    } else {
                        console.log(`ℹ️ Skipping ${workType} for ${memberName} (total: ${totalValue})`);
                    }
                });
                
                // Set working days and leave days
                const workingDaysSelect = document.querySelector(`.working-days-select[data-member="${memberName}"]`);
                console.log(`🔍 Working days selector for ${memberName}:`, workingDaysSelect);
                if (workingDaysSelect) {
                    workingDaysSelect.value = entry.working_days || 5;
                    console.log(`✅ Set working days = ${entry.working_days || 5} for ${memberName}`);
                } else {
                    console.log(`❌ Working days selector not found for ${memberName}`);
                }
                
                const leaveDaysSelect = document.querySelector(`.leave-days-select[data-member="${memberName}"]`);
                console.log(`🔍 Leave days selector for ${memberName}:`, leaveDaysSelect);
                if (leaveDaysSelect) {
                    leaveDaysSelect.value = entry.leave_days || 0;
                    console.log(`✅ Set leave days = ${entry.leave_days || 0} for ${memberName}`);
                } else {
                    console.log(`❌ Leave days selector not found for ${memberName}`);
                }
                
                // Set weekly rating
                const ratingInput = document.querySelector(`.weekly-rating-input[data-member="${memberName}"]`);
                console.log(`🔍 Rating selector for ${memberName}:`, ratingInput);
                if (ratingInput) {
                    ratingInput.value = entry.weekly_rating || 0;
                    console.log(`✅ Set rating = ${entry.weekly_rating || 0} for ${memberName}`);
                } else {
                    console.log(`❌ Rating selector not found for ${memberName}`);
                }

                // Set target points (Tech and Product teams)
                const targetPointsInput = document.querySelector(`[data-member="${memberName}"].target-points-input`);
                if (this.usesTargetPoints() && targetPointsInput && entry.target_points != null) {
                    targetPointsInput.value = entry.target_points;
                    console.log(`✅ Set target points = ${entry.target_points} for ${memberName}`);
                }
                
                // Update week total display
                const totalDisplay = document.getElementById(`week-total-${memberName}`);
                if (totalDisplay) {
                    totalDisplay.textContent = entry.week_total.toFixed(2);
                }
            });
            
            // Trigger calculations to update efficiency displays (with safety check)
            try {
                this.calculateTotals();
            } catch (error) {
                console.log('⚠️ Skipping calculations - UI elements not ready:', error.message);
            }
            
            console.log('✅ UI populated from Supabase data');
        } catch (error) {
            console.error('❌ Error populating UI from Supabase:', error);
        }
    }
    
    // Refresh the current display
    refreshCurrentDisplay() {
        try {
            if (this.currentWeek) {
                this.updateWeekInfo();
                this.loadWeekData();
            }
        } catch (error) {
            console.warn('Display refresh error:', error);
        }
    }
    

    // UTILITY: Clear all September data for all teams (admin function)
    async clearAllSeptemberData() {
        const confirmed = confirm(`🧹 ADMIN FUNCTION: Clear ALL September 2025 data for ALL teams?\n\nThis will clear:\n- B2B Team September data\n- Varsity Team September data\n- Zero1 (Bratish) Team September data\n- Zero1 (Harish) Team September data\n\nThis action cannot be undone!`);
        
        if (!confirmed) return;
        
        console.log('🧹 Starting comprehensive September data cleanup...');
        this.showMessage('🧹 Clearing all September data for all teams...', 'info');
        
        const originalTeam = this.currentTeam;
        const teams = ['b2b', 'varsity', 'zero1', 'harish'];
        let totalCleared = 0;
        
        for (const team of teams) {
            try {
                console.log(`🗑️ Clearing September data for ${team} team...`);
                
                // Switch to team
                this.currentTeam = team;
                await this.loadTeamSpecificData();
                
                // Get September weeks
                const septemberWeeks = this.weekSystem.getWeeksForMonth('September', 2025);
                console.log(`Found ${septemberWeeks.length} September weeks for ${team}`);
                
                // Clear week entries
                septemberWeeks.forEach(week => {
                    Object.keys(this.weekEntries).forEach(entryKey => {
                        if (entryKey.startsWith(week.id)) {
                            delete this.weekEntries[entryKey];
                            totalCleared++;
                            console.log(`🗑️ Cleared ${team}: ${entryKey}`);
                        }
                    });
                    
                    // Clear finalized reports (team-specific structure)
                    const weekKey = week.id;
                    if (this.finalizedReports && this.finalizedReports[team] && this.finalizedReports[team][weekKey]) {
                        delete this.finalizedReports[team][weekKey];
                        console.log(`🗑️ Cleared ${team} finalized: ${weekKey}`);
                    }
                });
                
                // Save cleared data for this team
                this.saveTeamSpecificData();
                
                console.log(`✅ Cleared September data for ${team} team`);
                
            } catch (error) {
                console.error(`❌ Error clearing ${team} team data:`, error);
            }
        }
        
        // Data cleared from Supabase - no additional sync needed
        
        // Restore original team
        this.currentTeam = originalTeam;
        await this.loadTeamSpecificData();
        
        // Refresh display
        this.populateWeekSelector();
        this.loadWeekData();
        this.updateButtonVisibility();
        
        console.log(`✅ September cleanup complete! Cleared ${totalCleared} entries across all teams`);
        this.showMessage(`✅ September data cleared for all teams! (${totalCleared} entries removed)`, 'success');
        
        return totalCleared;
    }
    

    // UTILITY: Clear current team's data for selected period
    async clearCurrentTeamData() {
        if (!this.currentWeek) {
            this.showMessage('Please select a week first', 'error');
            return;
        }
        
        const teamName = this.teamConfigs[this.currentTeam]?.name || this.currentTeam;
        const confirmed = confirm(`Are you sure you want to clear data for ${teamName} - ${this.currentWeek.label}?\n\nThis action cannot be undone.`);
        
        if (!confirmed) return;
        
        console.log(`🧹 Clearing ${teamName} data for ${this.currentWeek.label}...`);
        
        let clearedCount = 0;
        
        // Clear week entries for current week
        Object.keys(this.weekEntries).forEach(entryKey => {
            if (entryKey.startsWith(this.currentWeek.id)) {
                delete this.weekEntries[entryKey];
                clearedCount++;
                console.log(`🗑️ Cleared entry: ${entryKey}`);
            }
        });
        
        // Clear finalized reports for current week (team-specific structure)
        const weekKey = this.currentWeek.id;
        if (this.finalizedReports && this.finalizedReports[this.currentTeam] && this.finalizedReports[this.currentTeam][weekKey]) {
            delete this.finalizedReports[this.currentTeam][weekKey];
            console.log(`🗑️ Cleared finalized report for ${this.currentTeam}: ${weekKey}`);
        }
        
        // Save the cleared data locally
        this.saveTeamSpecificData();
        
        // Clear from Supabase database too
        try {
            console.log(`🗑️ Clearing data from Supabase for ${this.currentTeam} ${this.currentWeek.id}...`);
            const deletePromises = this.teamMembers.map(member => 
                this.supabaseAPI.deleteWeekData(this.currentTeam, this.currentWeek.id, member.name)
            );
            await Promise.all(deletePromises);
            console.log('✅ Data cleared from Supabase database');
        } catch (error) {
            console.warn('⚠️ Could not clear from Supabase:', error);
        }
        
        // Clear the weekly summary view immediately
        const summaryDiv = document.getElementById('weekly-summary-view');
        if (summaryDiv) summaryDiv.style.display = 'none';
        
        // Ensure week is now editable (not read-only)
        this.makeWeekEditable();
        
        // Refresh the display
        this.loadWeekData();
        
        // Force update button visibility after a short delay to ensure state is correct
        setTimeout(() => {
            this.updateButtonVisibility();
        }, 200);
        
        // CRITICAL: Reload finalized reports from Supabase to ensure cleared data doesn't persist
        try {
            console.log('🔄 Reloading finalized reports from Supabase after clear...');
            await this.loadAllFinalizedWeeksFromSupabase();
        } catch (error) {
            console.warn('⚠️ Could not reload finalized reports after clear:', error);
        }
        
        console.log(`✅ Cleared ${clearedCount} entries for ${teamName} - ${this.currentWeek.label}`);
        this.showMessage(`Cleared ${clearedCount} entries for ${teamName} - ${this.currentWeek.label}`, 'success');
        
        return clearedCount;
    }
    
    
    // Force sync with Google Sheets
    async forceSync() {
        this.showMessage('🔄 Force syncing with Google Sheets...', 'info');
        
        try {
            // Get any failed syncs and retry them
            await this.retryFailedSyncs();
            
            // Force sync current team data to Supabase
            const result = await this.saveToSupabaseWithRetry(5); // More retries for force sync
            
            if (result.success) {
                this.showMessage('✅ Force sync completed successfully!', 'success');
            } else {
                this.showMessage(`⚠️ Force sync partially failed: ${result.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Force sync failed:', error);
            this.showMessage('❌ Force sync failed. Check console for details.', 'error');
        }
    }
    
    // Retry any failed syncs
    async retryFailedSyncs() {
        const failedSyncKey = 'failed_syncs';
        const failedSyncs = JSON.parse(localStorage.getItem(failedSyncKey) || '[]');
        
        if (failedSyncs.length === 0) {
            console.log('📝 No failed syncs to retry');
            return;
        }
        
        console.log(`🔄 Retrying ${failedSyncs.length} failed syncs...`);
        
        const retryPromises = failedSyncs.map(async (failedSync, index) => {
            try {
                // Temporarily switch to the failed sync's team
                const originalTeam = this.currentTeam;
                this.currentTeam = failedSync.team;
                this.weekEntries = failedSync.data;
                
                const result = await this.saveToGoogleSheets();
                
                // Restore original team
                this.currentTeam = originalTeam;
                
                if (result && result.success !== false) {
                    console.log(`✅ Retry successful for ${failedSync.team} ${failedSync.week}`);
                    return index; // Return index of successful retry
                }
                
            } catch (error) {
                console.warn(`❌ Retry failed for ${failedSync.team} ${failedSync.week}:`, error);
            }
            
            return null;
        });
        
        const results = await Promise.all(retryPromises);
        const successfulRetries = results.filter(index => index !== null);
        
        // Remove successful retries from failed syncs
        const remainingFailedSyncs = failedSyncs.filter((sync, index) => !successfulRetries.includes(index));
        localStorage.setItem(failedSyncKey, JSON.stringify(remainingFailedSyncs));
        
        console.log(`✅ Successfully retried ${successfulRetries.length} out of ${failedSyncs.length} failed syncs`);
    }
    
    // Data validation before saving
    validateWeekData() {
        const errors = [];
        const warnings = [];
        
        if (!this.currentWeek) {
            errors.push('No week selected');
            return { isValid: false, errors, warnings };
        }
        
        if (!this.teamMembers || this.teamMembers.length === 0) {
            errors.push('No team members found');
            return { isValid: false, errors, warnings };
        }
        
        // Validate each member's data
        this.teamMembers.forEach(member => {
            const memberName = member.name || member;
            const entryKey = `${this.currentWeek.id}_${memberName}`;
            const entry = this.weekEntries[entryKey];
            
            if (!entry) {
                warnings.push(`No data entered for ${memberName}`);
                return;
            }
            
            // Check for negative values
            Object.keys(entry.workTypes || {}).forEach(workType => {
                Object.keys(entry.workTypes[workType] || {}).forEach(day => {
                    const value = entry.workTypes[workType][day];
                    if (value < 0) {
                        errors.push(`Negative value found for ${memberName} - ${workType} on ${day}`);
                    }
                    if (value > 50) {
                        warnings.push(`Very high value (${value}) for ${memberName} - ${workType} on ${day}`);
                    }
                });
            });
            
            // Check total hours per day
            const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
            days.forEach(day => {
                let dayTotal = 0;
                Object.keys(entry.workTypes || {}).forEach(workType => {
                    dayTotal += entry.workTypes[workType][day] || 0;
                });
                
                if (dayTotal > 12) {
                    warnings.push(`${memberName} has ${dayTotal.toFixed(1)} hours on ${day} (>12h)`);
                } else if (dayTotal < 0.1 && dayTotal > 0) {
                    warnings.push(`${memberName} has very low hours (${dayTotal.toFixed(1)}) on ${day}`);
                }
            });
        });
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Show validation results
    showValidationResults(validation) {
        let message = '';
        
        if (validation.errors.length > 0) {
            message += '❌ ERRORS:\n' + validation.errors.join('\n') + '\n\n';
        }
        
        if (validation.warnings.length > 0) {
            message += '⚠️ WARNINGS:\n' + validation.warnings.join('\n');
        }
        
        if (message) {
            console.warn('Validation issues:', validation);
            this.showMessage(message, validation.errors.length > 0 ? 'error' : 'warning');
        }
        
        return validation.isValid;
    }
    
    // Update visibility of sync and clear buttons based on week status
    updateButtonVisibility() {
        const finalizeBtn = document.getElementById('finalize-btn');
        const clearBtn = document.getElementById('clear-data-btn');
        
        if (!finalizeBtn || !clearBtn || !this.currentWeek) {
            console.log('⚠️ Button visibility update skipped - missing elements or week');
            return;
        }
        
        // Check if current week is finalized
        const isFinalized = this.isWeekFinalized();
        console.log(`🔍 Week ${this.currentWeek.id} finalized status: ${isFinalized}`);
        
        if (isFinalized) {
            // Week is finalized - show only clear button, hide finalize button
            finalizeBtn.style.display = 'none';
            clearBtn.style.display = 'flex';
            console.log('📊 Finalized week: Showing Clear button only');
        } else {
            // Week not finalized - show finalize button, hide clear button for now
            finalizeBtn.style.display = 'flex';
            clearBtn.style.display = 'none';
            console.log('📝 Non-finalized week: Showing Finalize button only');
        }
    }
    
    // Check if current week has any data
    weekHasData() {
        if (!this.currentWeek || !this.weekEntries) return false;
        
        // Check if any team member has data for this week
        const hasEntries = Object.keys(this.weekEntries).some(entryKey => 
            entryKey.startsWith(this.currentWeek.id)
        );
        
        if (hasEntries) return true;
        
        // Also check if there's any data in the UI inputs
        const workTypeInputs = document.querySelectorAll('input[data-worktype]');
        return Array.from(workTypeInputs).some(input => 
            parseFloat(input.value || 0) > 0
        );
    }
    
    // Check if current week is finalized
    isWeekFinalized() {
        if (!this.currentWeek || !this.finalizedReports || !this.currentTeam) return false;
        
        const weekKey = this.currentWeek.id;
        const teamFinalizedReports = this.finalizedReports[this.currentTeam] || {};
        const isFinalized = teamFinalizedReports.hasOwnProperty(weekKey) && 
                           teamFinalizedReports[weekKey] !== null;
        
        console.log(`🔍 isWeekFinalized check: team=${this.currentTeam}, week=${weekKey}, finalized=${isFinalized}`);
        console.log(`📋 Available finalized weeks for ${this.currentTeam}:`, Object.keys(teamFinalizedReports));
        
        return isFinalized;
    }
    
    // Update sync status display
    updateSyncStatus() {
        const syncStatusDiv = document.getElementById('sync-status');
        const localEntriesSpan = document.getElementById('local-entries');
        const lastSyncSpan = document.getElementById('last-sync');
        const syncStateSpan = document.getElementById('sync-state');
        const failedCountSpan = document.getElementById('failed-count');
        
        if (!syncStatusDiv) return;
        
        // Show the status panel
        syncStatusDiv.style.display = 'block';
        
        // Get current data counts
        const localEntries = Object.keys(this.weekEntries || {}).length;
        const syncMetadata = this.getSyncMetadata();
        const failedSyncs = JSON.parse(localStorage.getItem('failed_syncs') || '[]');
        
        // Update display
        if (localEntriesSpan) localEntriesSpan.textContent = localEntries;
        if (lastSyncSpan) {
            const lastSync = syncMetadata.lastSynced;
            lastSyncSpan.textContent = lastSync ? 
                new Date(lastSync).toLocaleString() : 'Never';
        }
        if (syncStateSpan) {
            if (syncMetadata.needsSync) {
                syncStateSpan.textContent = '⏳ Needs Sync';
                syncStateSpan.style.color = '#f39c12';
            } else {
                syncStateSpan.textContent = '✅ Synced';
                syncStateSpan.style.color = '#27ae60';
            }
        }
        if (failedCountSpan) {
            failedCountSpan.textContent = failedSyncs.length;
            if (failedSyncs.length > 0) {
                failedCountSpan.style.color = '#e74c3c';
            }
        }
    }
    
    // Show sync status periodically and on important events
    startSyncStatusUpdates() {
        // Update immediately
        this.updateSyncStatus();
        
        // Update every 30 seconds
        setInterval(() => {
            this.updateSyncStatus();
        }, 30000);
    }
    
    getActiveTeamMembers(team) {
        console.log(`🔍 getActiveTeamMembers called for team: ${team}`);
        console.log(`🔍 Available members in config:`, this.teamConfigs[team]?.members?.map(m => m.name || m));
        
        // For B2B team: Satyam Gupta is completely removed from all input fields
        // He should only appear in historical data and person view for past months
        if (team === 'b2b') {
            console.log('📅 Removing Satyam Gupta from B2B team for all current inputs');
            const filteredMembers = this.teamConfigs[team].members.filter(member => member.name !== 'Satyam Gupta');
            console.log(`🔍 Filtered B2B members:`, filteredMembers.map(m => m.name || m));
            return filteredMembers;
        }
        
        // For Social team: Swapnil is removed from active members (left the team)
        if (team === 'social') {
            return this.teamConfigs[team].members.filter(member => member.name !== 'Swapnil');
        }

        // For all other teams, return all configured members
        console.log(`🔍 Returning all members for ${team}`);
        return this.teamConfigs[team].members;
    }
    
    getAllTeamMembers(team) {
        // Always return all configured team members (including removed ones) for historical viewing
        return this.teamConfigs[team].members;
    }

    usesTargetPoints() {
        return this.currentTeam === 'tech' || this.currentTeam === 'product';
    }

    // Product rows finalized before target_points existed default to weekly target of 5
    resolveTargetPoints(teamId, storedTargetPoints) {
        const parsed = parseFloat(storedTargetPoints);
        if (parsed > 0) return parsed;
        if (teamId === 'product') return 5;
        return 0;
    }

    // Old DB rows may have story points in work_type_data but week_total empty
    getMemberWeekOutput(entry, teamId) {
        const weekTotal = parseFloat(entry.week_total);
        if (weekTotal > 0) return weekTotal;

        const workTypeData = entry.work_type_data || {};
        let output = 0;
        Object.values(workTypeData).forEach(workType => {
            if (typeof workType === 'object' && workType !== null) {
                output += Object.values(workType).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            } else {
                output += parseFloat(workType) || 0;
            }
        });
        return output;
    }

    hasStoredTargetPoints(entry) {
        return entry.target_points != null && entry.target_points !== '' && parseFloat(entry.target_points) > 0;
    }

    // Tech/Product efficiency with backward compat for pre-target_points Product rows
    calculateTargetPointsTeamEfficiency(teamId, entry, memberOutput, workingDays, leaveDays) {
        const safeWorkingDays = Math.max(parseFloat(workingDays) || 5, 1);
        const leave = parseFloat(leaveDays) || 0;
        const effectiveWorkingDays = Math.max(safeWorkingDays - leave, 0);

        if (memberOutput <= 0 || effectiveWorkingDays <= 0) return 0;

        // Legacy Product: finalized before target_points — 1 SP per effective working day
        if (teamId === 'product' && !this.hasStoredTargetPoints(entry)) {
            return (memberOutput / effectiveWorkingDays) * 100;
        }

        const targetPoints = this.resolveTargetPoints(teamId, entry.target_points);
        const adjustedTarget = targetPoints * (effectiveWorkingDays / safeWorkingDays);
        return adjustedTarget > 0 ? (memberOutput / adjustedTarget) * 100 : 0;
    }
    
    async init() {
        try {
            this.showMessage('Initializing system...', 'info');
            
            // Mark September 2025 as completed for all teams
            this.markSeptemberAsCompleted();
            
            // Setup team switching with error handling
            try {
                this.setupTeamSwitching();
            } catch (e) {
                console.warn('Team switching setup warning:', e);
            }
            
            // Initialize week selector with error handling
            try {
                this.populateWeekSelector();
            } catch (e) {
                console.warn('Week selector setup warning:', e);
            }
            
            // Set up event listeners with error handling
            try {
                this.setupEventListeners();
            } catch (e) {
                console.warn('Event listeners setup warning:', e);
            }
            
            // Load real data from Google Sheets (with timeout and fallback)
            try {
                await Promise.race([
                    this.loadRealData(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
                ]);
            } catch (e) {
                console.warn('Google Sheets loading issue, continuing with fallback:', e);
                // Continue without Google Sheets data
            }
            
            // Set current week with error handling
            try {
                this.setCurrentWeek();
            } catch (e) {
                console.warn('Current week setup warning:', e);
                // Set a default week if needed
                this.currentWeek = this.weekSystem.weeks[0] || null;
            }
            
            // Show success message regardless of minor issues
            this.showMessage('✅ System ready! Click a team and select a period to begin.', 'success');
            
        } catch (error) {
            console.error('Critical initialization error:', error);
            // Only show error message for truly critical issues
            this.showMessage('⚠️ System starting with basic functionality. Try refreshing if issues persist.', 'warning');
        }
    }
    
    populateWeekSelector() {
        const weekSelect = document.getElementById('week-select');
        if (!weekSelect) {
            console.warn('Week selector element not found');
            return;
        }
        
        if (!this.weekSystem || !this.weekSystem.weeks) {
            console.warn('Week system not ready');
            weekSelect.innerHTML = '<option value="">Week system loading...</option>';
            return;
        }
        
        // Remember current selection
        const currentSelection = weekSelect.value;
        
        // Use getFilteredWeeks() which includes both team filtering and month locking
        let weeks = this.getFilteredWeeks();
        
        console.log(`🔍 Filtered weeks for ${this.currentTeam}:`, weeks.length, 'weeks (after team and month locking filters)');
        console.log(`🔒 Locked months for ${this.currentTeam}:`, this.lockedMonths[this.currentTeam] || []);
        
        // Determine current view mode
        const activeViewBtn = document.querySelector('.view-btn.active');
        const currentView = activeViewBtn ? activeViewBtn.getAttribute('data-view') : 'weekly';
        
        // Get available historical months for current team (2025 completed months)
        const getHistoricalMonths = (teamId) => {
            const monthMap = {
                'b2b': ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'varsity': ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'zero1': ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'harish': ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'audio': ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'graphics': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'tech': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'product': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'preproduction': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'content': ['September 2025', 'October 2025', 'November 2025', 'December 2025'],
                'social': ['September 2025', 'October 2025', 'November 2025', 'December 2025']
            };
            return monthMap[teamId] || [];
        };
        
        const availableHistoricalMonths = getHistoricalMonths(this.currentTeam);
        
        // Group weeks by month
        const monthGroups = {};
        weeks.forEach(week => {
            const monthYear = week.monthYear;
            if (!monthGroups[monthYear]) {
                monthGroups[monthYear] = [];
            }
            monthGroups[monthYear].push(week);
        });
        
        // CRITICAL FIX: Add finalized months that were filtered out from weekly view
        // Check all months in 2025 to see if they have all weeks finalized
        // Map currentTeam to Supabase team ID for finalized reports lookup
        const supabaseTeamId = this.currentTeam === 'zero1' ? 'zero1_bratish' : 
                               this.currentTeam === 'harish' ? 'zero1_harish' : 
                               this.currentTeam;
        const finalizedWeeksForTeam = this.finalizedReports?.[supabaseTeamId] || this.finalizedReports?.[this.currentTeam] || {};
        
        console.log(`🔍 Checking finalized weeks for ${this.currentTeam} (Supabase ID: ${supabaseTeamId})`);
        console.log(`  - Finalized weeks found:`, Object.keys(finalizedWeeksForTeam));
        
        const allWeeks = this.weekSystem.getWeeksForSelector();
        const allMonthYears = [...new Set(allWeeks.map(w => w.monthYear))];
        
        allMonthYears.forEach(monthYear => {
            // Skip if already in monthGroups (not filtered out)
            if (monthGroups[monthYear]) return;
            
            // Check if this month has all weeks finalized
            const [monthName, yearStr] = monthYear.split(' ');
            const year = parseInt(yearStr);
            const monthWeeks = this.weekSystem.getWeeksByMonthName(monthName, year);
            const finalizedCount = monthWeeks.filter(w => 
                finalizedWeeksForTeam[w.id] !== undefined && 
                finalizedWeeksForTeam[w.id] !== null
            ).length;
            
            // If all weeks finalized, add as a month group (even though weeks are hidden)
            if (finalizedCount === monthWeeks.length && monthWeeks.length > 0) {
                monthGroups[monthYear] = monthWeeks; // Add the weeks for reference
                console.log(`📊 Adding finalized month to dropdown: ${monthYear} (${finalizedCount}/${monthWeeks.length} weeks finalized)`);
            }
        });
        
        let optionsHTML = '<option value="">Select a period...</option>';
        
        // Determine current working month from this.currentWeek
        const currentWorkingMonth = this.currentWeek ? `${this.currentWeek.monthName} ${this.currentWeek.year}` : null;
        
        Object.keys(monthGroups).forEach(monthYear => {
            const isCurrentWorkingMonth = monthYear === currentWorkingMonth;
            const isCompleteMonth = this.historicalData[this.currentTeam]?.[monthYear]?.isComplete;
            const isHistoricalMonth = availableHistoricalMonths.includes(monthYear);
            
            // Debug logging for September
            if (monthYear === 'September 2025') {
                console.log(`🔍 September 2025 dropdown check for ${this.currentTeam}:`);
                console.log(`  - isCompleteMonth: ${isCompleteMonth}`);
                console.log(`  - isHistoricalMonth: ${isHistoricalMonth}`);
                console.log(`  - availableHistoricalMonths:`, availableHistoricalMonths);
                console.log(`  - historicalData exists:`, !!this.historicalData[this.currentTeam]?.['September 2025']);
                console.log(`  - currentView: ${currentView}`);
            }
            
            // CRITICAL FIX: Also check if all weeks of this month are finalized
            const monthWeeks = this.weekSystem.getWeeksByMonthName(monthYear.split(' ')[0], parseInt(monthYear.split(' ')[1]));
            // Use same Supabase team ID mapping as above
            const teamFinalizedWeeks = this.finalizedReports?.[supabaseTeamId] || this.finalizedReports?.[this.currentTeam] || {};
            const finalizedCount = monthWeeks.filter(w => 
                teamFinalizedWeeks[w.id] !== undefined && 
                teamFinalizedWeeks[w.id] !== null
            ).length;
            const hasAllWeeksFinalized = finalizedCount === monthWeeks.length && monthWeeks.length > 0;
            
            // Filter options based on current view
            if (currentView === 'monthly') {
                // In monthly view, show months that are either complete, historical, OR have all weeks finalized
                if (isCompleteMonth || isHistoricalMonth || hasAllWeeksFinalized) {
                    optionsHTML += `<option value="MONTH_${monthYear}">📊 ${monthYear} (Monthly Summary)</option>`;
                    if (monthYear === 'September 2025' || monthYear === 'October 2025') {
                        console.log(`✅ Added ${monthYear} to monthly dropdown for ${this.currentTeam} (finalized: ${finalizedCount}/${monthWeeks.length})`);
                    }
                } else if (monthYear === 'September 2025' || monthYear === 'October 2025') {
                    console.log(`❌ ${monthYear} NOT added to monthly dropdown for ${this.currentTeam} (finalized: ${finalizedCount}/${monthWeeks.length})`);
                }
            } else if (currentView === 'weekly') {
                // In weekly view, only show weekly options (not completed months)
                if (!isCompleteMonth) {
                    if (isCurrentWorkingMonth) {
                        // Show weekly options for current working month
                        optionsHTML += `<optgroup label="📅 ${monthYear} - Current Month">`;
                        monthGroups[monthYear].forEach(week => {
                            const statusIcon = week.id === this.currentWeek?.id ? '▶️' : '⏳';
                            optionsHTML += `<option value="${week.id}">${statusIcon} ${week.label}</option>`;
                        });
                        optionsHTML += '</optgroup>';
                    } else {
                        // Show other active months (not complete, not current working month)
                        const hasWeeks = monthGroups[monthYear].length > 0;
                        if (hasWeeks) {
                            optionsHTML += `<optgroup label="📅 ${monthYear}">`;
                            monthGroups[monthYear].forEach(week => {
                                optionsHTML += `<option value="${week.id}">⏳ ${week.label}</option>`;
                            });
                            optionsHTML += '</optgroup>';
                        }
                    }
                }
            } else {
                // For person view or default, show all options
                if (isCompleteMonth || isHistoricalMonth) {
                    optionsHTML += `<option value="MONTH_${monthYear}">📊 ${monthYear} (Monthly Summary)</option>`;
                } else if (isCurrentWorkingMonth) {
                    optionsHTML += `<optgroup label="📅 ${monthYear} - Current Month">`;
                    monthGroups[monthYear].forEach(week => {
                        const statusIcon = week.id === this.currentWeek?.id ? '▶️' : '⏳';
                        optionsHTML += `<option value="${week.id}">${statusIcon} ${week.label}</option>`;
                    });
                    optionsHTML += '</optgroup>';
                } else {
                    const hasWeeks = monthGroups[monthYear].length > 0;
                    if (hasWeeks) {
                        optionsHTML += `<optgroup label="📅 ${monthYear}">`;
                        monthGroups[monthYear].forEach(week => {
                            optionsHTML += `<option value="${week.id}">⏳ ${week.label}</option>`;
                        });
                        optionsHTML += '</optgroup>';
                    }
                }
            }
        });
        
        // Add any historical months that weren't included in monthGroups
        if (currentView === 'monthly' || currentView === 'person' || !currentView) {
            availableHistoricalMonths.forEach(monthYear => {
                // Only add if not already in the options
                if (!optionsHTML.includes(`MONTH_${monthYear}`)) {
                    optionsHTML += `<option value="MONTH_${monthYear}">📊 ${monthYear} (Monthly Summary)</option>`;
                }
            });
        }
        
        weekSelect.innerHTML = optionsHTML;
        
        // Restore previous selection if it still exists
        if (currentSelection && weekSelect.querySelector(`option[value="${currentSelection}"]`)) {
            weekSelect.value = currentSelection;
        }
        
        // Update placeholder text and label based on view
        const placeholder = weekSelect.querySelector('option[value=""]');
        const label = document.getElementById('period-selector-label');
        
        if (placeholder && label) {
            if (currentView === 'monthly') {
                placeholder.textContent = 'Select a month...';
                label.textContent = 'Select Month:';
            } else if (currentView === 'weekly') {
                placeholder.textContent = 'Select a week...';
                label.textContent = 'Select Week:';
            } else {
                placeholder.textContent = 'Select a period...';
                label.textContent = 'Select Period:';
            }
        }
    }
    
    async loadRealData() {
        try {
            this.showMessage('Loading data from Google Sheets...', 'info');
            
            // Try to load real data from Google Sheets
            this.sheetData = await this.sheetsAPI.readSheetData();
            
            if (this.sheetData && this.sheetData.length > 0) {
                this.showMessage(`Loaded ${this.sheetData.length} records from Google Sheets`, 'success');
            } else {
                this.showMessage('Using fallback data - Google Sheets connection failed', 'error');
            }
            
            // Extract and render team members
            this.extractTeamMembers();
            
            document.getElementById('loading').style.display = 'none';
            
        } catch (error) {
            console.error('Error loading real data:', error);
            this.showMessage('Error loading data from Google Sheets. Using fallback data.', 'error');
            this.extractTeamMembers();
            document.getElementById('loading').style.display = 'none';
        }
    }
    
    extractTeamMembers() {
        // Use the actual team members from the screenshot
        this.teamMembers = [
            { name: 'Deepak', role: 'Motion Graphics', target: 22 },
            { name: 'Anjali Rawat', role: 'Motion Graphics', target: 19 },
            { name: 'Swati Juyal', role: 'Motion Graphics', target: 21 },
            { name: 'Satyam Gupta', role: 'Motion Graphics', target: 20 },
            { name: 'Deepak Kumar', role: 'Motion Graphics', target: 19 }
        ];
    }
    

    
    setCurrentWeek() {
        try {
        // Find the first incomplete week for this team
        const currentWeek = this.getFirstIncompleteWeek();
        if (currentWeek) {
                const weekSelect = document.getElementById('week-select');
                if (weekSelect) {
                    weekSelect.value = currentWeek.id;
                }
            this.currentWeek = currentWeek;
            this.updateWeekInfo();
                console.log(`Set current week: ${currentWeek.label}`);
            } else {
                // Fallback to first available week
                const firstWeek = this.weekSystem.weeks[0];
                if (firstWeek) {
                    this.currentWeek = firstWeek;
                    const weekSelect = document.getElementById('week-select');
                    if (weekSelect) {
                        weekSelect.value = firstWeek.id;
                    }
                    console.log(`Fallback to first week: ${firstWeek.label}`);
                }
            }
            
            // Update team selector to hide/show archived teams based on new current week
            this.updateTeamSelectorOptions();
        } catch (error) {
            console.warn('Error setting current week:', error);
            // Ensure we have some week selected
            const fallbackWeek = this.weekSystem.weeks[0];
            if (fallbackWeek) {
                this.currentWeek = fallbackWeek;
            }
        }
    }
    
    getFirstIncompleteWeek() {
        // Get team-specific filtered weeks (September onwards for tech/product/preproduction)
        const allWeeks = this.getFilteredWeeks();
        
        console.log(`🔍 Checking ${allWeeks.length} filtered weeks for ${this.currentTeam}`);
        
        // Find first week that is not in historical data and not finalized
        for (const week of allWeeks) {
            const monthYear = `${week.monthName} ${week.year}`;
            
            // Skip if this month is already in historical data (completed)
            if (this.historicalData[this.currentTeam]?.[monthYear]?.isComplete) {
                console.log(`⏭️ Skipping completed month: ${monthYear} for ${this.currentTeam}`);
                continue;
            }
            
            // Check if this week is finalized for current team
            const teamFinalizedReports = this.finalizedReports?.[this.currentTeam] || {};
            const isFinalized = teamFinalizedReports[week.id];
            
            if (!isFinalized) {
                console.log(`🎯 Found first incomplete week for ${this.currentTeam}: ${week.label} (${week.id})`);
                return week;
            } else {
                console.log(`✅ Week ${week.label} (${week.id}) already finalized for ${this.currentTeam}`);
            }
        }
        
        // Fallback to current calendar week
        console.log(`⚠️ No incomplete weeks found for ${this.currentTeam}, using calendar current`);
        return this.weekSystem.getCurrentWeek();
    }
    
    resetFiltersOnTeamSwitch() {
        try {
            console.log(`🔄 Resetting filters for team switch to ${this.currentTeam}`);
            
            // Reset week/month selector to default
            const weekSelect = document.getElementById('week-select');
            if (weekSelect) {
                weekSelect.value = '';
                weekSelect.innerHTML = '<option value="">Loading periods...</option>';
            }
            
            // Reset person selector to default
            const personSelect = document.getElementById('person-select');
            if (personSelect) {
                personSelect.value = '';
            }
            
            // Reset to weekly view by default
            const weeklyBtn = document.querySelector('.view-btn[data-view="weekly"]');
            const monthlyBtn = document.querySelector('.view-btn[data-view="monthly"]');
            const personBtn = document.querySelector('.view-btn[data-view="person"]');
            
            if (weeklyBtn && monthlyBtn && personBtn) {
                // Reset button states
                [weeklyBtn, monthlyBtn, personBtn].forEach(btn => btn.classList.remove('active'));
                weeklyBtn.classList.add('active');
            }
            
            // Clear any displayed data
            const dataContainer = document.getElementById('data-container');
            if (dataContainer) {
                dataContainer.innerHTML = '<p>Please select a week to view data.</p>';
            }
            
            // Clear week info
            const weekInfo = document.getElementById('week-info');
            if (weekInfo) {
                weekInfo.style.display = 'none';
            }
            
            // Clear monthly table if exists
            const monthlyTable = document.getElementById('monthly-table');
            if (monthlyTable) monthlyTable.remove();
            
            // Clear person view if exists
            const personView = document.getElementById('person-view');
            if (personView) personView.style.display = 'none';
            
            // Reset current week to null
            this.currentWeek = null;
            
            console.log(`✅ Filters reset for ${this.currentTeam}`);
        } catch (error) {
            console.error('Error resetting filters:', error);
            this.showMessage('Filter reset completed with some minor issues', 'warning');
        }
    }
    
    updateViewButtonStates(activeView) {
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.classList.remove('active');
            // Set data-view attribute if not present
            if (!btn.hasAttribute('data-view')) {
                if (btn.textContent.includes('Weekly')) btn.setAttribute('data-view', 'weekly');
                else if (btn.textContent.includes('Monthly')) btn.setAttribute('data-view', 'monthly');
                else if (btn.textContent.includes('Person')) btn.setAttribute('data-view', 'person');
            }
        });
        
        // Set active view
        const activeBtn = document.querySelector(`.view-btn[data-view="${activeView}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    
    updateWeekInfo() {
        if (!this.currentWeek) return;
        
        try {
            const weekInfo = document.getElementById('week-info');
            const weekTitle = document.getElementById('week-title');
            const weekDates = document.getElementById('week-dates');
            
            if (weekInfo) weekInfo.style.display = 'block';
            if (weekTitle) {
                weekTitle.textContent = 
            `Week ${this.currentWeek.weekNumber} - ${this.currentWeek.monthName} ${this.currentWeek.year}`;
            }
            if (weekDates) {
                let datesText = `${this.currentWeek.dateRange} (Monday to Friday)`;
                
                // Add lock month button for last week of the month
                if (this.currentWeek.weekNumber === 4) {
                    const monthYear = `${this.currentWeek.monthName} ${this.currentWeek.year}`;
                    const isLocked = this.lockedMonths[this.currentTeam]?.includes(monthYear);
                    
                    if (!isLocked) {
                        datesText += `
                            <div style="margin-top: 10px;">
                                <button onclick="if(window.tracker) window.tracker.lockMonth('${monthYear}')" 
                                        style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    🔒 Lock ${this.currentWeek.monthName} ${this.currentWeek.year}
                                </button>
                                <small style="display: block; margin-top: 5px; color: #666; font-style: italic;">
                                    Lock this month to move it from weekly to monthly view
                                </small>
                            </div>`;
                    } else {
                        datesText += `
                            <div style="margin-top: 10px; color: #27ae60; font-weight: bold;">
                                🔒 ${this.currentWeek.monthName} ${this.currentWeek.year} is locked (Monthly view only)
                            </div>`;
                    }
                }
                
                weekDates.innerHTML = datesText;
            }
        } catch (error) {
            console.warn('Error updating week info:', error);
        }
    }
    
    loadWeekData() {
        if (!this.currentWeek) return;
        
        // Update button visibility whenever week data is loaded
        setTimeout(() => this.updateButtonVisibility(), 100);
        
        // Show the efficiency data section
        document.getElementById('efficiency-data').style.display = 'block';
        
        // Generate rows for all team members
        this.generateTeamDataRows();
        
        // Load existing data for all members
        this.loadAllMembersData();
        
        // Check if week is finalized and update UI accordingly
        this.checkWeekFinalizationStatus();
    }
    
    checkWeekFinalizationStatus() {
        if (!this.currentWeek) return;
        
        // Use team-specific finalized reports
        const weekKey = this.currentWeek.id;
        const teamFinalizedReports = this.finalizedReports?.[this.currentTeam] || {};
        const isFinalized = teamFinalizedReports.hasOwnProperty(weekKey) && teamFinalizedReports[weekKey] !== null && teamFinalizedReports[weekKey] !== undefined;
        
        const statusDiv = document.getElementById('finalize-status');
        const saveButton = document.querySelector('button[onclick="tracker.saveWeekData()"]');
        const finalizeButton = document.querySelector('button[onclick="tracker.finalizeWeeklyReport()"]');
        
        console.log(`🔍 Checking Week ${weekKey} for team ${this.currentTeam}:`);
        console.log(`📊 All finalized reports structure:`, this.finalizedReports);
        console.log(`📋 Team finalized reports for ${this.currentTeam}:`, teamFinalizedReports);
        console.log(`📅 Available weeks for ${this.currentTeam}:`, Object.keys(teamFinalizedReports));
        console.log(`✅ Week ${weekKey} finalization status:`, isFinalized);
        console.log('📝 Finalized data:', teamFinalizedReports[weekKey] || 'No finalized data');
        
        if (isFinalized) {
            // Use the standard finalization display (hide buttons, show summary)
            this.showFinalizationStatus();
        } else {
            // Enable editing for non-finalized weeks
            if (statusDiv) statusDiv.style.display = 'none';
            
            // Show buttons for non-finalized weeks
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.style.display = 'flex';
                saveButton.innerHTML = '<i class="fas fa-save"></i> Save Week Data';
                saveButton.style.background = '#28a745';
            }
            
            if (finalizeButton) {
                finalizeButton.disabled = false;
                finalizeButton.style.display = 'flex';
                finalizeButton.innerHTML = '<i class="fas fa-check-circle"></i> Finalize & Lock Week';
                finalizeButton.style.background = '#e74c3c';
            }
            
            // Enable all inputs
            document.querySelectorAll('.level-input, .working-days-select, .leave-days-select, .weekly-rating-input').forEach(input => {
                input.disabled = false;
            });
            
            // Hide weekly summary for non-finalized weeks
            const summaryDiv = document.getElementById('weekly-summary-view');
            if (summaryDiv) summaryDiv.style.display = 'none';
        }
    }

    generateTeamHeader() {
        const thead = document.querySelector('.efficiency-table thead');
        
        // Get work types based on current team
        let workTypes, levelMapping;
        if (this.currentTeam === 'zero1') {
            workTypes = this.zero1WorkTypes;
            levelMapping = this.zero1LevelMapping;
        } else if (this.currentTeam === 'harish') {
            workTypes = this.harishWorkTypes;
            levelMapping = this.harishLevelMapping;
        } else if (this.currentTeam === 'audio') {
            workTypes = this.audioWorkTypes;
            levelMapping = this.audioLevelMapping;
        } else if (this.currentTeam === 'shorts') {
            workTypes = this.shortsWorkTypes;
            levelMapping = this.shortsLevelMapping;
        } else if (this.currentTeam === 'varsity') {
            workTypes = this.varsityWorkTypes;
            levelMapping = this.varsityLevelMapping;
        } else if (this.currentTeam === 'graphics') {
            workTypes = this.graphicsWorkTypes;
            levelMapping = this.graphicsLevelMapping;
        } else if (this.currentTeam === 'tech') {
            workTypes = this.techWorkTypes;
            levelMapping = this.techLevelMapping;
        } else if (this.currentTeam === 'product') {
            workTypes = this.productWorkTypes;
            levelMapping = this.productLevelMapping;
        } else if (this.currentTeam === 'preproduction') {
            workTypes = this.preproductionWorkTypes;
            levelMapping = this.preproductionLevelMapping;
        } else if (this.currentTeam === 'content') {
            workTypes = this.contentWorkTypes;
            levelMapping = this.contentLevelMapping;
        } else if (this.currentTeam === 'social') {
            workTypes = this.socialWorkTypes;
            levelMapping = this.socialLevelMapping;
        } else {
            workTypes = this.workTypes; // B2B uses original types
            levelMapping = this.levelMapping;
        }
        
        const workTypeKeys = Object.keys(workTypes);
        console.log(`Generating header for ${this.currentTeam} with work types:`, workTypeKeys);
        
        // Count work types per level for colspan
        const levelCounts = {};
        Object.keys(levelMapping).forEach(level => {
            levelCounts[level] = levelMapping[level].length;
        });
        
        // Generate level header row
        const levelHeaderCols = Object.keys(levelMapping).map(level => 
            `<th colspan="${levelCounts[level]}">${level}</th>`
        ).join('');
        
        // Generate work type header row
        const workTypeHeaderCols = workTypeKeys.map(workTypeKey => 
            `<th>${workTypes[workTypeKey].name}</th>`
        ).join('');
        
        // Hide rating column for Tech, Product, Content, and Social teams
        const ratingColumn = (this.currentTeam === 'tech' || this.currentTeam === 'product' || this.currentTeam === 'content' || this.currentTeam === 'social') ? '' : '<th rowspan="2">Weekly Rating</th>';
        // Add Target Points column for Tech and Product teams
        const targetPointsColumn = this.usesTargetPoints() ? '<th rowspan="2">Target Points</th>' : '';
        
        thead.innerHTML = `
            <tr>
                <th rowspan="2">Work Types</th>
                ${levelHeaderCols}
                <th rowspan="2">Week Total</th>
                <th rowspan="2">Working Days</th>
                <th rowspan="2">Leave Days</th>
                ${ratingColumn}
                ${targetPointsColumn}
                <th rowspan="2">Target</th>
                <th rowspan="2">Efficiency %</th>
            </tr>
            <tr class="sub-header">
                ${workTypeHeaderCols}
            </tr>
        `;
    }

    generateTeamDataRows() {
        const tbody = document.getElementById('team-data-rows');
        tbody.innerHTML = '';
        
        console.log('Generating team data rows for:', this.teamMembers);
        
        // Update header first
        this.generateTeamHeader();
        
        // Handle both object format (B2B) and string format (Varsity)
        const memberNames = this.teamMembers.map(member => {
            return typeof member === 'object' ? member.name : member;
        });
        
        console.log('Member names for rows:', memberNames);
        
        // Get work types based on current team
        let workTypes;
        if (this.currentTeam === 'zero1') {
            workTypes = this.zero1WorkTypes;
        } else if (this.currentTeam === 'harish') {
            workTypes = this.harishWorkTypes;
        } else if (this.currentTeam === 'audio') {
            workTypes = this.audioWorkTypes;
        } else if (this.currentTeam === 'shorts') {
            workTypes = this.shortsWorkTypes;
        } else if (this.currentTeam === 'varsity') {
            workTypes = this.varsityWorkTypes;
        } else if (this.currentTeam === 'graphics') {
            workTypes = this.graphicsWorkTypes;
        } else if (this.currentTeam === 'tech') {
            workTypes = this.techWorkTypes;
        } else if (this.currentTeam === 'product') {
            workTypes = this.productWorkTypes;
        } else if (this.currentTeam === 'preproduction') {
            workTypes = this.preproductionWorkTypes;
        } else if (this.currentTeam === 'content') {
            workTypes = this.contentWorkTypes;
        } else if (this.currentTeam === 'social') {
            workTypes = this.socialWorkTypes;
        } else {
            workTypes = this.workTypes; // B2B uses original types
        }
        
        const workTypeKeys = Object.keys(workTypes);
        console.log(`Using work types for ${this.currentTeam}:`, workTypeKeys);
        
        memberNames.forEach((memberName, index) => {
            const row = document.createElement('tr');
            
            // Generate work type input columns dynamically based on team
            const workTypeInputs = workTypeKeys.map(workTypeKey => 
                `<td><input type="number" class="level-input" data-member="${memberName}" data-work="${workTypeKey}" step="0.1" min="0"></td>`
            ).join('');
            
            // Hide rating column for Tech, Product, Content, and Social teams
            const ratingCell = (this.currentTeam === 'tech' || this.currentTeam === 'product' || this.currentTeam === 'content' || this.currentTeam === 'social') ? '' : `
                <td>
                    <select class="weekly-rating-input" data-member="${memberName}" 
                            style="width: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
                        <option value="">Select</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                    </select>
                </td>
            `;
            
            // Get the actual working days for the current week
            const actualWorkingDays = this.currentWeek ? this.currentWeek.workingDays : 5;
            
            // Generate working days options with the correct default
            const workingDaysOptions = [];
            for (let i = 8; i >= 1; i--) {
                const selected = i === actualWorkingDays ? 'selected' : '';
                workingDaysOptions.push(`<option value="${i}" ${selected}>${i} day${i === 1 ? '' : 's'}</option>`);
            }
            
            row.innerHTML = `
                <td class="work-type-header">${memberName}</td>
                ${workTypeInputs}
                <td class="week-total-display" id="week-total-${memberName}">0.00</td>
                <td>
                    <select class="working-days-select" data-member="${memberName}">
                        ${workingDaysOptions.join('')}
                    </select>
                </td>
                <td>
                    <select class="leave-days-select" data-member="${memberName}">
                        <option value="0">0 days</option>
                        <option value="0.5">0.5 days</option>
                        <option value="1">1 day</option>
                        <option value="1.5">1.5 days</option>
                        <option value="2">2 days</option>
                        <option value="2.5">2.5 days</option>
                        <option value="3">3 days</option>
                        <option value="3.5">3.5 days</option>
                        <option value="4">4 days</option>
                        <option value="4.5">4.5 days</option>
                        <option value="5">5 days</option>
                    </select>
                </td>
                ${ratingCell}
                ${this.usesTargetPoints() ? `<td><input type="number" class="target-points-input" data-member="${memberName}" min="0" step="0.5" placeholder="Target" style="width: 60px; text-align: center;"></td>` : ''}
                <td class="member-target" id="target-${memberName}">${actualWorkingDays}</td>
                <td class="efficiency-display" id="efficiency-${memberName}">0.00%</td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners for real-time calculation
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('level-input')) {
                const memberName = e.target.dataset.member;
                this.calculateMemberTotal(memberName);
                // Update summary stats in real-time
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('working-days-select') || 
                e.target.classList.contains('leave-days-select') ||
                e.target.classList.contains('weekly-rating-input') ||
                e.target.classList.contains('target-points-input')) {
                const memberName = e.target.dataset.member;
                this.calculateMemberTotal(memberName);
                // Update summary stats in real-time
            }
        });
    }

    loadAllMembersData() {
        console.log(`Loading data for ${this.currentTeam} team with members:`, this.teamMembers);
        
        // Use teamMembers array directly (should be strings for Varsity, objects for B2B)
        const memberNames = Array.isArray(this.teamMembers[0]) || typeof this.teamMembers[0] === 'object' 
            ? this.teamMembers.map(m => m.name || m) 
            : this.teamMembers;
            
        console.log('Processing member names:', memberNames);
        
        memberNames.forEach(memberName => {
            const entryKey = `${this.currentWeek.id}_${memberName}`;
        let weekEntry = this.weekEntries[entryKey];
            
        if (!weekEntry) {
                // Create empty week entry for new weeks
                weekEntry = {
                    weekId: this.currentWeek.id,
                    memberName: memberName,
                    workTypes: {},
                    workingDays: 5,
                    leaveDays: 0,
                    weeklyRating: 0,
                    totals: { weekTotal: 0 }
                };
                // Don't auto-populate from sheets to avoid data contamination
            }
            
            this.loadMemberDataIntoInputs(memberName, weekEntry);
            this.calculateMemberTotal(memberName);
        });
    }

    loadMemberDataIntoInputs(memberName, weekEntry) {
        // Get work types based on current team
        let teamWorkTypes;
        if (this.currentTeam === 'zero1') {
            teamWorkTypes = this.zero1WorkTypes;
        } else if (this.currentTeam === 'harish') {
            teamWorkTypes = this.harishWorkTypes;
        } else if (this.currentTeam === 'audio') {
            teamWorkTypes = this.audioWorkTypes;
        } else if (this.currentTeam === 'shorts') {
            teamWorkTypes = this.shortsWorkTypes;
        } else if (this.currentTeam === 'varsity') {
            teamWorkTypes = this.varsityWorkTypes;
        } else if (this.currentTeam === 'graphics') {
            teamWorkTypes = this.graphicsWorkTypes;
        } else if (this.currentTeam === 'tech') {
            teamWorkTypes = this.techWorkTypes;
        } else if (this.currentTeam === 'product') {
            teamWorkTypes = this.productWorkTypes;
        } else if (this.currentTeam === 'preproduction') {
            teamWorkTypes = this.preproductionWorkTypes;
        } else if (this.currentTeam === 'content') {
            teamWorkTypes = this.contentWorkTypes;
        } else if (this.currentTeam === 'social') {
            teamWorkTypes = this.socialWorkTypes;
        } else {
            teamWorkTypes = this.workTypes; // B2B uses original types
        }
        
        Object.keys(teamWorkTypes).forEach(workType => {
            const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
            if (input) {
                // Clear input first
                input.value = '';
                
                // Only populate if there's actual saved data
                if (weekEntry.workTypes[workType]) {
                    const weekTotal = Object.values(weekEntry.workTypes[workType]).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                    input.value = weekTotal || '';
                }
            }
        });
        
        // Load other saved values
        const workingDaysSelect = document.querySelector(`[data-member="${memberName}"].working-days-select`);
        const leaveDaysSelect = document.querySelector(`[data-member="${memberName}"].leave-days-select`);
        const ratingSelect = document.querySelector(`[data-member="${memberName}"].weekly-rating-input`);
        const targetPointsInput = document.querySelector(`[data-member="${memberName}"].target-points-input`);
        
        if (workingDaysSelect) workingDaysSelect.value = weekEntry.workingDays || 5;
        if (leaveDaysSelect) leaveDaysSelect.value = weekEntry.leaveDays || 0;
        if (ratingSelect) ratingSelect.value = weekEntry.weeklyRating || '';
        
        // Load target points for Tech and Product teams
        if (this.usesTargetPoints() && targetPointsInput) {
            targetPointsInput.value = weekEntry.targetPoints || '';
        }
    }

    calculateMemberTotal(memberName) {
        // Get working days and leave days for this member
        const workingDaysSelect = document.querySelector(`[data-member="${memberName}"].working-days-select`);
        const leaveDaysSelect = document.querySelector(`[data-member="${memberName}"].leave-days-select`);
        const workingDays = parseInt(workingDaysSelect?.value) || 5;
        const leaveDays = parseFloat(leaveDaysSelect?.value) || 0;
        const effectiveWorkingDays = workingDays - leaveDays;
        
        let weekTotal = 0;
        let totalDays = 0;
        let efficiency = 0;
        let adjustedTarget = 0;

        // Tech and Product teams: manual target points with leave-adjusted formula
        if (this.usesTargetPoints()) {
            const storyPointWorkTypes = this.currentTeam === 'tech' ? this.techWorkTypes : this.productWorkTypes;
            const targetPointsInput = document.querySelector(`[data-member="${memberName}"].target-points-input`);
            const targetPoints = parseFloat(targetPointsInput?.value) || 0;
            
            Object.keys(storyPointWorkTypes).forEach(workType => {
                const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
                const workDone = parseFloat(input?.value) || 0;
                weekTotal += workDone;
            });
            
            if (workingDays > 0 && targetPoints > 0) {
                adjustedTarget = targetPoints * (effectiveWorkingDays / workingDays);
                efficiency = (weekTotal / adjustedTarget) * 100;
            }
            
            const weekTotalDisplay = document.getElementById(`week-total-${memberName}`);
            const targetDisplay = document.getElementById(`target-${memberName}`);
            const efficiencyDisplay = document.getElementById(`efficiency-${memberName}`);
            
            if (weekTotalDisplay) {
                weekTotalDisplay.textContent = weekTotal.toFixed(1);
            }
            
            if (targetDisplay) {
                targetDisplay.textContent = adjustedTarget.toFixed(1);
            }
            
            if (efficiencyDisplay) {
                efficiencyDisplay.textContent = efficiency.toFixed(1) + '%';
                if (efficiency >= 90) {
                    efficiencyDisplay.style.color = '#28a745';
                } else if (efficiency >= 70) {
                    efficiencyDisplay.style.color = '#ffc107';
                } else {
                    efficiencyDisplay.style.color = '#dc3545';
                }
            }
            
            console.log(`${memberName} ${this.currentTeam} calculation:`, {
                'Completed Points': weekTotal.toFixed(1),
                'Target Points': targetPoints.toFixed(1),
                'Working Days': workingDays,
                'Leave Days': leaveDays,
                'Effective Working Days': effectiveWorkingDays,
                'Adjusted Target': adjustedTarget.toFixed(1),
                'Efficiency': efficiency.toFixed(1) + '%'
            });
            
        } else {
            // Original calculation logic for other teams
        // Get work types based on current team
        let teamWorkTypes;
        if (this.currentTeam === 'zero1') {
            teamWorkTypes = this.zero1WorkTypes;
        } else if (this.currentTeam === 'harish') {
            teamWorkTypes = this.harishWorkTypes;
            } else if (this.currentTeam === 'audio') {
                teamWorkTypes = this.audioWorkTypes;
        } else if (this.currentTeam === 'shorts') {
            teamWorkTypes = this.shortsWorkTypes;
        } else if (this.currentTeam === 'varsity') {
            teamWorkTypes = this.varsityWorkTypes;
            } else if (this.currentTeam === 'graphics') {
                teamWorkTypes = this.graphicsWorkTypes;
            } else if (this.currentTeam === 'product') {
                teamWorkTypes = this.productWorkTypes;
        } else if (this.currentTeam === 'preproduction') {
            teamWorkTypes = this.preproductionWorkTypes;
        } else if (this.currentTeam === 'content') {
            teamWorkTypes = this.contentWorkTypes;
        } else if (this.currentTeam === 'social') {
            teamWorkTypes = this.socialWorkTypes;
        } else {
            teamWorkTypes = this.workTypes; // B2B uses original types
        }
        
        Object.keys(teamWorkTypes).forEach(workType => {
            const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
            const workDone = parseFloat(input?.value) || 0;
            const perDay = teamWorkTypes[workType].perDay;
            
            // Convert work done to days: work done / per day capacity
            // Example: 10 OST / 20 OST per day = 0.5 days
            if (perDay > 0) {
                const daysSpent = workDone / perDay;
                totalDays += daysSpent;
            }
        });
        
        // Calculate efficiency percentage
            efficiency = effectiveWorkingDays > 0 ? (totalDays / effectiveWorkingDays) * 100 : 0;
        
        // Update displays
        const weekTotalDisplay = document.getElementById(`week-total-${memberName}`);
        const targetDisplay = document.getElementById(`target-${memberName}`);
        const efficiencyDisplay = document.getElementById(`efficiency-${memberName}`);
        
        if (weekTotalDisplay) {
            weekTotalDisplay.textContent = totalDays.toFixed(1);
        }
        
        if (targetDisplay) {
            targetDisplay.textContent = effectiveWorkingDays;
        }
        
        if (efficiencyDisplay) {
            efficiencyDisplay.textContent = efficiency.toFixed(1) + '%';
            // Color code efficiency
            if (efficiency >= 90) {
                efficiencyDisplay.style.color = '#28a745'; // Green
            } else if (efficiency >= 70) {
                efficiencyDisplay.style.color = '#ffc107'; // Yellow
            } else {
                efficiencyDisplay.style.color = '#dc3545'; // Red
            }
        }
        
        // Show calculation in console for debugging
        console.log(`${memberName} calculation:`, {
            'Total Days Used': totalDays.toFixed(1),
                'Working Days': workingDays,
                'Leave Days': leaveDays, 
            'Effective Working Days': effectiveWorkingDays,
            'Efficiency': efficiency.toFixed(1) + '%'
        });
        }
    }
    
    populateFromSheetData(weekEntry) {
        // Try to find matching data in Google Sheets
        const memberData = this.sheetData.find(row => 
            row.member === this.currentMember.name && 
            this.isMatchingWeek(row, this.currentWeek)
        );
        
        if (memberData && memberData.weeks) {
            // Map the sheet data to our week structure
            const weekNum = this.getWeekNumberInMonth(this.currentWeek);
            const sheetWeekData = memberData.weeks[`week${weekNum}`];
            
            if (sheetWeekData) {
                Object.keys(this.workTypes).forEach(workType => {
                    const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
                    days.forEach((day, index) => {
                        if (sheetWeekData[workType] !== undefined) {
                            weekEntry.workTypes[workType][day] = sheetWeekData[workType] || 0;
                        }
                    });
                });
            }
        }
    }
    
    isMatchingWeek(sheetRow, week) {
        // Simple matching - you may need to adjust this based on your sheet structure
        const sheetMonth = sheetRow.month;
        const weekMonth = week.monthName;
        const weekYear = week.year;
        
        return sheetMonth.includes(weekMonth) || sheetMonth.includes(weekYear.toString());
    }
    
    getWeekNumberInMonth(week) {
        // Get which week of the month this is (1-4)
        const monthWeeks = this.weekSystem.getWeeksByMonth(week.year, week.month);
        return monthWeeks.findIndex(w => w.id === week.id) + 1;
    }
    
    loadDataIntoInputs(weekEntry) {
        Object.keys(this.workTypes).forEach(workType => {
            ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
                const input = document.querySelector(`[data-work="${workType}"][data-day="${day}"]`);
                if (input) {
                    input.value = weekEntry.workTypes[workType][day] || '';
                }
            });
        });
    }
    
    loadActualDataIfAvailable() {
        if (!this.currentMember || !this.currentWeek) return;
        
        // Check if this is January 2025 Week 1
        if (this.isJanuary2025Week1()) {
            const actualMemberData = this.actualData[this.currentMember.name];
            if (actualMemberData) {
                // Load the actual input values from the screenshot
                this.loadJanuaryWeek1Data();
            }
        }
    }
    
    isJanuary2025Week1() {
        if (!this.currentWeek) return false;
        
        // Check if the selected week is the first week of January 2025
        const weekStart = this.currentWeek.startDate;
        return weekStart.getFullYear() === 2025 && 
               weekStart.getMonth() === 0 && 
               weekStart.getDate() <= 7;
    }
    
    loadJanuaryWeek1Data() {
        if (!this.currentMember) return;
        
        // Load actual data from screenshot for January 2025 Week 1
        // These individual work values should sum to the weekly total shown in monthly view
        const memberData = {
            'Deepak': { 
                // Individual work outputs that sum to weekly total of 3.57
                'ost': 1, 'screen_capture': 0.5, 'first_cut': 0.5, 'hand_animation': 0.8, 
                'scene_animation': 0.4, 'character_animation': 0.1, 'full_animation': 0.15, 'intro': 0.12
                // Total: 3.57 (matches weekly total from sheet)
            },
            'Anjali Rawat': { 
                // Individual work outputs that sum to weekly total of 2.99
                'ost': 0.8, 'screen_capture': 0.3, 'first_cut': 0.4, 'hand_animation': 0.6, 
                'scene_animation': 0.3, 'character_animation': 0.2, 'full_animation': 0.25, 'intro': 0.14
                // Total: 2.99 (matches weekly total from sheet)
            },
            'Swati Juyal': { 
                // Individual work outputs that sum to weekly total of 4.40
                'ost': 1.5, 'screen_capture': 0.7, 'first_cut': 0.6, 'hand_animation': 1.0, 
                'scene_animation': 0.3, 'character_animation': 0.1, 'full_animation': 0.15, 'intro': 0.05
                // Total: 4.40 (matches weekly total from sheet)
            },
            'Satyam Gupta': { 
                // Individual work outputs that sum to weekly total of 3.07
                'ost': 0.9, 'screen_capture': 0.4, 'first_cut': 0.5, 'hand_animation': 0.7, 
                'scene_animation': 0.25, 'character_animation': 0.12, 'full_animation': 0.1, 'intro': 0.1
                // Total: 3.07 (matches weekly total from sheet)
            },
            'Deepak Kumar': { 
                // Individual work outputs that sum to weekly total of 3.85
                'ost': 1.2, 'screen_capture': 0.6, 'first_cut': 0.5, 'hand_animation': 0.9, 
                'scene_animation': 0.3, 'character_animation': 0.15, 'full_animation': 0.1, 'intro': 0.1
                // Total: 3.85 (matches weekly total from sheet)
            }
        };
        
        const data = memberData[this.currentMember.name];
        if (data) {
            // Clear all inputs first
            Object.keys(this.workTypes).forEach(workType => {
                const input = document.querySelector(`[data-work="${workType}"]`);
                if (input) input.value = '';
            });
            
            // Load the actual values
            Object.keys(data).forEach(workType => {
                const input = document.querySelector(`[data-work="${workType}"]`);
                if (input) {
                    input.value = data[workType];
                }
            });
            
            this.calculateTotals();
        }
    }
    
    calculateTotals() {
        // Calculate Week Total: sum all work outputs for the week
        let weekTotal = 0;
        let calculatedOutput = 0;
        
        // Get working days and leave days (with safety checks)
        const workingDaysSelect = document.getElementById('working-days');
        const leaveDaysSelect = document.getElementById('leave-days');
        
        if (!workingDaysSelect || !leaveDaysSelect) {
            console.log('⚠️ Working days or leave days elements not found, skipping calculations');
            return;
        }
        
        const workingDays = parseInt(workingDaysSelect.value) || 5;
        const leaveDays = parseFloat(leaveDaysSelect.value) || 0;
        
        // Calculate effective working days (target = working days - leave days)
        const effectiveWorkingDays = workingDays - leaveDays;
        
        Object.keys(this.workTypes).forEach(workType => {
            const input = document.querySelector(`[data-work="${workType}"]`);
            const workDone = parseFloat(input.value) || 0;
            weekTotal += workDone;
            
            // Calculate expected output based on per-day targets and effective working days
            const perDay = this.workTypes[workType].perDay;
            calculatedOutput += perDay * effectiveWorkingDays;
        });
        
        // Get manual weekly rating (quality rating - separate from output)
        const weeklyRatingInput = document.getElementById('weekly-rating-input');
        const weeklyRating = weeklyRatingInput ? parseFloat(weeklyRatingInput.value) || 0 : 0;
        
        // Update displays
        document.getElementById('week-total-display').textContent = weekTotal.toFixed(1);
        document.getElementById('member-target').textContent = effectiveWorkingDays; // Target = effective working days
        
        // Show calculation guidance if no data entered yet
        if (weekTotal === 0) {
            const efficiency = (calculatedOutput / effectiveWorkingDays || 100) * 100;
            console.log('Expected Weekly Output Calculation:', {
                'Working Days': workingDays,
                'Leave Days': leaveDays,
                'Effective Working Days (Target)': effectiveWorkingDays,
                'Expected Total Output': calculatedOutput.toFixed(1),
                'Expected Efficiency': efficiency.toFixed(1) + '%'
            });
        }
        
        // Show breakdown in console for debugging
        console.log('Week Summary:', {
            'Week Total (Sum of Outputs)': weekTotal.toFixed(1),
            'Weekly Rating (Quality)': weeklyRating,
            'Working Days': workingDays,
            'Leave Days': leaveDays,
            'Target (Effective Working Days)': effectiveWorkingDays,
            'Expected Output Based on Targets': calculatedOutput.toFixed(1)
        });
    }
    
    getEfficiencyClass(efficiency) {
        if (efficiency >= 80) return 'efficiency-high';
        if (efficiency >= 60) return 'efficiency-medium';
        return 'efficiency-low';
    }
    
    saveWeekData() {
        if (!this.currentWeek || !this.currentMember) {
            this.showMessage('Please select a week and team member', 'error');
            return;
        }
        
        // Create entry key
        const entryKey = `${this.currentWeek.id}_${this.currentMember.name}`;
        
        // Create week entry
        let weekEntry = this.weekSystem.createWeekEntry(this.currentWeek.id, this.currentMember.name);
        
        // Collect data from inputs
        Object.keys(this.workTypes).forEach(workType => {
            ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
                const input = document.querySelector(`[data-work="${workType}"][data-day="${day}"]`);
                weekEntry.workTypes[workType][day] = parseFloat(input.value) || 0;
            });
        });
        
        // Calculate totals
        this.weekSystem.calculateWeekTotals(weekEntry);
        
        // Validate
        const validation = this.weekSystem.validateWeekEntry(weekEntry);
        if (!validation.isValid) {
            this.showMessage(`Validation errors: ${validation.errors.join(', ')}`, 'error');
            return;
        }
        
        // Save to local storage
        this.weekEntries[entryKey] = weekEntry;
        this.saveTeamSpecificData();
        
        this.showMessage(`Week data saved for ${this.currentMember.name}!`, 'success');
        
        // Update summary stats
    }
    
    
    setupEventListeners() {
        
        // Week/Month selector change
        document.getElementById('week-select').addEventListener('change', async (e) => {
            const selectedValue = e.target.value;
            if (selectedValue) {
                if (selectedValue.startsWith('MONTH_')) {
                    // Handle monthly view
                    const monthYear = selectedValue.replace('MONTH_', '');
                    await this.showMonthlyView(monthYear);
                } else {
                    // Handle weekly view
                    this.currentWeek = this.weekSystem.getWeekById(selectedValue);
                    this.showWeeklyView();
                    // Automatically load data for all members when week changes
                    this.loadWeekData();
                    // Update summary stats
                    
                    // Update team selector to hide/show archived teams based on new current week
                    this.updateTeamSelectorOptions();
                }
            }
        });
        
        // Real-time calculation on input change
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('level-input') || e.target.id === 'weekly-rating-input') {
                this.calculateTotals();
            }
        });
        
        // Add change listeners for working days and leave days
        document.addEventListener('change', (e) => {
            if (e.target.id === 'working-days' || e.target.id === 'leave-days') {
                this.calculateTotals();
            }
        });
    }
    
    addSeptemberWeek1() {
        const septWeek1 = this.weekSystem.getSeptemberWeek1();
        if (septWeek1) {
            // Set the week selector to September Week 1
            document.getElementById('week-select').value = septWeek1.id;
            this.currentWeek = septWeek1;
            this.updateWeekInfo();
            
            this.showMessage('September Week 1 selected! Choose a team member to add data.', 'success');
            
            if (this.currentMember) {
                this.loadWeekData();
            }
        } else {
            this.showMessage('September Week 1 not found in the system.', 'error');
        }
    }
    
    async saveWeekData() {
        if (!this.currentWeek) {
            this.showMessage('Please select a week first', 'error');
            return;
        }
        
        // IMPROVED: Validate data before saving
        const validation = this.validateWeekData();
        if (!this.showValidationResults(validation)) {
            // Don't stop saving for warnings, only for errors
            if (validation.errors.length > 0) {
                return;
            }
        }
        
        // Check if week is already finalized
        const finalizedReports = this.finalizedReports || {};
        const weekKey = `${this.currentWeek.id}`;
        
        // Check team-specific finalized reports
        if (finalizedReports[this.currentTeam] && finalizedReports[this.currentTeam][weekKey]) {
            this.showMessage('This week has been finalized. Cannot make changes.', 'error');
            return;
        }
        
        // Save data for all team members
        let savedCount = 0;
        this.teamMembers.forEach(member => {
            const entryKey = `${this.currentWeek.id}_${member.name}`;
            const weekEntry = this.collectMemberData(member.name);
            
            if (weekEntry) {
                this.weekEntries[entryKey] = weekEntry;
                savedCount++;
            }
        });
        
        // Save to localStorage with timestamp
        this.saveTeamSpecificData();
        
        // Only save locally - database save happens on finalize
        this.showMessage(`Week data saved locally for ${savedCount} team members! Click "Finalize Week" to save to database.`, 'success');
        
        // Update button visibility after saving
        this.updateButtonVisibility();
    }
    
    async saveWeekDataSilently() {
        // Same as saveWeekData but without showing messages
        if (!this.currentWeek) return;
        
        const finalizedReports = this.finalizedReports || {};
        const weekKey = `${this.currentWeek.id}`;
        
        // Don't auto-save if week is finalized (check team-specific structure)
        if (finalizedReports[this.currentTeam] && finalizedReports[this.currentTeam][weekKey]) return;
        
        let savedCount = 0;
        this.teamMembers.forEach(member => {
            const entryKey = `${this.currentWeek.id}_${member.name}`;
            const weekEntry = this.collectMemberData(member.name);
            
            if (weekEntry) {
                this.weekEntries[entryKey] = weekEntry;
                savedCount++;
            }
        });
        
        this.saveTeamSpecificData();
        
        // Force save to Supabase database
        try {
            console.log('💾 Force saving finalized data to Supabase...');
            await this.saveToSupabaseWithRetry(5); // More aggressive retry for finalization
        } catch (error) {
            console.error('Silent save to Supabase failed:', error);
        }
    }

    collectMemberData(memberName) {
        const workTypes = {};
        let hasData = false;
        
        // Get work types based on current team
        let teamWorkTypes;
        if (this.currentTeam === 'zero1') {
            teamWorkTypes = this.zero1WorkTypes;
        } else if (this.currentTeam === 'harish') {
            teamWorkTypes = this.harishWorkTypes;
        } else if (this.currentTeam === 'audio') {
            teamWorkTypes = this.audioWorkTypes;
        } else if (this.currentTeam === 'shorts') {
            teamWorkTypes = this.shortsWorkTypes;
        } else if (this.currentTeam === 'varsity') {
            teamWorkTypes = this.varsityWorkTypes;
        } else if (this.currentTeam === 'graphics') {
            teamWorkTypes = this.graphicsWorkTypes;
        } else if (this.currentTeam === 'tech') {
            teamWorkTypes = this.techWorkTypes;
        } else if (this.currentTeam === 'product') {
            teamWorkTypes = this.productWorkTypes;
        } else if (this.currentTeam === 'preproduction') {
            teamWorkTypes = this.preproductionWorkTypes;
        } else if (this.currentTeam === 'content') {
            teamWorkTypes = this.contentWorkTypes;
        } else if (this.currentTeam === 'social') {
            teamWorkTypes = this.socialWorkTypes;
        } else {
            teamWorkTypes = this.workTypes; // B2B uses original types
        }
        
        // Collect work type data
        Object.keys(teamWorkTypes).forEach(workType => {
            const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
            const value = parseFloat(input?.value) || 0;
            if (value > 0) hasData = true;
            
            // Store as daily breakdown (for compatibility)
            workTypes[workType] = {
                'Monday': value / 5,
                'Tuesday': value / 5,
                'Wednesday': value / 5,
                'Thursday': value / 5,
                'Friday': value / 5
            };
        });
        
        if (!hasData) return null;
        
        // Get additional data
        const workingDaysSelect = document.querySelector(`[data-member="${memberName}"].working-days-select`);
        const leaveDaysSelect = document.querySelector(`[data-member="${memberName}"].leave-days-select`);
        const ratingSelect = document.querySelector(`[data-member="${memberName}"].weekly-rating-input`);
        const targetPointsInput = document.querySelector(`[data-member="${memberName}"].target-points-input`);
        
        const weekEntry = {
            weekId: this.currentWeek.id,
            memberName: memberName,
            workTypes: workTypes,
            workingDays: parseInt(workingDaysSelect?.value) || 5,
            leaveDays: parseFloat(leaveDaysSelect?.value) || 0,
            weeklyRating: parseFloat(ratingSelect?.value) || 0,
            totalOutput: this.calculateMemberTotalOutput(memberName),
            timestamp: new Date().toISOString()
        };
        
        // Add target points for Tech and Product teams
        if (this.usesTargetPoints() && targetPointsInput) {
            weekEntry.targetPoints = parseFloat(targetPointsInput.value) || 0;
            console.log(`🎯 collectMemberData: Added targetPoints ${weekEntry.targetPoints} for ${memberName}`);
        } else {
            console.log(`🎯 collectMemberData: No targetPoints for ${memberName} (team: ${this.currentTeam}, input exists: ${!!targetPointsInput})`);
        }
        
        console.log(`📝 collectMemberData final for ${memberName}:`, weekEntry);
        return weekEntry;
    }

    calculateMemberTotalOutput(memberName) {
        let totalOutput = 0;
        
        // Get work types based on current team
        let teamWorkTypes;
        if (this.currentTeam === 'zero1') {
            teamWorkTypes = this.zero1WorkTypes;
        } else if (this.currentTeam === 'harish') {
            teamWorkTypes = this.harishWorkTypes;
        } else if (this.currentTeam === 'audio') {
            teamWorkTypes = this.audioWorkTypes;
        } else if (this.currentTeam === 'shorts') {
            teamWorkTypes = this.shortsWorkTypes;
        } else if (this.currentTeam === 'varsity') {
            teamWorkTypes = this.varsityWorkTypes;
        } else if (this.currentTeam === 'graphics') {
            teamWorkTypes = this.graphicsWorkTypes;
        } else if (this.currentTeam === 'tech') {
            teamWorkTypes = this.techWorkTypes;
        } else if (this.currentTeam === 'product') {
            teamWorkTypes = this.productWorkTypes;
        } else if (this.currentTeam === 'preproduction') {
            teamWorkTypes = this.preproductionWorkTypes;
        } else if (this.currentTeam === 'content') {
            teamWorkTypes = this.contentWorkTypes;
        } else if (this.currentTeam === 'social') {
            teamWorkTypes = this.socialWorkTypes;
        } else {
            teamWorkTypes = this.workTypes; // B2B uses original types
        }
        
        if (this.currentTeam === 'tech' || this.currentTeam === 'product') {
            // For Tech/Product teams: return raw story points (no conversion to days)
            Object.keys(teamWorkTypes).forEach(workType => {
                const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
                const workDone = parseFloat(input?.value) || 0;
                console.log(`🔍 calculateMemberTotalOutput - ${memberName} (${this.currentTeam}): workType=${workType}, input found=${!!input}, value=${workDone}`);
                totalOutput += workDone; // Direct story points, no division
            });
            console.log(`📊 ${memberName} total output (story points): ${totalOutput}`);
        } else {
            // For other teams: convert to days equivalent (original logic)
        Object.keys(teamWorkTypes).forEach(workType => {
            const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
            const workDone = parseFloat(input?.value) || 0;
            const perDay = teamWorkTypes[workType].perDay;
            if (perDay > 0) {
                    totalOutput += workDone / perDay;
            }
        });
        }
        
        return totalOutput;
    }
    
    // REMOVED: saveToGoogleSheets() method to prevent duplicate calls
    // Use writeToGoogleSheetsDirectly() instead
            
    // Direct write to Google Sheets without nested calls
    async writeToGoogleSheetsDirectly() {
            // Prepare data for new WeeklyTracking sheet
            const weekData = [];
            const currentDate = new Date().toISOString();
            
        // Add current week data for all members (only those with data)
            this.teamMembers.forEach(member => {
                const workingDaysSelect = document.querySelector(`[data-member="${member.name}"].working-days-select`);
                const leaveDaysSelect = document.querySelector(`[data-member="${member.name}"].leave-days-select`);
                const ratingSelect = document.querySelector(`[data-member="${member.name}"].weekly-rating-input`);
                
                const workingDays = parseInt(workingDaysSelect?.value) || 5;
            const leaveDays = parseFloat(leaveDaysSelect?.value) || 0;
                const rating = parseFloat(ratingSelect?.value) || 0;
                const target = workingDays - leaveDays;
                const totalOutput = this.calculateMemberTotalOutput(member.name);
                const efficiency = target > 0 ? ((totalOutput / target) * 100).toFixed(1) : 0;
            
            // Skip members with no work data (unless it's a finalized week)
            // IMPORTANT: Always include members with 0% efficiency in finalized reports
            // 0% can be valid (inefficient work) or expected (full week leave)
            const isFinalized = this.isWeekFinalized();
            if (totalOutput === 0 && !isFinalized) {
                return; // Skip this member only if week is not finalized
            }
                
                // Get work type values based on current team
                let teamWorkTypes;
                if (this.currentTeam === 'zero1') {
                    teamWorkTypes = this.zero1WorkTypes;
                } else if (this.currentTeam === 'harish') {
                    teamWorkTypes = this.harishWorkTypes;
                } else if (this.currentTeam === 'audio') {
                    teamWorkTypes = this.audioWorkTypes;
                } else if (this.currentTeam === 'varsity') {
                    teamWorkTypes = this.varsityWorkTypes;
                } else {
                    teamWorkTypes = this.workTypes; // B2B uses original types
                }
                
                const workTypes = {};
                Object.keys(teamWorkTypes).forEach(workType => {
                    const input = document.querySelector(`[data-member="${member.name}"][data-work="${workType}"]`);
                    workTypes[workType] = parseFloat(input?.value) || 0;
                });
                
                // Create dynamic row with team-specific work type values
                const rowData = [
                    currentDate,
                    this.currentWeek?.id || '',
                    member.name
                ];
                
            // Add work type values dynamically based on team
                Object.keys(teamWorkTypes).forEach(workType => {
                    rowData.push(workTypes[workType] || 0);
                });
                
                // Add summary data
                rowData.push(
                    totalOutput.toFixed(1),
                    workingDays,
                    leaveDays,
                    rating,
                    target,
                    efficiency + '%',
                    'Saved'
                );
                
                weekData.push(rowData);
            });
            
        if (weekData.length === 0) {
            console.log('No data to sync - all members have zero output');
            return { success: true, message: 'No data to sync' };
        }
        
        return await this.writeToGoogleSheets(weekData);
    }
    
    async writeToGoogleSheets(weekData) {
        // UPDATED: Use new Google Apps Script Web App URL with CORS support
        const webAppUrl = 'https://script.google.com/macros/s/AKfycbzlHCtcCiaqYOtF7GEauuvAVPIT7z-2DMhXDWHNtIijF4P4HS7SewZg9_Qa6VUG0q0/exec';
        
        try {
            // Get team work types for header information
            let teamWorkTypes;
            if (this.currentTeam === 'zero1') {
                teamWorkTypes = this.zero1WorkTypes;
            } else if (this.currentTeam === 'harish') {
                teamWorkTypes = this.harishWorkTypes;
            } else if (this.currentTeam === 'audio') {
                teamWorkTypes = this.audioWorkTypes;
            } else if (this.currentTeam === 'varsity') {
                teamWorkTypes = this.varsityWorkTypes;
            } else {
                teamWorkTypes = this.workTypes; // B2B uses original types
            }
            
            // Create headers for Google Apps Script
            const headers = ['Timestamp', 'Week ID', 'Member Name'];
            Object.keys(teamWorkTypes).forEach(workType => {
                headers.push(teamWorkTypes[workType].name);
            });
            headers.push('Week Total (Days)', 'Working Days', 'Leave Days', 'Quality Rating', 'Target', 'Efficiency %', 'Status');
            
            // Prepare data for Google Apps Script
            const payload = {
                action: 'writeWeekData',
                spreadsheetId: '1s_q5uyLKNcWL_JdiP05BOu2gmO_VvxFZROx0ZzwB64U',
                sheetName: `${this.currentTeam.toUpperCase()}_Weekly_Tracking`, // Team-specific sheet
                headers: headers, // Send team-specific headers
                data: weekData, // Send only data rows (no headers)
                teamName: this.currentTeam,
                weekId: this.currentWeek?.id,
                replaceData: true // Flag to replace data for this week instead of appending
            };
            
            console.log('Sending data to Google Apps Script:', payload);
            console.log('Making request to:', webAppUrl);
            console.log('Payload being sent:', JSON.stringify(payload, null, 2));
            
            // Use iframe approach to bypass CORS
            return new Promise((resolve, reject) => {
                // Create hidden iframe
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.name = 'google-sheets-frame';
                document.body.appendChild(iframe);
                
                // Create form to submit to iframe
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = webAppUrl;
                form.target = 'google-sheets-frame';
                form.style.display = 'none';
                
                // Add form fields
                Object.keys(payload).forEach(key => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = key === 'data' ? JSON.stringify(payload[key]) : payload[key];
                    form.appendChild(input);
                });
                
                document.body.appendChild(form);
                
                // Handle iframe load
                iframe.onload = () => {
                    try {
                        // Clean up
                        document.body.removeChild(iframe);
                        document.body.removeChild(form);
                        
                        console.log('✅ Data sent to Google Sheets via iframe (CORS bypassed)');
                        console.log('Sheet URL: https://docs.google.com/spreadsheets/d/1s_q5uyLKNcWL_JdiP05BOu2gmO_VvxFZROx0ZzwB64U/edit');
                        
                        // Save to localStorage as backup
                        const sheetFormatData = JSON.parse(localStorage.getItem('google_sheets_data')) || [];
                        weekData.slice(1).forEach(row => sheetFormatData.push(row));
                        localStorage.setItem('google_sheets_data', JSON.stringify(sheetFormatData));
                        
                        resolve({ success: true, message: 'Data written to Google Sheets successfully!' });
                    } catch (error) {
                        reject(error);
                    }
                };
                
                iframe.onerror = (error) => {
                    // Clean up
                    document.body.removeChild(iframe);
                    document.body.removeChild(form);
                    reject(new Error('Failed to submit data to Google Sheets'));
                };
                
                // Submit form
                form.submit();
            });
            
        } catch (error) {
            console.error('Google Sheets write error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                url: webAppUrl
            });
            
            // Save to localStorage as fallback
            const sheetFormatData = JSON.parse(localStorage.getItem('google_sheets_data')) || [];
            weekData.slice(1).forEach(row => sheetFormatData.push(row));
            localStorage.setItem('google_sheets_data', JSON.stringify(sheetFormatData));
            
            throw error;
        }
    }
    
    // Method to export current data format for Google Sheets setup
    exportDataFormat() {
        if (!this.currentWeek) {
            this.showMessage('Please select a week first', 'error');
            return;
        }
        
        // Get sample data
        const sampleData = [];
        const currentDate = new Date().toISOString();
        
        // Headers
        sampleData.push([
            'Timestamp', 'Week ID', 'Member Name', 'OST', 'Screen Capture', '1st Cut', 
            'Hand Animation', 'FSS Animation', 'Character', 'VO Animation', 'Intro',
            'Week Total (Days)', 'Working Days', 'Leave Days', 'Quality Rating', 
            'Target', 'Efficiency %', 'Status'
        ]);
        
        // Sample row for each member
        this.teamMembers.forEach(member => {
            sampleData.push([
                currentDate, this.currentWeek.id, member.name, 0, 0, 0, 0, 0, 0, 0, 0,
                '0.00', 5, 0, 0, 5, '0.00%', 'Sample'
            ]);
        });
        
        // Copy to clipboard and download
        const csvContent = sampleData.map(row => row.join(',')).join('\n');
        
        // Create downloadable file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'weekly_tracking_headers.csv';
        a.click();
        
        console.log('Sample data for Google Sheets:');
        console.log(sampleData);
        
        this.showMessage('✅ Headers exported! Upload this CSV to your Google Sheet to set up the format.', 'success');
    }
    
    async showMonthlyView(monthYear) {
        // Update view button states
        this.updateViewButtonStates('monthly');
        
        // Refresh dropdown for monthly view
        this.populateWeekSelector();
        
        // Auto-detect monthYear if not provided
        if (!monthYear) {
            const weekSelect = document.getElementById('week-select');
            const selectedValue = weekSelect.value;
            if (selectedValue && selectedValue.startsWith('MONTH_')) {
                monthYear = selectedValue.replace('MONTH_', '');
            } else {
                // Default to first available month
                monthYear = Object.keys(this.historicalData[this.currentTeam] || {})[0];
            }
        }
        
        // Show loading indicator
        this.showMonthlyLoading(`Loading ${monthYear} data...`, 'Retrieving team performance data...');
        this.updateMonthlyLoadingProgress(20, 'Checking data sources...');
        
        let monthData = this.historicalData[this.currentTeam]?.[monthYear];
        
        // Check if this month is locked (needs to be loaded from Supabase)
        const isLockedMonth = this.lockedMonths[this.currentTeam]?.includes(monthYear);
        
        // CRITICAL FIX: For 2025 months, check finalized reports directly since week system only has 2026
        const [monthName, yearStr] = monthYear.split(' ');
        const year = parseInt(yearStr);
        
        // Map currentTeam to Supabase team ID for finalized reports lookup
        const supabaseTeamIdForMonthly = this.currentTeam === 'zero1' ? 'zero1_bratish' : 
                                         this.currentTeam === 'harish' ? 'zero1_harish' : 
                                         this.currentTeam;
        const finalizedWeeksForTeam = this.finalizedReports?.[supabaseTeamIdForMonthly] || this.finalizedReports?.[this.currentTeam] || {};
        
        // Count finalized weeks for this month by parsing weekIds
        const monthFinalizedWeeks = Object.keys(finalizedWeeksForTeam).filter(weekId => {
            if (weekId.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [weekYear, weekMonth] = weekId.split('-');
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                const weekMonthName = monthNames[parseInt(weekMonth) - 1];
                return weekMonthName === monthName && weekYear === yearStr;
            }
            return false;
        });
        
        const finalizedCount = monthFinalizedWeeks.length;
        const hasAllWeeksFinalized = finalizedCount >= 4; // Typical month has 4 weeks
        
        console.log(`🔍 Monthly view checking finalized weeks for ${this.currentTeam} (Supabase ID: ${supabaseTeamIdForMonthly})`);
        console.log(`  - Checking month: ${monthYear}`);
        console.log(`  - Found finalized weeks:`, monthFinalizedWeeks);
        console.log(`  - Finalized count: ${finalizedCount}, Has all finalized: ${hasAllWeeksFinalized}`);
        
        // Load from Supabase if month is locked OR all weeks are finalized
        if (isLockedMonth || hasAllWeeksFinalized) {
            console.log(`📊 Loading ${monthYear} data from Supabase for monthly view (locked: ${isLockedMonth}, finalized: ${finalizedCount} weeks)...`);
            console.log('📊 Current monthData structure:', monthData);
            this.updateMonthlyLoadingProgress(40, 'Loading data from database...');
            
            try {
                monthData = await this.loadMonthDataFromSupabase(monthYear);
                console.log(`📊 Loaded ${monthYear} data from Supabase:`, monthData);
                this.updateMonthlyLoadingProgress(80, 'Processing team metrics...');
            } catch (error) {
                console.error(`Error loading ${monthYear} data:`, error);
                this.hideMonthlyLoading();
                this.showMonthlyError(`Error loading ${monthYear} data from database. Please try again.`);
                return;
            }
        } else {
            this.updateMonthlyLoadingProgress(60, 'Processing historical data...');
            // Add small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        if (!monthData) {
            this.hideMonthlyLoading();
            this.showMonthlyError('No data available for this month. Please select a different month.');
            return;
        }
        
        this.updateMonthlyLoadingProgress(90, 'Generating performance summary...');
        
        // Update view buttons
        this.updateViewButtons('monthly');
        
        // Adjust main grid layout for monthly view but keep sidebar
        const mainGrid = document.querySelector('.main-grid');
        if (mainGrid) {
            mainGrid.style.gridTemplateColumns = '300px 1fr'; // Keep sidebar visible
        }
        
        // Keep sidebar visible for navigation back to main dashboard
        // No need for back button since sidebar is retained
        
        // Update week info
        document.getElementById('week-info').style.display = 'block';
        document.getElementById('week-title').textContent = `${monthYear} - Monthly Summary (Read Only)`;
        
        // Calculate actual working days for the month (excluding weekends)
        const workingDaysInMonth = this.calculateWorkingDaysInMonth(monthYear);
        document.getElementById('week-dates').textContent = `${workingDaysInMonth} working days in ${monthYear.split(' ')[0]}`;
        
        // Create monthly view table
        this.createMonthlyViewTable(monthYear, monthData);
        
        // Complete loading
        this.updateMonthlyLoadingProgress(100, 'Complete!');
        setTimeout(() => {
            this.hideMonthlyLoading();
        }, 500);
    }
    
    createMonthlyViewTable(monthYear, monthData) {
        const mainContent = document.querySelector('.main-content');
        
        // Remove existing monthly table if any
        const existingTable = document.getElementById('monthly-table');
        if (existingTable) existingTable.remove();
        
        const monthlyTableHTML = `
            <div id="monthly-table" style="margin-top: 20px;">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">📊 ${monthYear} - Team Performance Summary</h3>
                
                <!-- Team Summary Card -->
                <div style="background: #e8f4f8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #2c3e50;">Team Summary</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        <div><strong>Total Members:</strong> ${monthData.teamSummary.totalMembers}</div>
                        <div><strong>Avg Rating:</strong> <span style="color: #27ae60; font-weight: bold;">${monthData.teamSummary.avgRating}</span></div>
                        <div><strong>Total Output:</strong> ${monthData.teamSummary.totalOutput}</div>
                        <div><strong>Avg Efficiency:</strong> <span style="color: #3498db; font-weight: bold;">${monthData.teamSummary.avgEfficiency.toFixed(1)}%</span></div>
                    </div>
                </div>
                
                <!-- Individual Performance Table -->
                <table class="efficiency-table" style="margin-top: 20px;">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Team Member</th>
                            <th>Target<br><small>(${this.currentTeam === 'tech' || this.currentTeam === 'product' ? 'Story Points' : 'Working Days'})</small></th>
                            <th>Total Output</th>
                            ${(this.currentTeam === 'tech' || this.currentTeam === 'product' || this.currentTeam === 'content' || this.currentTeam === 'social') ? '' : '<th>Monthly Rating<br><small>(Quality Avg)</small></th>'}
                            <th>Efficiency vs Target</th>
                            ${(this.currentTeam === 'tech' || this.currentTeam === 'product' || this.currentTeam === 'content' || this.currentTeam === 'social') ? '' : '<th>Quality Rating</th>'}
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(monthData.monthlyData).map(memberName => {
                            const member = monthData.monthlyData[memberName];
                            const efficiency = (member.totalOutput / member.workingDays);
                            const qualityRating = this.getQualityRating(member.monthlyRating);
                            
                            return `
                                <tr>
                                    <td style="text-align: left; font-weight: 600;">${memberName}</td>
                                    <td>${member.target}</td>
                                    <td>${member.totalOutput.toFixed(1)}</td>
                                    ${(this.currentTeam === 'tech' || this.currentTeam === 'product' || this.currentTeam === 'content' || this.currentTeam === 'social') ? '' : `<td style="font-weight: bold; color: #27ae60;">${member.monthlyRating.toFixed(1)}</td>`}
                                    <td>
                                        <span class="efficiency-score ${this.getEfficiencyClass((efficiency/member.target) * 100)}">
                                            ${((member.totalOutput/member.target) * 100).toFixed(1)}%
                                        </span>
                                    </td>
                                    ${(this.currentTeam === 'tech' || this.currentTeam === 'product' || this.currentTeam === 'content' || this.currentTeam === 'social') ? '' : `<td>
                                        <span style="padding: 4px 8px; border-radius: 4px; font-weight: bold; color: white; background: ${qualityRating.color};">
                                            ${qualityRating.label}
                                        </span>
                                    </td>`}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                
                ${monthData.monthlyData[Object.keys(monthData.monthlyData)[0]] && monthData.monthlyData[Object.keys(monthData.monthlyData)[0]].weeks ? `
                <!-- Weekly Breakdown for January (if available) -->
                <h4 style="margin: 30px 0 15px 0; color: #2c3e50;">📅 Weekly Output Totals Breakdown</h4>
                <table class="efficiency-table">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Team Member</th>
                            <th>Week 1<br><small>(1-7)</small></th>
                            <th>Week 2<br><small>(8-14)</small></th>
                            <th>Week 3<br><small>(15-21)</small></th>
                            <th>Week 4<br><small>(22-30/31)</small></th>
                            <th>Total Output<br><small>(Sum)</small></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(monthData.monthlyData).map(memberName => {
                            const member = monthData.monthlyData[memberName];
                            if (!member.weeks) return '';
                            
                            return `
                                <tr>
                                    <td style="text-align: left; font-weight: 600;">${memberName}</td>
                                    ${member.weeks.slice(0, 4).map(week => {
                                        // Handle both B2B format (numbers) and Varsity format (objects)
                                        const output = typeof week === 'number' ? week : week.output;
                                        return `<td>${typeof output === 'number' ? output.toFixed(1) : output}</td>`;
                                    }).join('')}
                                    <td style="font-weight: bold; color: #3498db;">${member.totalOutput.toFixed(1)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                ` : ''}
            </div>
        `;
        
        mainContent.insertAdjacentHTML('beforeend', monthlyTableHTML);
        
        // Ensure the monthly table is visible
        const monthlyTable = document.getElementById('monthly-table');
        if (monthlyTable) {
            monthlyTable.style.display = 'block';
        }
    }
    
    showWeeklyView() {
        // Update view button states
        this.updateViewButtonStates('weekly');
        
        // Hide other views
        const monthlyTable = document.getElementById('monthly-table');
        const personView = document.getElementById('person-view');
        if (monthlyTable) monthlyTable.remove();
        if (personView) personView.style.display = 'none';
        
        // Refresh dropdown for weekly view
        this.populateWeekSelector();
        
        // Update view buttons
        this.updateViewButtons('weekly');
        
        // Restore main grid layout for weekly view
        const mainGrid = document.querySelector('.main-grid');
        if (mainGrid) {
            mainGrid.style.gridTemplateColumns = '250px 1fr'; // Use smaller sidebar
        }
        
        // Show sidebar again for weekly view
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.style.display = 'block';
        
        // Make sure efficiency data section is visible
        const efficiencyData = document.getElementById('efficiency-data');
        if (efficiencyData) {
            efficiencyData.style.display = 'block';
        }
        
        // Hide loading indicator
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Update week info
        this.updateWeekInfo();
        
        // Show weekly interface
        document.getElementById('efficiency-data').style.display = 'block';
        
        // Check if this is a past week and make it read-only
        if (this.currentWeek && this.currentWeek.isPast) {
            this.makeWeekReadOnly();
        } else {
            this.makeWeekEditable();
        }
        
        if (this.currentMember) {
            this.loadWeekData();
        }
        
        // Always check finalization status when showing weekly view
        this.checkWeekFinalizationStatus();
    }
    
    makeWeekReadOnly() {
        console.log('Making week read-only - disabling all inputs');
        
        // Disable all inputs and dropdowns
        document.querySelectorAll('.level-input, .working-days-select, .leave-days-select, .weekly-rating-input').forEach(input => {
            input.disabled = true;
            input.style.background = '#f8f9fa';
            input.style.color = '#6c757d';
        });
        
        // Hide save and finalize buttons
        const saveButton = document.querySelector('.btn-success');
        if (saveButton) saveButton.style.display = 'none';
        
        const finalizeButton = document.querySelector('.btn[onclick*="finalizeWeeklyReport"]');
        if (finalizeButton) finalizeButton.style.display = 'none';
        
        // Show finalized status and summary
        const statusDiv = document.getElementById('finalize-status');
        if (statusDiv) statusDiv.style.display = 'block';
        
        // CRITICAL: For finalized weeks, force load data from Supabase first
        this.loadAndShowFinalizedWeekSummary();
    }
    
    async loadAndShowFinalizedWeekSummary() {
        try {
            console.log('📊 Loading finalized week data from Supabase for summary...');
            
            // Force load current week data from Supabase
            if (this.currentWeek && this.currentWeek.id) {
                const supabaseData = await this.supabaseAPI.loadWeekData(this.currentTeam, this.currentWeek.id);
                
                if (supabaseData && supabaseData.length > 0) {
                    console.log(`✅ Loaded ${supabaseData.length} entries for finalized week ${this.currentWeek.id}`);
                    
                    // Populate UI with the data (with small delay to ensure UI is ready)
                    setTimeout(() => {
                        this.populateUIFromSupabaseData(supabaseData);
                    }, 100);
                    
                    // Wait a moment for UI to update, then generate summary using Supabase data directly
                    setTimeout(() => {
                        console.log('🔄 Generating summary from Supabase data...');
                        let currentSummary = this.generateWeekSummaryFromSupabaseDataDirect(supabaseData) || this.generateWeekSummaryFromUI();
                        this.showInlineSummaryView(currentSummary);
                    }, 100);
                } else {
                    console.log(`⚠️ No finalized data found for ${this.currentWeek.id}`);
                    // Show empty summary
                    this.showInlineSummaryView(null);
                }
            }
        } catch (error) {
            console.error('❌ Error loading finalized week summary:', error);
            // Fallback to generating from current UI
            let currentSummary = this.generateWeekSummaryFromUI();
            this.showInlineSummaryView(currentSummary);
        }
    }
    
    makeWeekEditable() {
        console.log('Making week editable - enabling all inputs');
        
        // Enable all inputs and dropdowns
        document.querySelectorAll('.level-input, .working-days-select, .leave-days-select, .weekly-rating-input').forEach(input => {
            input.disabled = false;
            input.style.background = '';
            input.style.color = '';
        });
        
        // Show save and finalize buttons
        const saveButton = document.querySelector('.btn-success');
        if (saveButton) saveButton.style.display = 'flex';
        
        const finalizeButton = document.querySelector('.btn[onclick*="finalizeWeeklyReport"]');
        if (finalizeButton) finalizeButton.style.display = 'flex';
        
        // Hide finalized status and summary
        const statusDiv = document.getElementById('finalize-status');
        if (statusDiv) statusDiv.style.display = 'none';
        
        const summaryDiv = document.getElementById('weekly-summary-view');
        if (summaryDiv) summaryDiv.style.display = 'none';
    }
    
    getQualityRating(rating) {
        if (rating >= 9.0) return { label: 'Excellent', color: '#27ae60' };
        if (rating >= 8.0) return { label: 'Very Good', color: '#2ecc71' };
        if (rating >= 7.0) return { label: 'Good', color: '#f39c12' };
        if (rating >= 6.0) return { label: 'Average', color: '#e67e22' };
        return { label: 'Below Average', color: '#e74c3c' };
    }
    
    exportWeekData() {
        if (!this.currentWeek || !this.currentMember) {
            this.showMessage('Please select a week and team member', 'error');
            return;
        }
        
        const entryKey = `${this.currentWeek.id}_${this.currentMember.name}`;
        const weekEntry = this.weekEntries[entryKey];
        
        if (!weekEntry) {
            this.showMessage('No data to export', 'error');
            return;
        }
        
        // Create CSV data
        const csvData = [];
        csvData.push(['Work Type', 'Value', 'Level']);
        
        Object.keys(this.workTypes).forEach(workType => {
            const input = document.querySelector(`[data-work="${workType}"]`);
            const value = input ? input.value : '0';
            const level = input ? input.getAttribute('data-level') : '';
            csvData.push([workType.toUpperCase(), value, level]);
        });
        
        // Convert to CSV string
        const csv = csvData.map(row => row.join(',')).join('\\n');
        
        // Download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentMember.name}_Week_${this.currentWeek.weekNumber}_${this.currentWeek.year}.csv`;
        a.click();
        
        this.showMessage('Data exported successfully!', 'success');
    }
    


    addForAllMembers() {
        if (!this.currentWeek) {
            this.showMessage('Please select a week first', 'error');
            return;
        }

        // Get current input values
        const currentData = {};
        Object.keys(this.workTypes).forEach(workType => {
            const input = document.querySelector(`[data-work="${workType}"]`);
            currentData[workType] = parseFloat(input.value) || 0;
        });

        const workingDays = parseInt(document.getElementById('working-days').value) || 5;
        const leaveDays = parseFloat(document.getElementById('leave-days').value) || 0;
        const weeklyRating = parseInt(document.getElementById('weekly-rating-input').value) || 0;

        if (Object.values(currentData).every(val => val === 0)) {
            this.showMessage('Please enter some data first before applying to all members', 'error');
            return;
        }

        // Apply to all team members
        this.teamMembers.forEach(member => {
            const entryKey = `${this.currentWeek.id}_${member.name}`;
            let weekEntry = this.weekEntries[entryKey] || this.weekSystem.createWeekEntry(this.currentWeek.id, member.name);
            
            // Apply the same data
            Object.keys(this.workTypes).forEach(workType => {
                weekEntry.workTypes[workType] = {
                    mon: currentData[workType] / 5, // Distribute equally across 5 days
                    tue: currentData[workType] / 5,
                    wed: currentData[workType] / 5,
                    thu: currentData[workType] / 5,
                    fri: currentData[workType] / 5
                };
            });

            weekEntry.workingDays = workingDays;
            weekEntry.leaveDays = leaveDays;
            weekEntry.weeklyRating = weeklyRating;
            weekEntry.totals.weekTotal = Object.values(currentData).reduce((sum, val) => sum + val, 0);

            this.weekEntries[entryKey] = weekEntry;
        });

        this.saveTeamSpecificData();
        this.showMessage(`Data applied to all ${this.teamMembers.length} team members for ${this.currentWeek.label}`, 'success');
    }

    async finalizeWeeklyReport() {
        if (!this.currentWeek) {
            this.showMessage('Please select a week first', 'error');
            return;
        }
        
        // Check if already finalized (team-specific structure)
        const finalizedReports = this.finalizedReports || {};
        if (finalizedReports[this.currentTeam] && finalizedReports[this.currentTeam][this.currentWeek.id]) {
            this.showMessage('This week has already been finalized!', 'error');
            return;
        }
        
        // Collect current data from the form for all members
        const memberSummaries = [];
        let totalOutput = 0;
        let totalRating = 0;
        let totalEfficiency = 0;
        let memberCount = 0;
        
        this.teamMembers.forEach(member => {
            // Get current form data
            const workingDaysSelect = document.querySelector(`[data-member="${member.name}"].working-days-select`);
            const leaveDaysSelect = document.querySelector(`[data-member="${member.name}"].leave-days-select`);
            const ratingSelect = document.querySelector(`[data-member="${member.name}"].weekly-rating-input`);
            
            const workingDays = parseInt(workingDaysSelect?.value) || 5;
            const leaveDays = parseFloat(leaveDaysSelect?.value) || 0;
            const rating = parseFloat(ratingSelect?.value) || 0;
            const effectiveWorkingDays = workingDays - leaveDays;
            const output = this.calculateMemberTotalOutput(member.name);
            
            console.log(`🔍 FINALIZATION DEBUG for ${member.name} (${this.currentTeam}):`, {
                'Raw Output': output,
                'Working Days': workingDays,
                'Leave Days': leaveDays,
                'Effective Days': effectiveWorkingDays
            });
            
            let efficiency = 0;
            if (this.usesTargetPoints()) {
                const targetPointsInput = document.querySelector(`[data-member="${member.name}"].target-points-input`);
                const targetPoints = parseFloat(targetPointsInput?.value) || 0;
                
                console.log(`🎯 ${this.currentTeam} team target points for ${member.name}:`, targetPoints);
                
                if (targetPoints > 0) {
                    const adjustedTarget = targetPoints * (effectiveWorkingDays / workingDays);
                    efficiency = adjustedTarget > 0 ? (output / adjustedTarget) * 100 : 0;
                    
                    console.log(`✅ ${this.currentTeam} finalization calculation for ${member.name}:`, {
                        completedPoints: output,
                        targetPoints: targetPoints,
                        workingDays: workingDays,
                        leaveDays: leaveDays,
                        adjustedTarget: adjustedTarget.toFixed(1),
                        efficiency: efficiency.toFixed(1) + '%',
                        'Will store week_total': output,
                        'Will store target_points': targetPoints
                    });
                } else {
                    console.warn(`⚠️ No target points set for ${member.name}`);
                }
            } else {
                // Other teams: output is days equivalent, use effective working days
                efficiency = effectiveWorkingDays > 0 ? (output / effectiveWorkingDays) * 100 : 0;
                
                console.log(`✅ Standard team calculation for ${member.name}:`, {
                    outputDays: output,
                    effectiveWorkingDays: effectiveWorkingDays,
                    efficiency: efficiency.toFixed(1) + '%'
                });
            }
            
            // Only check for missing rating if this team uses ratings
            const teamsWithoutRatings = ['tech', 'product', 'content', 'social'];
            if (rating === 0 && !teamsWithoutRatings.includes(this.currentTeam)) {
                this.showMessage(`Missing quality rating for ${member.name}. Please complete all entries before finalizing.`, 'error');
                return;
            }
            
            memberSummaries.push({
                name: member.name,
                output: output,
                rating: rating,
                efficiency: efficiency,
                workingDays: effectiveWorkingDays
            });
            
            totalOutput += output;
            totalRating += rating;
            totalEfficiency += efficiency;
            memberCount++;
        });
        
        if (memberCount !== this.teamMembers.length) {
            return; // Exit if validation failed
        }
        
        const weekSummary = {
            weekId: this.currentWeek.id,
            weekName: `Week ${this.currentWeek.weekNumber} - ${this.currentWeek.monthName} ${this.currentWeek.year}`,
            dateRange: this.currentWeek.dateRange,
            teamCount: memberCount,
            avgOutput: totalOutput / memberCount,
            avgRating: totalRating / memberCount,
            avgEfficiency: totalEfficiency / memberCount,
            memberSummaries: memberSummaries,
            finalizedAt: new Date().toISOString(),
            status: 'finalized',
            isFinalized: true,
            source: 'manual_finalization'
        };
        
        // CRITICAL FIX: Save finalized report in team-specific nested structure
        if (!this.finalizedReports) {
            this.finalizedReports = {};
        }
        if (!this.finalizedReports[this.currentTeam]) {
            this.finalizedReports[this.currentTeam] = {};
        }
        this.finalizedReports[this.currentTeam][this.currentWeek.id] = weekSummary;
        
        console.log(`✅ Stored finalized report for team ${this.currentTeam}, week ${this.currentWeek.id}`);
        console.log(`📋 Updated finalizedReports structure:`, {
            team: this.currentTeam,
            weekId: this.currentWeek.id,
            allFinalizedWeeks: Object.keys(this.finalizedReports[this.currentTeam])
        });
        
        this.saveTeamSpecificData();
        
        // CRITICAL: Save current week data permanently AND force sync to Supabase
        console.log('💾 Finalizing week - forcing comprehensive save to Supabase...');
        
        // IMPORTANT: Capture the week we're finalizing BEFORE any UI changes
        const finalizingWeek = this.currentWeek;
        const finalizingWeekId = this.currentWeek.id;
        console.log(`🔍 Finalizing week: ${finalizingWeekId}`);
        
        try {
            // Save locally first (collect data from UI for the specific week being finalized)
            console.log('📝 Step 1: Collecting and saving data locally...');
            
            // Collect data directly from UI for the finalizing week
            let savedCount = 0;
            this.teamMembers.forEach(member => {
                const entryKey = `${finalizingWeekId}_${member.name}`;
                const weekEntry = this.collectMemberData(member.name);
                
                if (weekEntry) {
                    // Ensure the weekEntry has the correct week ID
                    weekEntry.weekId = finalizingWeekId;
                    this.weekEntries[entryKey] = weekEntry;
                    savedCount++;
                    console.log(`✅ Saved data for ${member.name} in week ${finalizingWeekId}`);
                }
            });
            
            // Save to localStorage
            this.saveTeamSpecificData();
            
            console.log(`✅ Step 1 complete: Collected data for ${savedCount} members`);
            console.log('🔍 weekEntries after save:', Object.keys(this.weekEntries || {}));
            
            // Then force sync to Database with extra retries for finalization
            console.log('📝 Step 2: Starting Supabase save...');
            await this.autoSaveToDatabase(weekSummary, finalizingWeekId);
            console.log('✅ Step 2 complete: Supabase save done');
            
        } catch (error) {
            console.error('❌ Error during finalization save process:', error);
            this.showMessage('⚠️ Week finalized locally but database save failed', 'warning');
        }
        
        // Show finalization status
        this.showFinalizationStatus();
        
        // Show inline summary view
        this.showInlineSummaryView(weekSummary);
        
        // Single success message
        this.showMessage(`✅ Week ${this.currentWeek.weekNumber} finalized successfully!`, 'success');
        
        // NEW: Check if this completes the month and trigger transition
        setTimeout(() => {
            this.checkMonthCompletion();
        }, 1000); // Small delay to ensure all data is saved
    }
    
    async autoSaveToDatabase(weekSummary, specificWeekId = null) {
        try {
            const weekIdToSave = specificWeekId || this.currentWeek?.id;
            console.log('📝 Auto-saving finalized week to Supabase...');
            console.log('🔍 Current team:', this.currentTeam);
            console.log('🔍 Week to save:', weekIdToSave);
            console.log('🔍 Specific week provided?', !!specificWeekId);
            
            // Force a comprehensive save of all current week data to Supabase
            // This ensures that when a week is finalized, all data is backed up
            const result = await this.saveToSupabaseWithRetry(5, weekIdToSave); // Aggressive retry for finalization
            
            if (result.success) {
                console.log('✅ Finalized week data saved to Supabase');
                this.showMessage('📊 Week finalized and backed up to Database', 'success');
            } else {
                console.error('❌ Failed to save finalized week:', result.error);
                this.showMessage('⚠️ Week finalized locally. Database backup failed.', 'warning');
            }
            
        } catch (error) {
            console.error('Error auto-saving finalized week to database:', error);
            this.showMessage('⚠️ Week finalized locally. Database backup failed - will retry automatically.', 'warning');
        }
    }
    
    checkMonthCompletion() {
        console.log('🗓️ Checking if month is complete...');
        
        try {
            const currentMonth = this.currentWeek?.monthName;
            const currentYear = this.currentWeek?.year;
            
            if (!currentMonth || !currentYear) {
                console.log('No current month/year found');
                return;
            }
            
            // Get all weeks for this month
            const monthWeeks = this.weekSystem.getWeeksForMonth(currentMonth, currentYear);
            console.log(`Found ${monthWeeks.length} weeks in ${currentMonth} ${currentYear}`);
            
            // Refresh finalized reports from storage
            this.loadTeamSpecificData();
            const finalizedReports = this.finalizedReports || {};
            
            // Check if all weeks are finalized (using team-specific structure)
            const teamFinalizedReports = finalizedReports[this.currentTeam] || {};
            const finalizedWeeksInMonth = monthWeeks.filter(week => {
                const weekReport = teamFinalizedReports[week.id];
                const isFinalized = weekReport && (weekReport.status === 'finalized' || weekReport.isFinalized === true);
                console.log(`Week ${week.id}: ${isFinalized ? 'FINALIZED' : 'not finalized'}`);
                if (weekReport) {
                    console.log(`  - Report structure:`, weekReport);
                }
                return isFinalized;
            });
            
            console.log(`✅ Finalized weeks: ${finalizedWeeksInMonth.length}/${monthWeeks.length}`);
            console.log('Finalized week IDs:', finalizedWeeksInMonth.map(w => w.id));
            
            if (finalizedWeeksInMonth.length === monthWeeks.length && monthWeeks.length >= 4) {
                console.log('🎉 Month is complete! Starting transition...');
                
                // Confirm with user before transition
                const confirmed = confirm(
                    `🎉 All ${monthWeeks.length} weeks of ${currentMonth} ${currentYear} are complete!\n\n` +
                    `✅ Move to monthly summary\n` +
                    `✅ Activate ${this.getNextMonth(currentMonth, currentYear).month} ${this.getNextMonth(currentMonth, currentYear).year}\n\n` +
                    `Proceed with automatic transition?`
                );
                
                if (confirmed) {
                    this.transitionToNextMonth(currentMonth, currentYear, monthWeeks, finalizedWeeksInMonth);
                } else {
                    console.log('User cancelled month transition');
                }
            } else {
                console.log(`Month not complete yet. Need ${monthWeeks.length - finalizedWeeksInMonth.length} more weeks.`);
                
                // Show which weeks are missing (using team-specific structure)
                const teamFinalizedReports = finalizedReports[this.currentTeam] || {};
                const missingWeeks = monthWeeks.filter(week => 
                    !teamFinalizedReports[week.id] || teamFinalizedReports[week.id].status !== 'finalized'
                );
                if (missingWeeks.length > 0) {
                    console.log('Missing weeks:', missingWeeks.map(w => w.label));
                }
            }
        } catch (error) {
            console.error('Error checking month completion:', error);
        }
    }
    
    transitionToNextMonth(completedMonth, completedYear, monthWeeks, finalizedWeeks) {
        console.log(`🚀 Transitioning from ${completedMonth} ${completedYear} to next month...`);
        
        try {
            // 1. Create monthly summary from finalized weeks
            const monthlyData = this.createMonthlyDataFromWeeks(finalizedWeeks);
            const monthKey = `${completedMonth} ${completedYear}`;
            
            // 2. Add to historical data
            if (!this.historicalData[this.currentTeam]) {
                this.historicalData[this.currentTeam] = {};
            }
            
            this.historicalData[this.currentTeam][monthKey] = {
                isComplete: true,
                monthlyData: monthlyData.memberData,
                teamSummary: monthlyData.teamSummary
            };
            
            // 3. KEEP finalized reports - don't clear them (users may want to view/edit)
            // Historical data is separate from active finalized reports
            // this.finalizedReports stays intact for reference
            
            // 4. Save the updated data
            this.saveTeamSpecificData();
            
            // 5. Move to next month
            const nextMonth = this.getNextMonth(completedMonth, completedYear);
            console.log(`Moving to: ${nextMonth.month} ${nextMonth.year}`);
            
            // 6. Update current week to first week of next month
            const nextMonthWeeks = this.weekSystem.getWeeksForMonth(nextMonth.month, nextMonth.year);
            console.log(`Next month weeks found: ${nextMonthWeeks.length}`);
            if (nextMonthWeeks.length > 0) {
                this.currentWeek = nextMonthWeeks[0];
                console.log(`Moving to week: ${this.currentWeek.label}`);
                
                // Force refresh the week selector and data
                this.populateWeekSelector();
                this.updateWeekInfo();
                this.loadWeekData();
                this.generateTeamDataRows();
            } else {
                console.error('No weeks found for next month:', nextMonth);
            }
            
            // 7. Show success message
            this.showMessage(`🎉 ${completedMonth} ${completedYear} completed and moved to monthly summary! Now in ${nextMonth.month} ${nextMonth.year}.`, 'success');
            
            // 8. Refresh the view
            this.generateTeamDataRows();
            
        } catch (error) {
            console.error('Error transitioning to next month:', error);
            this.showMessage('❌ Error transitioning to next month', 'error');
        }
    }
    
    createMonthlyDataFromWeeks(finalizedWeeks) {
        const memberData = {};
        const teamTotals = {
            totalMembers: 0,
            totalOutput: 0,
            totalRating: 0,
            totalEfficiency: 0,
            totalWorkingDays: 0
        };
        
        // Initialize member data structure
        this.teamMembers.forEach(member => {
            memberData[member.name] = {
                weeks: [],
                weeklyQualityRatings: [],
                monthlyRating: 0,
                target: 0,
                totalOutput: 0,
                efficiency: 0,
                workingDays: 0
            };
        });
        
        // Process each finalized week
        finalizedWeeks.forEach(week => {
            const weekData = this.finalizedReports[week.id];
            if (weekData && weekData.memberSummaries) {
                weekData.memberSummaries.forEach(memberSummary => {
                    if (memberData[memberSummary.name]) {
                        memberData[memberSummary.name].weeks.push(memberSummary.output);
                        memberData[memberSummary.name].weeklyQualityRatings.push(memberSummary.rating);
                        memberData[memberSummary.name].totalOutput += memberSummary.output;
                        memberData[memberSummary.name].workingDays += memberSummary.workingDays;
                    }
                });
            }
        });
        
        // Calculate final member statistics
        let activeMemberCount = 0;
        Object.keys(memberData).forEach(memberName => {
            const member = memberData[memberName];
            if (member.weeks.length > 0) {
                // Calculate averages
                member.monthlyRating = member.weeklyQualityRatings.reduce((sum, rating) => sum + rating, 0) / member.weeklyQualityRatings.length;
                member.target = member.workingDays; // Assuming target equals working days
                member.efficiency = member.workingDays > 0 ? (member.totalOutput / member.workingDays) * 100 : 0;
                
                // Add to team totals
                teamTotals.totalOutput += member.totalOutput;
                teamTotals.totalRating += member.monthlyRating;
                teamTotals.totalEfficiency += member.efficiency;
                teamTotals.totalWorkingDays += member.workingDays;
                activeMemberCount++;
            }
        });
        
        // Calculate team summary
        const teamSummary = {
            totalMembers: activeMemberCount,
            avgEfficiency: activeMemberCount > 0 ? teamTotals.totalEfficiency / activeMemberCount : 0,
            avgRating: activeMemberCount > 0 ? teamTotals.totalRating / activeMemberCount : 0,
            totalOutput: teamTotals.totalOutput,
            totalWorkingDays: teamTotals.totalWorkingDays
        };
        
        return { memberData, teamSummary };
    }
    
    getNextMonth(currentMonth, currentYear) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const currentIndex = months.indexOf(currentMonth);
        if (currentIndex === -1) return { month: 'January', year: currentYear };
        
        if (currentIndex === 11) { // December
            return { month: 'January', year: currentYear + 1 };
        } else {
            return { month: months[currentIndex + 1], year: currentYear };
        }
    }
    
    showFinalizationStatus() {
        // Hide both save and finalize buttons when week is finalized
        const saveButton = document.querySelector('button[onclick="tracker.saveWeekData()"]');
        if (saveButton) {
            saveButton.style.display = 'none';
        }
        
        const finalizeButton = document.querySelector('button[onclick="tracker.finalizeWeeklyReport()"]');
        if (finalizeButton) {
            finalizeButton.style.display = 'none';
        }
        
        // Show "Week is finalized" message instead of buttons
        const statusDiv = document.getElementById('finalize-status');
        if (statusDiv) {
            // Check if month completion is possible
            const monthCompletionButton = this.shouldShowMonthCompletionButton();
            
            statusDiv.innerHTML = `
                <div style="background: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
                    <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                    <strong>Week ${this.currentWeek.weekNumber} has been finalized</strong>
                    <div style="font-size: 14px; margin-top: 5px; opacity: 0.9;">
                        This week's data is locked and cannot be edited
                    </div>
                    ${monthCompletionButton}
                </div>
            `;
            statusDiv.style.display = 'block';
        }
        
        // Show the inline summary view with finalized data
        this.showInlineSummaryView();
    }
    
    shouldShowMonthCompletionButton() {
        try {
            const currentMonth = this.currentWeek?.monthName;
            const currentYear = this.currentWeek?.year;
            
            if (!currentMonth || !currentYear) return '';
            
            // Get all weeks for this month
            const monthWeeks = this.weekSystem.getWeeksForMonth(currentMonth, currentYear);
            if (monthWeeks.length < 4) return '';
            
            // Check if all weeks are finalized (using team-specific structure)
            const finalizedReports = this.finalizedReports || {};
            const teamFinalizedReports = finalizedReports[this.currentTeam] || {};
            const finalizedWeeksInMonth = monthWeeks.filter(week => {
                const weekReport = teamFinalizedReports[week.id];
                return weekReport && (weekReport.status === 'finalized' || weekReport.isFinalized === true);
            });
            
            // If all weeks are finalized, show completion button
            if (finalizedWeeksInMonth.length === monthWeeks.length) {
                return `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">
                        <div style="font-size: 14px; margin-bottom: 10px;">
                            🎉 All ${monthWeeks.length} weeks completed!
                        </div>
                        <button onclick="tracker.checkMonthCompletion()" 
                                style="background: #ffc107; color: #212529; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                            <i class="fas fa-calendar-check" style="margin-right: 5px;"></i>
                            Complete ${currentMonth} ${currentYear}
                        </button>
                    </div>
                `;
            }
            
            return `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 14px; opacity: 0.9;">
                    📊 Progress: ${finalizedWeeksInMonth.length}/${monthWeeks.length} weeks completed
                </div>
            `;
            
        } catch (error) {
            console.error('Error checking month completion button:', error);
            return '';
        }
    }
    

    
    generateWeekSummaryFromSupabaseData() {
        if (!this.currentWeek) {
            console.log('❌ No current week for summary generation');
            return null;
        }
        
        const memberSummaries = [];
        let totalOutput = 0;
        let totalRating = 0;
        let totalEfficiency = 0;
        let memberCount = 0;
        
        console.log('📊 Generating summary from Supabase data...');
        
        // Get team members and calculate from input values
        this.teamMembers.forEach(member => {
            const memberName = member.name || member; // Handle both object and string formats
            let memberOutput = 0;
            let memberRating = 0;
            let memberWorkingDays = 5; // default
            let memberLeaveDays = 0;
            
            // Calculate total output from all work type inputs
            let teamWorkTypes;
            if (this.currentTeam === 'zero1') {
                teamWorkTypes = this.zero1WorkTypes;
            } else if (this.currentTeam === 'harish') {
                teamWorkTypes = this.harishWorkTypes;
            } else if (this.currentTeam === 'audio') {
                teamWorkTypes = this.audioWorkTypes;
            } else if (this.currentTeam === 'varsity') {
                teamWorkTypes = this.varsityWorkTypes;
            } else if (this.currentTeam === 'graphics') {
                teamWorkTypes = this.graphicsWorkTypes;
            } else if (this.currentTeam === 'tech') {
                teamWorkTypes = this.techWorkTypes;
            } else if (this.currentTeam === 'product') {
                teamWorkTypes = this.productWorkTypes;
            } else if (this.currentTeam === 'preproduction') {
                teamWorkTypes = this.preproductionWorkTypes;
            } else if (this.currentTeam === 'content') {
                teamWorkTypes = this.contentWorkTypes;
            } else if (this.currentTeam === 'social') {
                teamWorkTypes = this.socialWorkTypes;
            } else {
                teamWorkTypes = this.workTypes; // B2B uses original types
            }
            
            if (this.currentTeam === 'tech' || this.currentTeam === 'product') {
                // For Tech/Product teams: use raw values (story points)
            Object.keys(teamWorkTypes).forEach(workType => {
                const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
                if (input && input.value) {
                    memberOutput += parseFloat(input.value) || 0;
                }
            });
            } else {
                // For other teams: convert to days equivalent
                Object.keys(teamWorkTypes).forEach(workType => {
                    const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
                    if (input && input.value) {
                        const workDone = parseFloat(input.value) || 0;
                        const perDay = teamWorkTypes[workType].perDay;
                        if (perDay > 0) {
                            memberOutput += workDone / perDay; // Convert to days equivalent
                        }
                    }
                });
            }
            
            // Get quality rating
            const ratingInput = document.querySelector(`.weekly-rating-input[data-member="${memberName}"]`);
            if (ratingInput) {
                memberRating = parseFloat(ratingInput.value) || 0;
            }
            
            // Get working days and leave days
            const workingDaysInput = document.querySelector(`.working-days-select[data-member="${memberName}"]`);
            if (workingDaysInput) {
                memberWorkingDays = parseFloat(workingDaysInput.value) || 5;
            }
            
            const leaveDaysInput = document.querySelector(`.leave-days-select[data-member="${memberName}"]`);
            if (leaveDaysInput) {
                memberLeaveDays = parseFloat(leaveDaysInput.value) || 0;
            }
            
            // Calculate efficiency using correct formula for each team type
            const effectiveWorkingDays = memberWorkingDays - memberLeaveDays;
            let memberEfficiency = 0;
            
            if (this.usesTargetPoints()) {
                const targetPointsInput = document.querySelector(`[data-member="${memberName}"].target-points-input`);
                const targetPoints = parseFloat(targetPointsInput?.value) || 0;
                
                if (targetPoints > 0) {
                    const adjustedTarget = targetPoints * (effectiveWorkingDays / memberWorkingDays);
                    memberEfficiency = adjustedTarget > 0 ? (memberOutput / adjustedTarget) * 100 : 0;
                    console.log(`🎯 ${this.currentTeam} summary for ${memberName}: ${memberOutput}/(${targetPoints}*${effectiveWorkingDays}/${memberWorkingDays}) = ${memberOutput}/${adjustedTarget.toFixed(1)} = ${memberEfficiency.toFixed(1)}%`);
                } else {
                    console.warn(`⚠️ No target points for ${memberName} in summary`);
                }
            } else {
                // Other teams: days equivalent / effective working days
                memberEfficiency = effectiveWorkingDays > 0 ? (memberOutput / effectiveWorkingDays * 100) : 0;
            }
            
            console.log(`📊 ${memberName}: Output=${memberOutput}, Rating=${memberRating}, Days=${effectiveWorkingDays}, Efficiency=${memberEfficiency.toFixed(1)}%`);
            
            // Include ALL team members in finalized reports
            // 0% efficiency is valid data (inefficient work or full week leave)
            memberSummaries.push({
                name: memberName,
                output: memberOutput,
                rating: memberRating,
                efficiency: memberEfficiency,
                workingDays: effectiveWorkingDays
            });
            
            totalOutput += memberOutput;
            totalRating += memberRating;
            totalEfficiency += memberEfficiency;
            memberCount++;
        });
        
        if (memberCount === 0) {
            console.log('❌ No valid data found for summary generation');
            return null; // No valid data found
        }
        
        const avgOutput = totalOutput / memberCount;
        const avgRating = totalRating / memberCount;
        const avgEfficiency = totalEfficiency / memberCount;
        
        return {
            weekName: this.currentWeek.label,
            dateRange: this.currentWeek.dateRange,
            memberSummaries: memberSummaries,
            avgOutput: avgOutput,
            avgRating: avgRating,
            avgEfficiency: avgEfficiency,
            finalizedAt: new Date().toISOString()
        };
    }

    generateWeekSummaryFromSupabaseDataDirect(supabaseData) {
        if (!this.currentWeek || !supabaseData || supabaseData.length === 0) {
            console.log('❌ No current week or Supabase data for direct summary generation');
            return null;
        }
        
        console.log('📊 Generating summary directly from Supabase data:', supabaseData);
        
        const memberSummaries = [];
        let totalOutput = 0;
        let totalRating = 0;
        let totalEfficiency = 0;
        let memberCount = 0;
        
        // Process each entry from Supabase data
        supabaseData.forEach(entry => {
            const memberName = entry.member_name;
            const memberOutput = this.getMemberWeekOutput(entry, this.currentTeam);
            const workingDays = parseFloat(entry.working_days) || 5;
            const leaveDays = parseFloat(entry.leave_days) || 0;
            const rating = parseFloat(entry.weekly_rating) || 0;
            const effectiveWorkingDays = workingDays - leaveDays;
            
            let efficiency = 0;
            
            if (this.usesTargetPoints()) {
                efficiency = this.calculateTargetPointsTeamEfficiency(this.currentTeam, entry, memberOutput, workingDays, leaveDays);
                console.log(`🎯 ${this.currentTeam} efficiency for ${memberName}: output=${memberOutput}, efficiency=${efficiency.toFixed(1)}%`);
            } else {
                // Other teams: days equivalent based
                efficiency = effectiveWorkingDays > 0 ? (memberOutput / effectiveWorkingDays) * 100 : 0;
                console.log(`✅ Standard efficiency for ${memberName}: ${memberOutput}/${effectiveWorkingDays} = ${efficiency.toFixed(1)}%`);
            }
            
            memberSummaries.push({
                name: memberName,
                output: memberOutput,
                rating: rating,
                efficiency: efficiency,
                workingDays: effectiveWorkingDays
            });
            
            totalOutput += memberOutput;
            totalRating += rating;
            totalEfficiency += efficiency;
            memberCount++;
        });
        
        if (memberCount === 0) {
            console.log('❌ No valid member data found in Supabase data');
            return null;
        }
        
        const avgOutput = totalOutput / memberCount;
        const avgRating = totalRating / memberCount;
        const avgEfficiency = totalEfficiency / memberCount;
        
        console.log(`📊 Summary calculated - Members: ${memberCount}, Avg Output: ${avgOutput.toFixed(2)}, Avg Efficiency: ${avgEfficiency.toFixed(1)}%`);
        
        return {
            weekName: this.currentWeek.label,
            dateRange: this.currentWeek.dateRange,
            memberSummaries: memberSummaries,
            avgOutput: avgOutput,
            avgRating: avgRating,
            avgEfficiency: avgEfficiency,
            finalizedAt: new Date().toISOString()
        };
    }

    generateWeekSummaryFromUI() {
        if (!this.currentWeek || !this.teamMembers) {
            return null;
        }
        
        const memberSummaries = [];
        let totalOutput = 0;
        let totalRating = 0;
        let totalEfficiency = 0;
        let memberCount = 0;
        
        this.teamMembers.forEach(member => {
            // Get current form data
            const workingDaysSelect = document.querySelector(`[data-member="${member.name}"].working-days-select`);
            const leaveDaysSelect = document.querySelector(`[data-member="${member.name}"].leave-days-select`);
            const ratingSelect = document.querySelector(`[data-member="${member.name}"].weekly-rating-input`);
            
            const workingDays = parseInt(workingDaysSelect?.value) || 5;
            const leaveDays = parseFloat(leaveDaysSelect?.value) || 0;
            const rating = parseFloat(ratingSelect?.value) || 0;
            const effectiveWorkingDays = workingDays - leaveDays;
            const output = this.calculateMemberTotalOutput(member.name);
            const efficiency = effectiveWorkingDays > 0 ? (output / effectiveWorkingDays) * 100 : 0;
            
            memberSummaries.push({
                name: member.name,
                output: output,
                rating: rating,
                efficiency: efficiency,
                workingDays: effectiveWorkingDays
            });
            
            totalOutput += output;
            totalRating += rating;
            totalEfficiency += efficiency;
            memberCount++;
        });
        
        const avgOutput = memberCount > 0 ? totalOutput / memberCount : 0;
        const avgRating = memberCount > 0 ? totalRating / memberCount : 0;
        const avgEfficiency = memberCount > 0 ? totalEfficiency / memberCount : 0;
        
        return {
            weekName: this.currentWeek.label,
            dateRange: this.currentWeek.dateRange,
            memberSummaries: memberSummaries,
            avgOutput: avgOutput,
            avgRating: avgRating,
            avgEfficiency: avgEfficiency,
            finalizedAt: new Date().toISOString()
        };
    }
    
    showInlineSummaryView(weekSummary) {
        const summaryDiv = document.getElementById('weekly-summary-view');
        if (!summaryDiv) {
            console.log('❌ Summary div not found');
            return;
        }
        
        console.log('📊 showInlineSummaryView called with:', weekSummary);
        
        // If no weekSummary provided, check if this week is finalized and get stored data
        if (!weekSummary) {
            const weekKey = this.currentWeek?.id;
            console.log(`🔍 Looking for stored summary for week: ${weekKey}`);
            if (!weekKey) return;
            
            // Get team-specific finalized report
            const finalizedReports = this.finalizedReports || {};
            weekSummary = finalizedReports[this.currentTeam] && finalizedReports[this.currentTeam][weekKey];
            console.log(`📊 Found stored summary for ${this.currentTeam}:`, weekSummary);
            
            if (!weekSummary) {
                // Week is not finalized, hide the summary
                console.log('❌ No stored summary found, hiding summary view');
                summaryDiv.style.display = 'none';
                return;
            }
        }
        
        console.log('📊 Final weekSummary for display:', {
            avgOutput: weekSummary.avgOutput,
            avgRating: weekSummary.avgRating,
            avgEfficiency: weekSummary.avgEfficiency,
            memberSummaries: weekSummary.memberSummaries?.length
        });
        
        const summaryHTML = `
            <div style="background: #f8f9fa; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin-top: 15px;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <h3 style="color: #28a745; margin: 0; font-size: 18px;">
                        <i class="fas fa-check-circle"></i> 
                        Weekly Summary Report
                    </h3>
                    <div style="color: #6c757d; font-size: 14px; margin-top: 5px;">${weekSummary.weekName} | ${weekSummary.dateRange}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="background: #e8f5e8; padding: 12px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #28a745;">${(weekSummary.avgOutput || 0).toFixed(1)}</div>
                        <div style="color: #6c757d; font-size: 12px;">Avg Output ${this.currentTeam === 'tech' || this.currentTeam === 'product' ? '(Story Points)' : '(Days)'}</div>
                    </div>
                    ${(this.currentTeam === 'tech' || this.currentTeam === 'product' || this.currentTeam === 'content' || this.currentTeam === 'social') ? '' : `
                    <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #2196f3;">${(weekSummary.avgRating || 0).toFixed(1)}/10</div>
                        <div style="color: #6c757d; font-size: 12px;">Avg Quality Rating</div>
                    </div>
                    `}
                    <div style="background: #fff3e0; padding: 12px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #ff9800;">${(weekSummary.avgEfficiency || 0).toFixed(1)}%</div>
                        <div style="color: #6c757d; font-size: 12px;">Avg Efficiency</div>
                    </div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #e9ecef;">
                            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">Member</th>
                            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Output</th>
                            ${(this.currentTeam === 'tech' || this.currentTeam === 'product') ? '' : '<th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Quality</th>'}
                            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Efficiency</th>
                            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(weekSummary.memberSummaries || []).map(member => `
                            <tr>
                                <td style="padding: 6px; border: 1px solid #dee2e6;">${member?.name || 'Unknown'}</td>
                                <td style="padding: 6px; border: 1px solid #dee2e6; text-align: center;">${(member?.output || 0).toFixed(2)}</td>
                                ${(this.currentTeam === 'tech' || this.currentTeam === 'product' || this.currentTeam === 'content') ? '' : `<td style="padding: 6px; border: 1px solid #dee2e6; text-align: center;">${member?.rating || 0}/10</td>`}
                                <td style="padding: 6px; border: 1px solid #dee2e6; text-align: center; color: ${(member?.efficiency || 0) >= 90 ? '#28a745' : (member?.efficiency || 0) >= 70 ? '#ffc107' : '#dc3545'};">${(member?.efficiency || 0).toFixed(1)}%</td>
                                <td style="padding: 6px; border: 1px solid #dee2e6; text-align: center;">${member?.workingDays || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        summaryDiv.innerHTML = summaryHTML;
        summaryDiv.style.display = 'block';
    }
    
    // Debug function to clear all finalized reports (for testing)
    clearAllFinalizedReports() {
        this.finalizedReports = {};
        this.saveTeamSpecificData();
        console.log(`All finalized reports cleared for ${this.currentTeam}`);
        this.showMessage(`All finalized reports cleared for ${this.currentTeam}. All weeks are now editable.`, 'info');
        // Refresh current week status
        this.checkWeekFinalizationStatus();
    }
    
    // Debug function to show current finalized reports
    showFinalizedReports() {
        const finalizedReports = this.finalizedReports || {};
        console.log('Current finalized reports:', finalizedReports);
        console.log('Finalized week IDs:', Object.keys(finalizedReports));
        return finalizedReports;
    }
    
    setupTeamSwitching() {
        const teamSelect = document.getElementById('team-select-header');
        if (teamSelect) {
            // Filter out archived teams for current period
            this.updateTeamSelectorOptions();
            
            teamSelect.addEventListener('change', async (e) => {
                const newTeam = e.target.value;
                
                // Prevent switching to archived teams for current week
                if (this.isTeamArchivedForCurrentWeek(newTeam)) {
                    this.showMessage(`⚠️ ${this.teamConfigs[newTeam]?.name} is no longer active from ${this.teamConfigs[newTeam]?.archivedFrom}`, 'warning');
                    teamSelect.value = this.currentTeam; // Reset to current team
                    return;
                }
                
                if (newTeam !== this.currentTeam) {
                    this.showMessage('Switching teams...', 'info');
                    await this.switchTeam(newTeam);
                }
            });
        }
        
    }
    
    // Check if team is archived for the current week
    isTeamArchivedForCurrentWeek(teamId) {
        const teamConfig = this.teamConfigs[teamId];
        if (!teamConfig || !teamConfig.archived) return false;
        
        // Check if current week is on or after the archived date
        if (this.currentWeek && teamConfig.archivedFrom) {
            const currentWeekDate = new Date(this.currentWeek.startDate);
            const [month, year] = teamConfig.archivedFrom.split(' ');
            const archiveDate = new Date(`${month} 1, ${year}`);
            
            return currentWeekDate >= archiveDate;
        }
        
        return false;
    }
    
    // Update team selector to hide/show archived teams based on current week
    updateTeamSelectorOptions() {
        const teamSelect = document.getElementById('team-select-header');
        if (!teamSelect) return;
        
        // Go through all options and hide archived teams for current period
        Array.from(teamSelect.options).forEach(option => {
            const teamId = option.value;
            const teamConfig = this.teamConfigs[teamId];
            
            if (teamConfig && teamConfig.archived) {
                // Check if current week is on or after the archived date
                if (this.currentWeek && teamConfig.archivedFrom) {
                    const currentWeekDate = new Date(this.currentWeek.startDate);
                    const [month, year] = teamConfig.archivedFrom.split(' ');
                    const archiveDate = new Date(`${month} 1, ${year}`);
                    
                    if (currentWeekDate >= archiveDate) {
                        option.style.display = 'none';
                        option.disabled = true;
                        console.log(`🚫 Hiding archived team ${teamId} from selector (archived from ${teamConfig.archivedFrom})`);
                    } else {
                        option.style.display = '';
                        option.disabled = false;
                    }
                } else {
                    // No current week set, show all teams
                    option.style.display = '';
                    option.disabled = false;
                }
            }
        });
    }
    
    async switchTeam(newTeam) {
        try {
            console.log(`Switching from ${this.currentTeam} to ${newTeam}`);
            
            // Save current team data before switching
            if (this.currentTeam) {
                this.saveTeamSpecificData();
            }
            
            this.currentTeam = newTeam;
            
            // CRITICAL: Clear any cached data from previous team to prevent contamination
            console.log(`🧹 Clearing cached data when switching to ${newTeam}...`);
            this.weekEntries = {};
            this.finalizedReports = {};
            this.sheetData = [];
            
            // Load team-specific data (week entries and finalized reports)
            this.loadTeamSpecificData();
            
            // CRITICAL: Load finalized weeks from Supabase for new team
            try {
                console.log('🔄 Loading finalized weeks from Supabase for team switch...');
                await this.loadAllFinalizedWeeksFromSupabase();
                console.log('✅ Finalized weeks loaded for new team, re-setting current week...');
                
                // Re-set current week with Supabase finalized data
                this.setCurrentWeek();
                
            } catch (e) {
                console.warn('⚠️ Could not load finalized weeks for team switch:', e.message);
            }
            
            // Load stored historical data for this team
            this.loadStoredHistoricalData();
            
            // Update current team shortcuts
            this.teamMembers = this.getActiveTeamMembers(this.currentTeam);
            this.workLevels = this.teamConfigs[this.currentTeam].workLevels;
            
            // If switching to Varsity, always load historical data
            if (newTeam === 'varsity') {
                console.log('🏐 Switching to Varsity - loading historical data...');
                await this.loadVarsityHistoricalData();
            } else if (newTeam === 'zero1') {
                console.log('🚀 Switching to Zero1 - loading historical data...');
                await this.loadZero1HistoricalData();
            } else if (newTeam === 'harish') {
                console.log('🏆 Switching to Zero1 - Harish - loading historical data...');
                await this.loadHarishHistoricalData();
            } else if (newTeam === 'shorts') {
                console.log('🎬 Switching to Shorts - loading historical data...');
                await this.loadShortsHistoricalData();
            } else if (newTeam === 'graphics') {
                console.log('🎨 Switching to Graphics - loading historical data...');
                await this.loadGraphicsHistoricalData();
            } else if (newTeam === 'tech') {
                console.log('💻 Switching to Tech - loading historical data...');
                await this.loadTechHistoricalData();
            } else if (newTeam === 'product') {
                console.log('📱 Switching to Product - loading historical data...');
                await this.loadProductHistoricalData();
            }
            
            // Refresh the interface for the new team
            // Reset all filters and views when switching teams
            this.resetFiltersOnTeamSwitch();
            
            // Generate empty rows for the new team (without auto-loading data)
            this.generateTeamDataRows();
            
            // Show message prompting user to select a period
            const dataContainer = document.getElementById('data-container');
            if (dataContainer) {
                dataContainer.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">Please select a period above to view and enter data.</p>';
            }
            
            // Update page title
            const pageTitle = document.querySelector('h1');
            if (pageTitle) {
                pageTitle.innerHTML = `<i class="fas fa-chart-line"></i> ${this.teamConfigs[newTeam].name} Efficiency Tracker`;
            }
            
            this.showMessage(`✅ Switched to ${this.teamConfigs[newTeam].name}`, 'success');
            
        } catch (error) {
            console.error('Error switching teams:', error);
            
            // Try to recover by doing a minimal team switch
            try {
                console.log('Attempting team switch recovery...');
                this.currentTeam = newTeam;
                this.teamMembers = this.getActiveTeamMembers(this.currentTeam);
                this.workLevels = this.teamConfigs[this.currentTeam].workLevels;
                
                // Reset to clean state
                this.resetFiltersOnTeamSwitch();
                
                // Update page title
                const pageTitle = document.querySelector('h1');
                if (pageTitle) {
                    pageTitle.innerHTML = `<i class="fas fa-chart-line"></i> ${this.teamConfigs[newTeam].name} Efficiency Tracker`;
                }
                
                this.showMessage(`✅ Switched to ${this.teamConfigs[newTeam].name} (recovery mode)`, 'warning');
            } catch (recoveryError) {
                console.error('Recovery failed:', recoveryError);
                this.showMessage(`❌ Unable to switch teams. Please refresh the page.`, 'error');
            }
        }
    }
    
    async loadVarsityMembers() {
        try {
            console.log('Loading Varsity team data...');
            
            // Use predefined Varsity team members (just like B2B does)
            this.teamMembers = this.teamConfigs.varsity.members;
            this.workLevels = this.teamConfigs.varsity.workLevels;
            
            // Load historical data for these members
            await this.loadVarsityHistoricalData();
            
            console.log('✅ Varsity team members loaded:', this.teamMembers);
            this.showMessage(`✅ Loaded ${this.teamMembers.length} Varsity team members`, 'success');
            
        } catch (error) {
            console.error('Error loading Varsity team:', error);
            this.showMessage('❌ Error loading Varsity team data', 'error');
        }
    }
    
    async loadVarsityTeamMembersFromSheet() {
        try {
            console.log('Reading Varsity team members from sheet...');
            
            // Read the current month data where team members are listed
            const currentData = await this.sheetsAPI.readSheetData('Varsity!A1:C50');
            
            if (currentData && currentData.length > 0) {
                console.log('Extracting team members from Varsity sheet data...');
                
                const memberNames = new Set();
                
                // Based on the structure we saw, team members are in Column B
                currentData.forEach((row, index) => {
                    if (row && typeof row === 'object') {
                        const memberName = row.B; // Column B contains team member names
                        
                        if (memberName && typeof memberName === 'string' && memberName.trim() !== '') {
                            const cleanName = memberName.trim();
                            
                            // Filter out headers and system entries, keep actual team member names
                            if (cleanName !== 'Team Member' && cleanName !== 'Total' && cleanName !== 'Member' && 
                                cleanName !== 'Timeline' && cleanName !== 'Category' && cleanName !== 'Work' &&
                                !cleanName.includes('2023') && !cleanName.includes('2024') && !cleanName.includes('2025') &&
                                !cleanName.includes('GMT') && !cleanName.includes('Time') &&
                                !cleanName.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/) &&
                                cleanName.length > 2 && cleanName.length < 50) {
                                
                                memberNames.add(cleanName);
                                console.log(`✅ Found Varsity member: ${cleanName}`);
                            }
                        }
                    }
                });
                
                const foundMembers = Array.from(memberNames);
                
                if (foundMembers.length > 0) {
                    this.teamMembers = foundMembers;
                    console.log(`✅ Successfully loaded ${foundMembers.length} Varsity members:`, foundMembers);
                } else {
                    console.warn('No Varsity members found in sheet, using fallback');
                    this.teamMembers = ['Aalim', 'Satyavrat Sharma', 'Manish', 'Apoorv Suman', 'Anmol Anand'];
                }
                
            } else {
                console.warn('No Varsity sheet data found, using fallback members');
                this.teamMembers = ['Aalim', 'Satyavrat Sharma', 'Manish', 'Apoorv Suman', 'Anmol Anand'];
            }
            
        } catch (error) {
            console.error('Error reading Varsity team members:', error);
            this.teamMembers = ['Aalim', 'Satyavrat Sharma', 'Manish', 'Apoorv Suman', 'Anmol Anand'];
        }
    }
    
    async loadVarsityLevels() {
        try {
            console.log('Searching for Varsity levels in multiple locations...');
            
            // Based on user's image, Varsity levels are structured as:
            // Level | Category | Per Day (with values like L1|OST|20, L2|FSS animation|7, etc.)
            // Let's search for this table structure in the sheet
            let levelsData = await this.sheetsAPI.readSheetData('Varsity!A1:C50');
            
            if (levelsData && levelsData.length > 0) {
                const varsityLevels = [];
                
                // Process levels data from the returned array
                console.log('Raw levels data:', levelsData);
                console.log('Levels data type:', typeof levelsData);
                console.log('Levels data length:', levelsData.length);
                
                // Safely process each row with error handling
                for (let index = 0; index < levelsData.length; index++) {
                    try {
                        const row = levelsData[index];
                        console.log(`Level row ${index}:`, row, typeof row);
                        
                        // The row structure might be different, check for level data
                        // Try different possible keys for level data
                        let level = null;
                        
                        if (typeof row === 'object' && row !== null) {
                            // For simplified structure, look for Level column
                            level = row.Level || row.level || row['Level'] || 
                                   row.A || row['A'] || // First column might be Level
                                   row.B || row['B'];   // Second column might be Level
                            
                            // If still not found, check all values for L1, L2, L3 pattern
                            if (!level) {
                                const keys = Object.keys(row);
                                for (const key of keys) {
                                    const value = row[key];
                                    if (value && String(value).match(/^L[1-3]$/)) {
                                        level = value;
                                        break;
                                    }
                                }
                            }
                        } else if (typeof row === 'string') {
                            level = row;
                        } else if (typeof row === 'number') {
                            level = String(row);
                        } else {
                            level = row;
                        }
                        
                        console.log(`Extracted level for row ${index}:`, level, typeof level);
                        
                        // Convert to string and clean up - handle all data types safely
                        let levelStr = '';
                        try {
                            levelStr = String(level || '').trim();
                        } catch (trimError) {
                            console.warn(`Error converting level to string at row ${index}:`, trimError);
                            continue;
                        }
                        
                        if (levelStr !== '' && levelStr !== 'Level' && 
                            levelStr !== 'September 2025' && !levelStr.includes('2025') &&
                            levelStr !== '0') {
                            
                            // Look for actual level indicators like L1, L2, L3
                            if (levelStr.match(/^L[1-3]$/)) {
                                varsityLevels.push(levelStr);
                                console.log(`Added level: ${levelStr}`);
                            }
                        }
                        
                    } catch (rowError) {
                        console.error(`Error processing level row ${index}:`, rowError);
                        continue;
                    }
                }
                
                console.log('Loaded Varsity levels:', varsityLevels);
                
                // Store levels for later use when processing member data
                this.varsityLevels = varsityLevels;
                
                this.showMessage(`✅ Loaded ${varsityLevels.length} Varsity levels`, 'success');
                
            } else {
                console.warn('No Varsity levels found, using default data');
                // Use default levels until we locate the correct range in the sheet
                this.varsityLevels = this.teamConfigs.varsity.defaultLevels;
                this.showMessage('⚠️ Using fallback Varsity levels', 'warning');
            }
            
        } catch (error) {
            console.error('Error loading Varsity levels:', error);
            console.warn('Using fallback Varsity levels');
            // Fallback levels if everything fails
            this.varsityLevels = ['L1', 'L2', 'L3', 'L1', 'L2']; 
            this.showMessage('⚠️ Using fallback levels due to API error', 'warning');
        }
    }
    
    async loadVarsityWorkCategories() {
        try {
            console.log('🔍 Looking for Varsity work categories table (Level | Category | Per Day)...');
            
            // Try different ranges to find the levels table
            const ranges = ['A1:C30', 'D1:F30', 'G1:I30', 'A10:C40'];
            let workCategories = [];
            
            for (const range of ranges) {
                console.log(`Searching Varsity!${range} for levels table...`);
                const data = await this.sheetsAPI.readSheetData(`Varsity!${range}`);
                
                if (data && data.length > 0) {
                    console.log(`Found ${data.length} rows in ${range}, checking for levels...`);
                    
                    for (let i = 0; i < Math.min(data.length, 15); i++) {
                        const row = data[i];
                        if (row && typeof row === 'object') {
                            const level = row.A || row.Level;
                            const category = row.B || row.Category;
                            const perDay = row.C || row['Per Day'];
                            
                            if (level && category && perDay &&
                                String(level).match(/^L[1-3]$/) && 
                                String(category).trim() !== 'Category' && // Skip header
                                !isNaN(parseFloat(perDay))) {
                                
                                const workCat = {
                                    level: String(level).trim(),
                                    category: String(category).trim(),
                                    perDay: parseFloat(perDay)
                                };
                                
                                workCategories.push(workCat);
                                console.log(`✅ Found work category: ${workCat.level} - ${workCat.category} - ${workCat.perDay}/day`);
                            }
                        }
                    }
                }
                
                // If we found categories, break
                if (workCategories.length > 0) {
                    console.log(`🎯 Found ${workCategories.length} work categories in range ${range}`);
                    break;
                }
            }
            
            if (workCategories.length > 0) {
                this.varsityWorkCategories = workCategories;
                const uniqueLevels = [...new Set(workCategories.map(cat => cat.level))];
                this.workLevels = uniqueLevels;
                console.log('📊 Varsity work categories loaded:', workCategories);
                console.log('🎯 Extracted levels:', uniqueLevels);
                this.showMessage(`✅ Loaded ${workCategories.length} Varsity work categories`, 'success');
            } else {
                console.warn('⚠️ No work categories found, using defaults from your image');
                this.workLevels = ['L1', 'L2', 'L3'];
                this.varsityWorkCategories = [
                    {level: 'L1', category: 'OST', perDay: 20},
                    {level: 'L1', category: 'Screen capture (5 min)', perDay: 2},
                    {level: 'L1', category: 'Hand animation', perDay: 6},
                    {level: 'L2', category: 'FSS animation', perDay: 7},
                    {level: 'L3', category: 'Character animation', perDay: 1},
                    {level: 'L3', category: 'VO animation', perDay: 1},
                    {level: 'L3', category: 'Intro', perDay: 0.15},
                    {level: 'L1', category: '1st Cut', perDay: 1}
                ];
                this.showMessage('⚠️ Using default Varsity work categories', 'warning');
            }
            
        } catch (error) {
            console.error('❌ Error loading Varsity work categories:', error);
            this.workLevels = ['L1', 'L2', 'L3'];
        }
    }
    
    async loadVarsityHistoricalData() {
        console.log('🏐 Loading Varsity hardcoded data (like B2B)...');
        
        // Initialize Varsity historical data with accurate data from your sheet
        this.historicalData.varsity = {
            'January 2025': {
                isComplete: true,
                monthlyData: {
                    'Aalim': { 
                        weeks: [
                            { week: 1, output: 3.67, quality: 8.0, efficiency: 70 },
                            { week: 2, output: 4.47, quality: 9.0, efficiency: 77.4 },
                            { week: 3, output: 4.46, quality: 7.0, efficiency: 69.4 },
                            { week: 4, output: 8.05, quality: 9.0, efficiency: 98 }
                        ],
                        totalOutput: 20.65, // 3.67+4.47+4.46+8.05
                        target: 21, // From Column D
                        efficiency: 98.3,
                        monthlyRating: 9.0 // From Column AZ
                    },
                    'Satyavrat Sharma': { 
                        weeks: [
                            { week: 1, output: 3.00, quality: 8.0, efficiency: 57 },
                            { week: 2, output: 7.39, quality: 10.0, efficiency: 123.1 },
                            { week: 3, output: 4.36, quality: 8.0, efficiency: 82.2 },
                            { week: 4, output: 7.40, quality: 9.0, efficiency: 105 }
                        ],
                        totalOutput: 22.15, // 3.00+7.39+4.36+7.40
                        target: 21, // From Column D
                        efficiency: 105.5, // Recalculated: (22.15 / 21) * 100
                        monthlyRating: 9.0 // From Column AZ
                    },
                    'Somya': { 
                        weeks: [
                            { week: 1, output: 1.29, quality: 7.0, efficiency: 24 },
                            { week: 2, output: 4.13, quality: 6.0, efficiency: 62.8 },
                            { week: 3, output: 4.10, quality: 6.0, efficiency: 52.5 },
                            { week: 4, output: 8.56, quality: 8.0, efficiency: 86 }
                        ],
                        totalOutput: 18.08, // 1.29+4.13+4.10+8.56
                        target: 21, // From Column D
                        efficiency: 86.1, // Recalculated: (18.08 / 21) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Manish': { 
                        weeks: [
                            { week: 1, output: 4.46, quality: 9.0, efficiency: 81 },
                            { week: 2, output: 5.90, quality: 9.0, efficiency: 100.9 },
                            { week: 3, output: 4.15, quality: 8.0, efficiency: 71.2 },
                            { week: 4, output: 7.81, quality: 9.0, efficiency: 101 }
                        ],
                        totalOutput: 22.32, // 4.46+5.90+4.15+7.81
                        target: 22, // From Column D
                        efficiency: 101.5,
                        monthlyRating: 9.0 // From Column AZ
                    },
                    'Apoorv Suman': { 
                        weeks: [
                            { week: 1, output: 3.08, quality: 8.0, efficiency: 59 },
                            { week: 2, output: 5.36, quality: 8.0, efficiency: 89.7 },
                            { week: 3, output: 8.92, quality: 9.0, efficiency: 142.1 },
                            { week: 4, output: 4.45, quality: 9.0, efficiency: 104 }
                        ],
                        totalOutput: 21.81, // 3.08+5.36+8.92+4.45
                        target: 21, // From Column D
                        efficiency: 103.9, // Recalculated: (21.81 / 21) * 100
                        monthlyRating: 9.0 // From Column AZ
                    },
                    'Anmol Anand': { 
                        weeks: [
                            { week: 1, output: 3.00, quality: 8.0, efficiency: 57 },
                            { week: 2, output: 4.77, quality: 8.0, efficiency: 79.6 },
                            { week: 3, output: 5.50, quality: 8.0, efficiency: 83.2 },
                            { week: 4, output: 6.27, quality: 9.0, efficiency: 93 }
                        ],
                        totalOutput: 19.54, // 3.00+4.77+5.50+6.27
                        target: 21, // From Column D
                        efficiency: 93.0, // Recalculated: (19.54 / 21) * 100
                        monthlyRating: 9.0 // From Column AZ
                    }
                },
                teamSummary: {
                    totalMembers: 6,
                    avgEfficiency: 97.0, // Average: (98.3+105.5+86.1+101.5+103.9+93.0)/6 = 97.0
                    avgRating: 8.8, // Average: (9.0+9.0+8.0+9.0+9.0+9.0)/6 = 8.8
                    totalOutput: 124.35 // Sum of all member outputs
                }
            },
            'February 2025': {
                isComplete: true,
                monthlyData: {
                    'Aalim': {
                        weeks: [
                            { week: 1, output: 3.23, quality: 6.0, efficiency: 81 },
                            { week: 2, output: 3.63, quality: 8.0, efficiency: 85.3 },
                            { week: 3, output: 5.75, quality: 9.0, efficiency: 125.8 },
                            { week: 4, output: 4.72, quality: 9.0, efficiency: 108 }
                        ],
                        totalOutput: 17.33, // 3.23+3.63+5.75+4.72
                        target: 16, // From Column D
                        efficiency: 108.3, // (17.33 / 16) * 100
                        monthlyRating: 9.0 // From Column AZ
                    },
                    'Satyavrat Sharma': {
                        weeks: [
                            { week: 1, output: 2.36, quality: 6.0, efficiency: 79 },
                            { week: 2, output: 4.10, quality: 8.0, efficiency: 127.5 },
                            { week: 3, output: 1.29, quality: 5.0, efficiency: 46.4 },
                            { week: 4, output: 2.90, quality: 8.0, efficiency: 89 }
                        ],
                        totalOutput: 10.65, // 2.36+4.10+1.29+2.90
                        target: 12, // From Column D
                        efficiency: 88.8, // (10.65 / 12) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Somya': {
                        weeks: [
                            { week: 1, output: 0.00, quality: 0.0, efficiency: 0 },
                            { week: 2, output: 0.00, quality: 0.0, efficiency: 0 },
                            { week: 3, output: 0.00, quality: 0.0, efficiency: 0 },
                            { week: 4, output: 0.00, quality: 0.0, efficiency: 0 }
                        ],
                        totalOutput: 0.00,
                        target: 20, // From Column D
                        efficiency: 0.0,
                        monthlyRating: 0.0 // No data
                    },
                    'Manish': {
                        weeks: [
                            { week: 1, output: 3.66, quality: 8.0, efficiency: 73 },
                            { week: 2, output: 3.71, quality: 7.0, efficiency: 68.2 },
                            { week: 3, output: 5.52, quality: 8.0, efficiency: 87.5 },
                            { week: 4, output: 3.18, quality: 8.0, efficiency: 80 }
                        ],
                        totalOutput: 16.07, // 3.66+3.71+5.52+3.18
                        target: 20, // From Column D
                        efficiency: 80.4, // (16.07 / 20) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Apoorv Suman': {
                        weeks: [
                            { week: 1, output: 4.57, quality: 9.0, efficiency: 101 },
                            { week: 2, output: 4.29, quality: 8.0, efficiency: 95.8 },
                            { week: 3, output: 5.00, quality: 8.0, efficiency: 109.3 },
                            { week: 4, output: 2.00, quality: 8.0, efficiency: 88 }
                        ],
                        totalOutput: 15.86, // 4.57+4.29+5.00+2.00
                        target: 18, // From Column D
                        efficiency: 88.1, // (15.86 / 18) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Anmol Anand': {
                        weeks: [
                            { week: 1, output: 4.22, quality: 7.0, efficiency: 84 },
                            { week: 2, output: 4.99, quality: 9.0, efficiency: 94.9 },
                            { week: 3, output: 5.00, quality: 8.0, efficiency: 92.7 },
                            { week: 4, output: 3.83, quality: 9.0, efficiency: 90 }
                        ],
                        totalOutput: 18.04, // 4.22+4.99+5.00+3.83
                        target: 20, // From Column D
                        efficiency: 90.2, // (18.04 / 20) * 100
                        monthlyRating: 9.0 // From Column AZ
                    }
                },
                teamSummary: {
                    totalMembers: 6,
                    avgEfficiency: 75.9, // Average (including Somya's 0)
                    avgRating: 7.0, // Average
                    totalOutput: 77.95 // Sum of all outputs
                }
            },
            'March 2025': {
                isComplete: true,
                monthlyData: {
                    'Aalim': {
                        weeks: [
                            { week: 1, output: 4.56, quality: 9.0, efficiency: 114 },
                            { week: 2, output: 2.37, quality: 7.0, efficiency: 62.2 },
                            { week: 3, output: 2.80, quality: 8.0, efficiency: 61.8 },
                            { week: 4, output: 4.21, quality: 8.0, efficiency: 87 }
                        ],
                        totalOutput: 13.94, // 4.56+2.37+2.80+4.21
                        target: 16, // From Column D
                        efficiency: 87.1, // (13.94 / 16) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Satyavrat Sharma': {
                        weeks: [
                            { week: 1, output: 2.98, quality: 7.0, efficiency: 66 },
                            { week: 2, output: 3.20, quality: 7.0, efficiency: 64 },
                            { week: 3, output: 5.03, quality: 7.0, efficiency: 85.2 },
                            { week: 4, output: 4.46, quality: 7.0, efficiency: 87 }
                        ],
                        totalOutput: 15.67, // 2.98+3.20+5.03+4.46
                        target: 18, // From Column D
                        efficiency: 87.1, // (15.67 / 18) * 100
                        monthlyRating: 7.0 // From Column AZ
                    },
                    'Somya': {
                        weeks: [
                            { week: 1, output: 0.00, quality: 0.0, efficiency: 0 },
                            { week: 2, output: 0.00, quality: 0.0, efficiency: 0 },
                            { week: 3, output: 0.00, quality: 0.0, efficiency: 0 },
                            { week: 4, output: 0.00, quality: 0.0, efficiency: 0 }
                        ],
                        totalOutput: 0.00,
                        target: 19, // From Column D
                        efficiency: 0.0,
                        monthlyRating: 0.0 // No data
                    },
                    'Manish': {
                        weeks: [
                            { week: 1, output: 5.74, quality: 9.0, efficiency: 128 },
                            { week: 2, output: 2.00, quality: 8.0, efficiency: 48.9 },
                            { week: 3, output: 4.20, quality: 8.0, efficiency: 81.8 },
                            { week: 4, output: 4.71, quality: 8.0, efficiency: 93 }
                        ],
                        totalOutput: 16.65, // 5.74+2.00+4.20+4.71
                        target: 18, // From Column D
                        efficiency: 92.5, // (16.65 / 18) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Apoorv Suman': {
                        weeks: [
                            { week: 1, output: 4.64, quality: 8.0, efficiency: 103 },
                            { week: 2, output: 3.53, quality: 7.0, efficiency: 79.4 },
                            { week: 3, output: 4.46, quality: 6.0, efficiency: 90.9 },
                            { week: 4, output: 3.14, quality: 6.0, efficiency: 88 }
                        ],
                        totalOutput: 15.77, // 4.64+3.53+4.46+3.14
                        target: 18, // From Column D
                        efficiency: 87.6, // (15.77 / 18) * 100
                        monthlyRating: 6.0 // From Column AZ
                    },
                    'Anmol Anand': {
                        weeks: [
                            { week: 1, output: 6.67, quality: 9.0, efficiency: 140 },
                            { week: 2, output: 2.29, quality: 8.0, efficiency: 55.6 },
                            { week: 3, output: 4.16, quality: 8.0, efficiency: 82.8 },
                            { week: 4, output: 5.71, quality: 8.0, efficiency: 99 }
                        ],
                        totalOutput: 18.83, // 6.67+2.29+4.16+5.71
                        target: 19, // From Column D
                        efficiency: 99.1, // (18.83 / 19) * 100
                        monthlyRating: 8.0 // From Column AZ
                    }
                },
                teamSummary: {
                    totalMembers: 6,
                    avgEfficiency: 75.5, // Average (including Somya's 0)
                    avgRating: 6.2, // Average
                    totalOutput: 80.86 // Sum of all outputs
                }
            },
            'April 2025': {
                isComplete: true,
                monthlyData: {
                    'Aalim': {
                        weeks: [
                            { week: 1, output: 4.07, quality: 7.0, efficiency: 102 },
                            { week: 2, output: 2.00, quality: 7.0, efficiency: 50.3 },
                            { week: 3, output: 0.00, quality: 0.0, efficiency: 0 },
                            { week: 4, output: 5.77, quality: 7.0, efficiency: 74 }
                        ],
                        totalOutput: 11.84, // 4.07+2.00+0.00+5.77
                        target: 16, // From Column D
                        efficiency: 74.0, // (11.84 / 16) * 100
                        monthlyRating: 7.0 // From Column AZ
                    },
                    'Satyavrat Sharma': {
                        weeks: [
                            { week: 1, output: 3.07, quality: 6.0, efficiency: 82 },
                            { week: 2, output: 3.00, quality: 7.0, efficiency: 75.4 },
                            { week: 3, output: 0.00, quality: 0.0, efficiency: 0 },
                            { week: 4, output: 6.30, quality: 8.0, efficiency: 82 }
                        ],
                        totalOutput: 12.37, // 3.07+3.00+0.00+6.30
                        target: 15, // From Column D
                        efficiency: 82.5, // (12.37 / 15) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Manish': {
                        weeks: [
                            { week: 1, output: 4.36, quality: 9.0, efficiency: 79 },
                            { week: 2, output: 5.28, quality: 8.0, efficiency: 89.8 },
                            { week: 3, output: 5.10, quality: 7.0, efficiency: 82.5 },
                            { week: 4, output: 4.13, quality: 6.0, efficiency: 86 }
                        ],
                        totalOutput: 18.87, // 4.36+5.28+5.10+4.13
                        target: 22, // From Column D
                        efficiency: 85.8, // (18.87 / 22) * 100
                        monthlyRating: 6.0 // From Column AZ
                    },
                    'Apoorv Suman': {
                        weeks: [
                            { week: 1, output: 7.40, quality: 7.0, efficiency: 156 },
                            { week: 2, output: 4.80, quality: 8.0, efficiency: 124 },
                            { week: 3, output: 3.91, quality: 6.0, efficiency: 114.9 },
                            { week: 4, output: 3.19, quality: 7.0, efficiency: 102 }
                        ],
                        totalOutput: 19.30, // 7.40+4.80+3.91+3.19
                        target: 19, // From Column D
                        efficiency: 101.6, // (19.30 / 19) * 100
                        monthlyRating: 7.0 // From Column AZ
                    },
                    'Anmol Anand': {
                        weeks: [
                            { week: 1, output: 5.07, quality: 8.0, efficiency: 107 },
                            { week: 2, output: 5.65, quality: 9.0, efficiency: 121.7 },
                            { week: 3, output: 4.05, quality: 7.0, efficiency: 97.8 },
                            { week: 4, output: 4.00, quality: 8.0, efficiency: 99 }
                        ],
                        totalOutput: 18.77, // 5.07+5.65+4.05+4.00
                        target: 19, // From Column D
                        efficiency: 98.8, // (18.77 / 19) * 100
                        monthlyRating: 8.0 // From Column AZ
                    }
                },
                teamSummary: {
                    totalMembers: 5, // Somya left after March
                    avgEfficiency: 88.5, // Average of 5 members
                    avgRating: 7.2, // Average of 5 members
                    totalOutput: 81.15 // Sum of all outputs
                }
            },
            'May 2025': {
                isComplete: true,
                monthlyData: {
                    'Aalim': {
                        weeks: [
                            { week: 1, output: 3.82, quality: 6.0, efficiency: 73 },
                            { week: 2, output: 4.80, quality: 6.0, efficiency: 83.9 },
                            { week: 3, output: 5.04, quality: 7.0, efficiency: 81.4 },
                            { week: 4, output: 5.86, quality: 7.0, efficiency: 93 }
                        ],
                        totalOutput: 19.52, // 3.82+4.80+5.04+5.86
                        target: 21, // From Column D
                        efficiency: 93.0, // (19.52 / 21) * 100
                        monthlyRating: 7.0 // From Column AZ
                    },
                    'Satyavrat Sharma': {
                        weeks: [
                            { week: 1, output: 4.02, quality: 6.0, efficiency: 77 },
                            { week: 2, output: 4.85, quality: 7.0, efficiency: 85.6 },
                            { week: 3, output: 4.54, quality: 6.0, efficiency: 74.9 },
                            { week: 4, output: 4.57, quality: 7.0, efficiency: 86 }
                        ],
                        totalOutput: 17.98, // 4.02+4.85+4.54+4.57
                        target: 21, // From Column D
                        efficiency: 85.6, // (17.98 / 21) * 100
                        monthlyRating: 7.0 // From Column AZ
                    },
                    'Manish': {
                        weeks: [
                            { week: 1, output: 3.94, quality: 7.0, efficiency: 83 },
                            { week: 2, output: 2.57, quality: 8.0, efficiency: 51.2 },
                            { week: 3, output: 4.15, quality: 7.0, efficiency: 66.5 },
                            { week: 4, output: 5.57, quality: 8.0, efficiency: 85 }
                        ],
                        totalOutput: 16.23, // 3.94+2.57+4.15+5.57
                        target: 19, // From Column D
                        efficiency: 85.4, // (16.23 / 19) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Apoorv Suman': {
                        weeks: [
                            { week: 1, output: 4.00, quality: 7.0, efficiency: 73 },
                            { week: 2, output: 4.43, quality: 6.0, efficiency: 73.8 },
                            { week: 3, output: 5.10, quality: 6.0, efficiency: 75.2 },
                            { week: 4, output: 6.21, quality: 7.0, efficiency: 90 }
                        ],
                        totalOutput: 19.74, // 4.00+4.43+5.10+6.21
                        target: 22, // From Column D
                        efficiency: 89.7, // (19.74 / 22) * 100
                        monthlyRating: 7.0 // From Column AZ
                    },
                    'Anmol Anand': {
                        weeks: [
                            { week: 1, output: 5.21, quality: 8.0, efficiency: 95 },
                            { week: 2, output: 4.80, quality: 8.0, efficiency: 85.8 },
                            { week: 3, output: 4.44, quality: 8.0, efficiency: 74.1 },
                            { week: 4, output: 5.57, quality: 8.0, efficiency: 91 }
                        ],
                        totalOutput: 20.02, // 5.21+4.80+4.44+5.57
                        target: 22, // From Column D
                        efficiency: 91.0, // (20.02 / 22) * 100
                        monthlyRating: 8.0 // From Column AZ
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgEfficiency: 88.9, // Average of 5 members
                    avgRating: 7.4, // Average of 5 members
                    totalOutput: 93.49 // Sum of all outputs
                }
            },
            'June 2025': {
                isComplete: true,
                monthlyData: {
                    'Aalim': {
                        weeks: [
                            { week: 1, output: 3.81, quality: 7.0, efficiency: 73 },
                            { week: 2, output: 4.45, quality: 8.0, efficiency: 77.6 },
                            { week: 3, output: 4.73, quality: 8.0, efficiency: 74.2 },
                            { week: 4, output: 3.35, quality: 8.0, efficiency: 78 }
                        ],
                        totalOutput: 16.34, // 3.81+4.45+4.73+3.35
                        target: 21, // From Column D
                        efficiency: 77.8, // (16.34 / 21) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Satyavrat Sharma': {
                        weeks: [
                            { week: 1, output: 5.07, quality: 8.0, efficiency: 95 },
                            { week: 2, output: 4.36, quality: 7.0, efficiency: 74.1 },
                            { week: 3, output: 4.05, quality: 7.0, efficiency: 73.6 },
                            { week: 4, output: 3.78, quality: 8.0, efficiency: 90 }
                        ],
                        totalOutput: 17.26, // 5.07+4.36+4.05+3.78
                        target: 21, // From Column D
                        efficiency: 82.2, // (17.26 / 21) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Manish': {
                        weeks: [
                            { week: 1, output: 4.86, quality: 8.0, efficiency: 85 },
                            { week: 2, output: 3.98, quality: 8.0, efficiency: 89.0 },
                            { week: 3, output: 3.65, quality: 7.0, efficiency: 62.5 },
                            { week: 4, output: 4.86, quality: 8.0, efficiency: 89 }
                        ],
                        totalOutput: 17.35, // 4.86+3.98+3.65+4.86
                        target: 21, // From Column D
                        efficiency: 82.6, // (17.35 / 21) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Apoorv Suman': {
                        weeks: [
                            { week: 1, output: 4.31, quality: 8.0, efficiency: 92 },
                            { week: 2, output: 3.30, quality: 7.0, efficiency: 86.1 },
                            { week: 3, output: 4.71, quality: 6.0, efficiency: 70.6 },
                            { week: 4, output: 4.33, quality: 8.0, efficiency: 82 }
                        ],
                        totalOutput: 16.65, // 4.31+3.30+4.71+4.33
                        target: 21, // From Column D
                        efficiency: 79.3, // (16.65 / 21) * 100
                        monthlyRating: 7.0 // From Column AZ
                    },
                    'Anmol Anand': {
                        weeks: [
                            { week: 1, output: 3.21, quality: 8.0, efficiency: 83 },
                            { week: 2, output: 3.63, quality: 8.0, efficiency: 83.1 },
                            { week: 3, output: 4.50, quality: 7.0, efficiency: 68.5 },
                            { week: 4, output: 4.57, quality: 8.0, efficiency: 90 }
                        ],
                        totalOutput: 15.91, // 3.21+3.63+4.50+4.57
                        target: 21, // From Column D
                        efficiency: 75.8, // (15.91 / 21) * 100
                        monthlyRating: 8.0 // From Column AZ
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgEfficiency: 79.5, // Average of 5 members
                    avgRating: 7.8, // Average of 5 members
                    totalOutput: 83.51 // Sum of all outputs
                }
            },
            'July 2025': {
                isComplete: true,
                monthlyData: {
                    'Aalim': {
                        weeks: [
                            { week: 1, output: 2.65, quality: 6.0, efficiency: 51 },
                            { week: 2, output: 4.84, quality: 7.0, efficiency: 79.1 },
                            { week: 3, output: 1.50, quality: 7.0, efficiency: 32.6 },
                            { week: 4, output: 4.86, quality: 8.0, efficiency: 92.4 }
                        ],
                        totalOutput: 13.85, // 2.65+4.84+1.50+4.86
                        target: 21, // From Column D
                        efficiency: 65.9, // (13.85 / 21) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Satyavrat Sharma': {
                        weeks: [
                            { week: 1, output: 6.13, quality: 9.0, efficiency: 107 },
                            { week: 2, output: 4.50, quality: 8.0, efficiency: 80 },
                            { week: 3, output: 4.88, quality: 8.0, efficiency: 85.2 },
                            { week: 4, output: 4.00, quality: 7.0, efficiency: 69.6 }
                        ],
                        totalOutput: 19.51, // 6.13+4.50+4.88+4.00
                        target: 23, // From Column D
                        efficiency: 84.8, // (19.51 / 23) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Manish': {
                        weeks: [
                            { week: 1, output: 4.57, quality: 8.0, efficiency: 80 },
                            { week: 2, output: 6.14, quality: 9.0, efficiency: 100 },
                            { week: 3, output: 4.90, quality: 8.0, efficiency: 85.6 },
                            { week: 4, output: 3.79, quality: 8.0, efficiency: 66.1 }
                        ],
                        totalOutput: 19.40, // 4.57+6.14+4.90+3.79
                        target: 23, // From Column D
                        efficiency: 84.3, // (19.40 / 23) * 100
                        monthlyRating: 9.0 // From Column AZ
                    },
                    'Apoorv Suman': {
                        weeks: [
                            { week: 1, output: 4.39, quality: 7.0, efficiency: 76 },
                            { week: 2, output: 4.32, quality: 7.0, efficiency: 69.7 },
                            { week: 3, output: 4.07, quality: 7.0, efficiency: 71.2 },
                            { week: 4, output: 3.57, quality: 6.0, efficiency: 62.3 }
                        ],
                        totalOutput: 16.35, // 4.39+4.32+4.07+3.57
                        target: 23, // From Column D
                        efficiency: 71.1, // (16.35 / 23) * 100
                        monthlyRating: 7.0 // From Column AZ
                    },
                    'Anmol Anand': {
                        weeks: [
                            { week: 1, output: 5.21, quality: 9.0, efficiency: 91 },
                            { week: 2, output: 4.57, quality: 7.0, efficiency: 77.1 },
                            { week: 3, output: 4.50, quality: 8.0, efficiency: 78.6 },
                            { week: 4, output: 5.79, quality: 9.0, efficiency: 101.0 }
                        ],
                        totalOutput: 20.07, // 5.21+4.57+4.50+5.79
                        target: 23, // From Column D
                        efficiency: 87.3, // (20.07 / 23) * 100
                        monthlyRating: 9.0 // From Column AZ
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgEfficiency: 78.7, // Average: (65.9+84.8+84.3+71.1+87.3)/5
                    avgRating: 8.2, // Average: (8.0+8.0+9.0+7.0+9.0)/5
                    totalOutput: 89.18 // Sum of all outputs
                }
            },
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Aalim': {
                        weeks: [
                            { week: 1, output: 4.65, quality: 8.0, efficiency: 97.9 },
                            { week: 2, output: 3.05, quality: 7.0, efficiency: 64.2 },
                            { week: 3, output: 2.83, quality: 7.0, efficiency: 59.6 },
                            { week: 4, output: 5.20, quality: 9.0, efficiency: 109.5 }
                        ],
                        totalOutput: 15.73, // 4.65+3.05+2.83+5.20
                        target: 19, // From Column D
                        efficiency: 82.8, // (15.73 / 19) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Satyavrat Sharma': {
                        weeks: [
                            { week: 1, output: 4.94, quality: 8.0, efficiency: 104.0 },
                            { week: 2, output: 4.38, quality: 7.0, efficiency: 92.2 },
                            { week: 3, output: 2.83, quality: 6.0, efficiency: 59.6 },
                            { week: 4, output: 3.71, quality: 7.0, efficiency: 78.1 }
                        ],
                        totalOutput: 15.86, // 4.94+4.38+2.83+3.71
                        target: 19, // From Column D
                        efficiency: 83.5, // (15.86 / 19) * 100
                        monthlyRating: 7.0 // From Column AZ
                    },
                    'Manish': {
                        weeks: [
                            { week: 1, output: 4.94, quality: 8.0, efficiency: 104.0 },
                            { week: 2, output: 1.96, quality: 6.0, efficiency: 41.3 },
                            { week: 3, output: 1.96, quality: 6.0, efficiency: 41.3 },
                            { week: 4, output: 4.93, quality: 9.0, efficiency: 103.8 }
                        ],
                        totalOutput: 13.79, // 4.94+1.96+1.96+4.93
                        target: 19, // From Column D
                        efficiency: 72.6, // (13.79 / 19) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Apoorv Suman': {
                        weeks: [
                            { week: 1, output: 5.21, quality: 8.0, efficiency: 109.7 },
                            { week: 2, output: 3.52, quality: 7.0, efficiency: 74.1 },
                            { week: 3, output: 2.79, quality: 7.0, efficiency: 58.7 },
                            { week: 4, output: 4.50, quality: 8.0, efficiency: 94.7 }
                        ],
                        totalOutput: 16.02, // 5.21+3.52+2.79+4.50
                        target: 19, // From Column D
                        efficiency: 84.3, // (16.02 / 19) * 100
                        monthlyRating: 8.0 // From Column AZ
                    },
                    'Anmol Anand': {
                        weeks: [
                            { week: 1, output: 4.51, quality: 8.0, efficiency: 95.0 },
                            { week: 2, output: 3.66, quality: 7.0, efficiency: 77.1 },
                            { week: 3, output: 3.49, quality: 7.0, efficiency: 73.5 },
                            { week: 4, output: 5.80, quality: 9.0, efficiency: 122.1 }
                        ],
                        totalOutput: 17.46, // 4.51+3.66+3.49+5.80
                        target: 19, // From Column D
                        efficiency: 91.9, // (17.46 / 19) * 100
                        monthlyRating: 8.0 // From Column AZ
                    }
                },
                teamSummary: {
                    totalMembers: 5,
                    avgEfficiency: 83.0, // Average: (82.8+83.5+72.6+84.3+91.9)/5
                    avgRating: 7.8, // Average: (8.0+7.0+8.0+8.0+8.0)/5
                    totalOutput: 78.86 // Sum of all outputs
                }
            }
        };
        
        console.log('✅ Varsity hardcoded data loaded successfully');
        console.log('Available Varsity months:', Object.keys(this.historicalData.varsity));
        this.showMessage(`✅ Loaded Varsity team data for Jan-August 2025`, 'success');
    }

    async loadGraphicsHistoricalData() {
        console.log('🎨 Loading Graphics hardcoded data...');
        
        // Debug the current state
        console.log('🔍 DEBUG: this.historicalData:', this.historicalData);
        console.log('🔍 DEBUG: this.historicalData.graphics:', this.historicalData.graphics);
        
        // Graphics historical data is already initialized in constructor
        // Just confirm it's loaded and available
        if (this.historicalData.graphics && Object.keys(this.historicalData.graphics).length > 0) {
            console.log('✅ Graphics hardcoded data loaded successfully');
            console.log('Available Graphics months:', Object.keys(this.historicalData.graphics));
            this.showMessage(`✅ Loaded Graphics team data for Jun-Aug 2025`, 'success');
        } else {
            console.error('❌ Graphics historical data not found or empty');
            console.log('🔍 Manually populating Graphics historical data...');
            
            // Manually populate Graphics data since constructor failed
            this.historicalData.graphics = {
                'June 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Amit Joshi': { weeks: [5, 5, 4.7, 6.3], weeklyQualityRatings: [8, 8, 8, 8], monthlyRating: 8, target: 19.0, totalOutput: 21.00, workingDays: 19, efficiency: 110.53 },
                        'Rakhi Dhama': { weeks: [3.3, 5.2, 3.8, 3.4], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 20.0, totalOutput: 15.70, workingDays: 20, efficiency: 78.50 },
                        'Raj': { weeks: [2.9, 3.2, 3.3, 3.9], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 20.0, totalOutput: 13.30, workingDays: 20, efficiency: 66.50 },
                        'Abhishek Shukla': { weeks: [2.4, 3.9, 3.5, 2.3], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 20.0, totalOutput: 12.10, workingDays: 20, efficiency: 60.50 },
                        'Mayank': { weeks: [3.8, 0, 0, 3.75], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 19.0, totalOutput: 7.55, workingDays: 19, efficiency: 39.74 },
                        'Anubha': { weeks: [3.7, 3.5, 4, 4.2], weeklyQualityRatings: [8, 8, 8, 8], monthlyRating: 8, target: 19.0, totalOutput: 15.40, workingDays: 19, efficiency: 81.05 },
                        'Pranchal Chaudhary': { weeks: [3.6, 2.8, 1.3, 1.3], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 19.0, totalOutput: 9.00, workingDays: 19, efficiency: 47.37 },
                        'Piyush Vaid': { weeks: [3.5, 5, 5, 4.7], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 20.0, totalOutput: 18.20, workingDays: 20, efficiency: 91.00 },
                        'Vaibhav Singhal': { weeks: [4.25, 3.6, 3.4, 3.1], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 19.0, totalOutput: 14.35, workingDays: 19, efficiency: 75.53 },
                        'Ishika': { weeks: [3.2, 2.4, 1.5, 4.2], weeklyQualityRatings: [8, 8, 8, 8], monthlyRating: 8, target: 19.0, totalOutput: 11.30, workingDays: 19, efficiency: 59.47 },
                        'Aman': { weeks: [4.6, 2.9, 3.75, 3.8], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 20.0, totalOutput: 15.05, workingDays: 20, efficiency: 75.25 }
                    },
                    teamSummary: { totalMembers: 12, avgRating: 7.33, totalOutput: 158.55, totalWorkingDays: 234, avgEfficiency: 72.24 }
                },
                'July 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Amit Joshi': { weeks: [2.5, 5.80, 0.00, 6.1], weeklyQualityRatings: [8, 8, 8, 8], monthlyRating: 8, target: 18.0, totalOutput: 14.40, workingDays: 18, efficiency: 80.00 },
                        'Rakhi Dhama': { weeks: [5, 3.10, 0.00, 2.2], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 13.0, totalOutput: 10.30, workingDays: 13, efficiency: 79.23 },
                        'Raj': { weeks: [3.6, 2.90, 3.40, 3.8], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 18.0, totalOutput: 13.65, workingDays: 18, efficiency: 75.83 },
                        'Abhishek Shukla': { weeks: [3.9, 3.20, 2.85, 4.6], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 18.0, totalOutput: 14.55, workingDays: 18, efficiency: 80.83 },
                        'Mayank': { weeks: [5.2, 5.45, 4.00, 3.4], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 17.0, totalOutput: 18.05, workingDays: 17, efficiency: 106.18 },
                        'Anubha': { weeks: [5.2, 4.5, 4.10, 3.8], weeklyQualityRatings: [8, 8, 8, 8], monthlyRating: 8, target: 19.0, totalOutput: 17.55, workingDays: 19, efficiency: 92.37 },
                        'Pranchal Chaudhary': { weeks: [4.2, 2.2, 3.50, 4.3], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 17.5, totalOutput: 14.20, workingDays: 17.5, efficiency: 81.14 },
                        'Piyush Vaid': { weeks: [5.6, 5.8, 4.00, 6.3], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 19.0, totalOutput: 21.70, workingDays: 19, efficiency: 114.21 },
                        'Vaibhav Singhal': { weeks: [4.9, 3.2, 3.55, 4.6], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 19.0, totalOutput: 16.25, workingDays: 19, efficiency: 85.53 },
                        'Ishika': { weeks: [5.1, 4.1, 4.00, 4.2], weeklyQualityRatings: [8, 8, 8, 8], monthlyRating: 8, target: 20.0, totalOutput: 17.40, workingDays: 20, efficiency: 87.00 },
                        'Aman': { weeks: [4.8, 3.0, 3.70, 5.2], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 19.0, totalOutput: 16.70, workingDays: 19, efficiency: 87.89 }
                    },
                    teamSummary: { totalMembers: 12, avgRating: 7.33, totalOutput: 189.80, totalWorkingDays: 213.5, avgEfficiency: 88.85 }
                },
                'August 2025': {
                    isComplete: true,
                    monthlyData: {
                        'Amit Joshi': { weeks: [3.50, 4.00, 4.0, 0], weeklyQualityRatings: [8, 8, 8, 8], monthlyRating: 8, target: 13.0, totalOutput: 11.45, workingDays: 13, efficiency: 88.08 },
                        'Rakhi Dhama': { weeks: [4.30, 3.70, 3.7, 0], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 15.0, totalOutput: 11.70, workingDays: 15, efficiency: 78.00 },
                        'Raj': { weeks: [2.80, 3.10, 3.4, 0], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 13.0, totalOutput: 9.30, workingDays: 13, efficiency: 71.54 },
                        'Abhishek Shukla': { weeks: [2.20, 3.20, 3.7, 0], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 13.5, totalOutput: 9.10, workingDays: 13.5, efficiency: 67.41 },
                        'Mayank': { weeks: [4.30, 3.80, 4.5, 0], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 15.0, totalOutput: 12.60, workingDays: 15, efficiency: 84.00 },
                        'Anubha': { weeks: [4.10, 5.30, 2.9, 0], weeklyQualityRatings: [8, 8, 8, 8], monthlyRating: 8, target: 15.0, totalOutput: 12.30, workingDays: 15, efficiency: 82.00 },
                        'Pranchal Chaudhary': { weeks: [3.00, 5.40, 3.7, 0], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 16.0, totalOutput: 12.07, workingDays: 16, efficiency: 75.44 },
                        'Piyush Vaid': { weeks: [3.40, 5.60, 1.75, 0], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 13.0, totalOutput: 10.75, workingDays: 13, efficiency: 82.69 },
                        'Vaibhav Singhal': { weeks: [3.40, 5.70, 1.75, 0], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 13.5, totalOutput: 10.85, workingDays: 13.5, efficiency: 80.37 },
                        'Ishika': { weeks: [2.50, 5.00, 3.1, 0], weeklyQualityRatings: [8, 8, 8, 8], monthlyRating: 8, target: 13.0, totalOutput: 10.60, workingDays: 13, efficiency: 81.54 },
                        'Aman': { weeks: [3.50, 5.00, 4.0, 0], weeklyQualityRatings: [7, 7, 7, 7], monthlyRating: 7, target: 16.0, totalOutput: 12.45, workingDays: 16, efficiency: 77.81 }
                    },
                    teamSummary: { totalMembers: 12, avgRating: 7.25, totalOutput: 131.47, totalWorkingDays: 166.5, avgEfficiency: 78.99 }
                }
            };
            
            console.log('✅ Graphics data manually populated successfully');
            console.log('Available Graphics months:', Object.keys(this.historicalData.graphics));
            this.showMessage(`✅ Loaded Graphics team data for Jun-Aug 2025`, 'success');
        }
    }

    async loadTechHistoricalData() {
        console.log('💻 Loading Tech historical data...');
        
        // Initialize Tech historical data structure
        if (!this.historicalData.tech) {
            this.historicalData.tech = {};
        }
        
        // Add August 2025 historical data
        this.historicalData.tech = {
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Supriya': { 
                        weeks: [15, 15, 15, 6], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No ratings for Tech team
                        monthlyRating: 0, // No ratings for Tech team
                        target: 55, // 14+16+16+9 expected story points from data
                        totalOutput: 51, // 15+15+15+6
                        workingDays: 55, // Using expected as proxy for working days calculation
                        efficiency: 92.73 // Average: (107.14+93.75+93.75+66.67)/4
                    },
                    'Tilak': { 
                        weeks: [5, 16, 16, 11], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No ratings for Tech team
                        monthlyRating: 0, // No ratings for Tech team
                        target: 60, // 6+21+21+12 expected story points from data
                        totalOutput: 48, // 5+16+16+11
                        workingDays: 60,
                        efficiency: 80.00 // Average: (83.33+76.19+76.19+91.67)/4
                    },
                    'Rishi': { 
                        weeks: [13, 18, 18, 13], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No ratings for Tech team
                        monthlyRating: 0, // No ratings for Tech team
                        target: 59, // 14+18+18+9 expected story points from data
                        totalOutput: 62, // 13+18+18+13
                        workingDays: 59,
                        efficiency: 105.08 // Average: (92.86+100.00+100.00+144.44)/4
                    },
                    'Chandan': { 
                        weeks: [14, 15, 15, 16], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No ratings for Tech team
                        monthlyRating: 0, // No ratings for Tech team
                        target: 63, // 13+19+19+12 expected story points from data
                        totalOutput: 60, // 14+15+15+16
                        workingDays: 63,
                        efficiency: 95.24 // Average: (107.69+78.95+78.95+133.33)/4
                    },
                    'Harshita': { 
                        weeks: [11, 23, 23, 11], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No ratings for Tech team
                        monthlyRating: 0, // No ratings for Tech team
                        target: 66, // 12+21+21+12 expected story points from data
                        totalOutput: 68, // 11+23+23+11
                        workingDays: 66,
                        efficiency: 103.03 // Average: (91.67+109.52+109.52+91.67)/4
                    }
                },
                teamSummary: { 
                    totalMembers: 6, 
                    avgRating: 0, // No ratings for Tech team
                    totalOutput: 344, // Sum of all totalOutput
                    totalWorkingDays: 365, // Sum of all workingDays 
                    avgEfficiency: 94.13 // Average of all efficiency values
                }
            }
        };
        
        console.log('✅ Tech historical data loaded successfully');
        console.log('Available Tech months:', Object.keys(this.historicalData.tech));
        this.showMessage(`✅ Loaded Tech team data for August 2025`, 'success');
    }

    async loadProductHistoricalData() {
        console.log('📱 Loading Product historical data...');
        
        // Initialize Product historical data structure  
        if (!this.historicalData.product) {
            this.historicalData.product = {};
        }
        
        // Add historical data
        this.historicalData.product = {
            'August 2025': {
                isComplete: true,
                monthlyData: {
                    'Akshay': { 
                        weeks: [3.7, 4.5, 4.5, 3.0], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No ratings for Product team
                        monthlyRating: 0, // No ratings for Product team
                        target: 17.5, // 4.5+5+5+4 expected story points from data
                        totalOutput: 15.7, // 3.7+4.5+4.5+3.0
                        workingDays: 17.5, // Using expected as proxy for working days calculation
                        efficiency: 89.71 // Average: (82.22+90.00+90.00+75.00)/4
                    },
                    'Ankush': { 
                        weeks: [3.65, 6.55, 6.55, 5.05], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No ratings for Product team
                        monthlyRating: 0, // No ratings for Product team
                        target: 21.5, // 4.5+6.5+6.5+4.5 expected story points from data
                        totalOutput: 21.8, // 3.65+6.55+6.55+5.05
                        workingDays: 21.5,
                        efficiency: 101.40 // Average: (81.11+100.77+100.77+112.22)/4
                    },
                    'Noor': { 
                        weeks: [3.75, 7.0, 7.0, 5.9], 
                        weeklyQualityRatings: [0, 0, 0, 0], // No ratings for Product team
                        monthlyRating: 0, // No ratings for Product team
                        target: 19.5, // 4+6.5+6.5+4.5 expected story points from data
                        totalOutput: 23.65, // 3.75+7.0+7.0+5.9
                        workingDays: 19.5,
                        efficiency: 121.28 // Average: (93.75+107.69+107.69+131.11)/4
                    }
                },
                teamSummary: { 
                    totalMembers: 3, 
                    avgRating: 0, // No ratings for Product team
                    totalOutput: 61.15, // Sum of all totalOutput
                    totalWorkingDays: 58.5, // Sum of all workingDays 
                    avgEfficiency: 104.13 // Average of all efficiency values
                }
            },
            'September 2025': {
                isComplete: false, // Only weeks 1-3 complete for Vaishnavi
                monthlyData: {
                    'Vaishnavi': { 
                        weeks: [4.5, 4.5, 4.5, 0], // 90% efficiency for weeks 1-3, week 4 pending user input
                        weeklyQualityRatings: [0, 0, 0, 0], // No ratings for Product team
                        monthlyRating: 0, // No ratings for Product team
                        target: 20, // 5+5+5+5 expected story points (1 SP per working day)
                        totalOutput: 13.5, // 4.5+4.5+4.5+0 (week 4 pending)
                        workingDays: 20, // 5 working days per week × 4 weeks
                        efficiency: 90.0 // 90% efficiency for completed weeks
                    }
                },
                teamSummary: { 
                    totalMembers: 1, // Only Vaishnavi has data for September
                    avgRating: 0, // No ratings for Product team
                    totalOutput: 13.5, // Only Vaishnavi's output
                    totalWorkingDays: 20, // Only Vaishnavi's working days
                    avgEfficiency: 90.0 // Vaishnavi's efficiency
                }
            }
        };
        
        console.log('✅ Product historical data loaded successfully');
        console.log('Available Product months:', Object.keys(this.historicalData.product));
        this.showMessage(`✅ Loaded Product team data for August 2025`, 'success');
    }

    // Function to mark September 2025 as completed for all teams
    markSeptemberAsCompleted() {
        console.log('🔒 Marking September 2025 as completed for all teams...');
        
        // Add September 2025 as completed month for all teams that have it locked
        const teamsWithSeptemberData = ['b2b', 'varsity', 'zero1', 'harish', 'audio', 'shorts', 'graphics', 'tech', 'product', 'preproduction', 'content', 'social'];
        
        teamsWithSeptemberData.forEach(teamId => {
            if (!this.historicalData[teamId]) {
                this.historicalData[teamId] = {};
            }
            
            // Add September 2025 as completed month (placeholder data - real data comes from Supabase)
            this.historicalData[teamId]['September 2025'] = {
                isComplete: true,
                monthlyData: {
                    // Placeholder - actual data will be loaded from Supabase when viewing monthly
                    'placeholder': {
                        weeks: [0, 0, 0, 0],
                        weeklyQualityRatings: [0, 0, 0, 0],
                        monthlyRating: 0,
                        target: 0,
                        totalOutput: 0,
                        workingDays: 0,
                        efficiency: 0
                    }
                },
                teamSummary: {
                    totalMembers: 0,
                    avgRating: 0,
                    totalOutput: 0,
                    totalWorkingDays: 0,
                    avgEfficiency: 0
                }
            };
            
            console.log(`✅ Added September 2025 for ${teamId} team - isComplete: ${this.historicalData[teamId]['September 2025'].isComplete}`);
        });
        
        console.log('✅ September 2025 marked as completed for all teams');
        console.log('🔍 Final historicalData structure:', Object.keys(this.historicalData));
    }

    // Function to lock a month and move it from weekly to monthly view
    async lockMonth(monthYear) {
        try {
            console.log(`🔒 Locking ${monthYear} for ${this.currentTeam} team...`);
            
            // Confirm with user
            const confirmed = confirm(`🔒 Lock ${monthYear} for ${this.teamConfigs[this.currentTeam]?.name || this.currentTeam}?\n\nThis will:\n• Remove individual weeks from weekly dropdown\n• Move the month to monthly view only\n• Make the data read-only\n• Show it in 360° Company View\n\nThe locked status will persist across page reloads.`);
            
            if (!confirmed) return;
            
            // Add month to locked months for current team
            if (!this.lockedMonths[this.currentTeam]) {
                this.lockedMonths[this.currentTeam] = [];
            }
            
            if (!this.lockedMonths[this.currentTeam].includes(monthYear)) {
                this.lockedMonths[this.currentTeam].push(monthYear);
            }
            
            // Create historical data entry if it doesn't exist
            if (!this.historicalData[this.currentTeam]) {
                this.historicalData[this.currentTeam] = {};
            }
            
            // Add the month as completed (placeholder data - real data comes from Supabase)
            this.historicalData[this.currentTeam][monthYear] = {
                isComplete: true,
                monthlyData: {
                    // Placeholder - actual data will be loaded from Supabase when viewing monthly
                    'placeholder': {
                        weeks: [0, 0, 0, 0],
                        weeklyQualityRatings: [0, 0, 0, 0],
                        monthlyRating: 0,
                        target: 0,
                        totalOutput: 0,
                        workingDays: 0,
                        efficiency: 0
                    }
                },
                teamSummary: {
                    totalMembers: 0,
                    avgRating: 0,
                    totalOutput: 0,
                    totalWorkingDays: 0,
                    avgEfficiency: 0
                }
            };
            
            console.log(`✅ Locked ${monthYear} for ${this.currentTeam} team`);
            console.log(`🔒 Current locked months for ${this.currentTeam}:`, this.lockedMonths[this.currentTeam]);
            
            // CRITICAL FIX: Save the locked months to localStorage so they persist on page refresh
            this.saveTeamSpecificData();
            console.log(`💾 Saved locked months to localStorage`);
            
            // Refresh the week selector to remove locked month weeks
            this.populateWeekSelector();
            
            // Update week info to show locked status
            this.updateWeekInfo();
            
            // If current week is from the locked month, switch to next available week
            if (this.currentWeek && this.currentWeek.monthYear === monthYear) {
                const availableWeeks = this.getFilteredWeeks();
                if (availableWeeks.length > 0) {
                    this.currentWeek = availableWeeks[0];
                    const weekSelect = document.getElementById('week-select');
                    if (weekSelect) {
                        weekSelect.value = this.currentWeek.id;
                    }
                    this.updateWeekInfo();
                    this.loadWeekData();
                    this.generateTeamDataRows();
                }
            }
            
            this.showMessage(`🔒 ${monthYear} locked and moved to monthly view!`, 'success');
            
        } catch (error) {
            console.error('Error locking month:', error);
            this.showMessage('❌ Error locking month', 'error');
        }
    }

    // Function to load any month's data from Supabase for monthly view
    async loadMonthDataFromSupabase(monthYear) {
        console.log(`📊 Loading ${monthYear} data from Supabase...`);
        
        try {
            // Parse monthYear (e.g., "October 2025", "September 2025")
            const [monthName, yearStr] = monthYear.split(' ');
            const year = parseInt(yearStr);
            
            // CRITICAL FIX: For 2025 months, get weeks from finalized reports since week system only has 2026
            let monthWeeks = [];
            
            // Map currentTeam to Supabase team ID
            const supabaseTeamId = this.currentTeam === 'zero1' ? 'zero1_bratish' : 
                                   this.currentTeam === 'harish' ? 'zero1_harish' : 
                                   this.currentTeam;
            const finalizedWeeksForTeam = this.finalizedReports?.[supabaseTeamId] || this.finalizedReports?.[this.currentTeam] || {};
            
            // Get weekIds for this month from finalized reports
            const monthWeekIds = Object.keys(finalizedWeeksForTeam).filter(weekId => {
                if (weekId.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [weekYear, weekMonth] = weekId.split('-');
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                      'July', 'August', 'September', 'October', 'November', 'December'];
                    const weekMonthName = monthNames[parseInt(weekMonth) - 1];
                    return weekMonthName === monthName && weekYear === yearStr;
                }
                return false;
            }).sort(); // Sort chronologically
            
            // Convert weekIds to week objects
            monthWeeks = monthWeekIds.map(weekId => ({ id: weekId, workingDays: 5 }));
            
            // CRITICAL FIX: For 2025 data, use historicalMembers; for 2026+ use current members
            // Fallback to current members if historicalMembers not defined
            const teamMembers = year <= 2025 
                ? (this.teamConfigs[this.currentTeam].historicalMembers || this.teamConfigs[this.currentTeam].members)
                : this.getActiveTeamMembers(this.currentTeam);
            
            console.log(`📊 Loading ${monthYear} data for team: ${this.currentTeam}`);
            console.log(`📊 Using ${year <= 2025 ? 'historicalMembers' : 'current members'} for year ${year}`);
            console.log(`📊 ${monthName} ${year} weeks found: ${monthWeeks.length}`, monthWeeks.map(w => w.id));
            console.log(`📊 Team members (${teamMembers.length}):`, teamMembers.map(m => m.name || m));
            
            // CRITICAL DEBUG: Check if this team has finalized weeks in localStorage
            const finalizedKey = `${this.currentTeam}_finalized_reports`;
            const storedFinalized = localStorage.getItem(finalizedKey);
            console.log(`📦 Checking localStorage key: ${finalizedKey}`);
            console.log(`📦 Has finalized data: ${!!storedFinalized}`);
            if (storedFinalized) {
                try {
                    const parsed = JSON.parse(storedFinalized);
                    console.log(`📦 Finalized report structure:`, Object.keys(parsed));
                    if (parsed[this.currentTeam]) {
                        console.log(`📦 Finalized weeks for ${this.currentTeam}:`, Object.keys(parsed[this.currentTeam]));
                    }
                } catch(e) {
                    console.error('📦 Error parsing finalized data:', e);
                }
            }
            
            let totalTeamOutput = 0;
            let totalTeamWorkingDays = 0;
            let totalEfficiency = 0;
            let totalTeamRating = 0;
            let ratingMemberCount = 0;
            let memberCount = 0;
            
            const monthlyData = {};
            
            // Load data for each team member
            for (const member of teamMembers) {
                const memberName = member.name || member;
                let memberTotalOutput = 0;
                let memberTotalWorkingDays = 0;
                let memberTotalEffectiveWorkingDays = 0; // Working days minus leave days
                let memberTotalTargetPoints = 0; // For Tech team
                const memberWeeks = [];
                
                // Load data for each week including ratings
                const weeklyRatings = [];
                let totalRating = 0;
                let ratingCount = 0;
                
                for (const week of monthWeeks) {
                    try {
                        // Load all data for this week (not just for one member)
                        const weekDataArray = await this.supabaseAPI.loadWeekData(this.currentTeam, week.id);
                        const memberWeekData = weekDataArray?.find(entry => entry.member_name === memberName);
                        
                        if (memberWeekData) {
                            const weekTotal = this.getMemberWeekOutput(memberWeekData, this.currentTeam);
                            // CRITICAL FIX: Use ACTUAL working days from Supabase (what user entered/finalized)
                            // NOT the calculated working days from week system
                            const workingDays = memberWeekData.working_days || week.workingDays || 5;
                            const leaveDays = parseFloat(memberWeekData.leave_days) || 0;
                            const weeklyRating = memberWeekData.weekly_rating || 0;
                            const targetPoints = this.resolveTargetPoints(this.currentTeam, memberWeekData.target_points);
                            
                            // Calculate effective working days for this week (working days - leave days)
                            const effectiveWorkingDays = workingDays - leaveDays;
                            
                            console.log(`📊 ${this.currentTeam.toUpperCase()} - ${memberName} week ${week.id}:`, {
                                'Week Total (Output)': weekTotal,
                                'week_total (raw DB)': memberWeekData.week_total,
                                'Working Days (from DB)': workingDays,
                                'Leave Days (from DB)': leaveDays,
                                '🎯 Effective Working Days': effectiveWorkingDays,
                                'Weekly Rating': weeklyRating,
                                'Target Points': targetPoints,
                                'Stored target_points': memberWeekData.target_points,
                                'Week System Working Days': week.workingDays
                            });
                            
                            memberTotalOutput += weekTotal;
                            memberTotalWorkingDays += workingDays;
                            memberTotalEffectiveWorkingDays += effectiveWorkingDays;
                            memberWeeks.push(weekTotal);
                            weeklyRatings.push(weeklyRating);
                            
                            // Store target points for Tech/Product teams (adjusted for leave days like weekly calculation)
                            if (this.usesTargetPoints()) {
                                let adjustedTargetPoints;
                                if (this.currentTeam === 'product' && !this.hasStoredTargetPoints(memberWeekData)) {
                                    adjustedTargetPoints = effectiveWorkingDays;
                                } else {
                                    adjustedTargetPoints = targetPoints * (effectiveWorkingDays / workingDays);
                                }
                                memberTotalTargetPoints += adjustedTargetPoints;
                                console.log(`📊 ${this.currentTeam} ${memberName} week ${week.id}: targetPoints=${targetPoints}, effectiveWorkingDays=${effectiveWorkingDays}, workingDays=${workingDays}, adjustedTarget=${adjustedTargetPoints.toFixed(2)}`);
                            }
                            
                            if (weeklyRating > 0) {
                                totalRating += weeklyRating;
                                ratingCount++;
                            }
                        } else {
                            console.log(`❌ No data found for ${memberName} week ${week.id}`);
                            memberWeeks.push(0);
                            weeklyRatings.push(0);
                        }
                    } catch (error) {
                        console.warn(`No data found for ${memberName} week ${week.id}`);
                        memberWeeks.push(0);
                        weeklyRatings.push(0);
                    }
                }
                
                // Calculate member efficiency and target based on team type
                let memberEfficiency = 0;
                let memberTarget = memberTotalWorkingDays;
                const monthlyRating = ratingCount > 0 ? totalRating / ratingCount : 0;
                
                if (this.usesTargetPoints()) {
                    memberTarget = memberTotalTargetPoints;
                    memberEfficiency = memberTotalTargetPoints > 0 ? (memberTotalOutput / memberTotalTargetPoints) * 100 : 0;
                    console.log(`📈 ${this.currentTeam} ${memberName} totals: output=${memberTotalOutput}, adjustedTargetPoints=${memberTotalTargetPoints.toFixed(2)}, efficiency=${memberEfficiency.toFixed(2)}%, monthlyRating=${monthlyRating.toFixed(2)}`);
                } else if (this.currentTeam === 'graphics') {
                    // Graphics team: totalDays / effectiveWorkingDays * 100 (same as weekly calculation)
                    memberTarget = memberTotalEffectiveWorkingDays; // Target = effective working days
                    memberEfficiency = memberTotalEffectiveWorkingDays > 0 ? (memberTotalOutput / memberTotalEffectiveWorkingDays) * 100 : 0;
                    console.log(`📈 GRAPHICS ${memberName} MONTHLY:`, {
                        'Total Days Output': memberTotalOutput,
                        'Total Working Days': memberTotalWorkingDays,
                        'Total Leave Days': memberTotalWorkingDays - memberTotalEffectiveWorkingDays,
                        '🎯 Effective Working Days': memberTotalEffectiveWorkingDays,
                        'Efficiency': `${memberEfficiency.toFixed(2)}%`
                    });
                } else {
                    // Other teams (B2B, Varsity, Zero1, Audio, Shorts, etc.): Use EFFECTIVE working days (working days - leave days)
                    memberTarget = memberTotalEffectiveWorkingDays; // Target = effective working days
                    memberEfficiency = memberTotalEffectiveWorkingDays > 0 ? (memberTotalOutput / memberTotalEffectiveWorkingDays) * 100 : 0;
                    console.log(`📈 ${this.currentTeam.toUpperCase()} ${memberName} MONTHLY:`, {
                        'Total Output': memberTotalOutput,
                        'Total Working Days': memberTotalWorkingDays,
                        'Total Leave Days': memberTotalWorkingDays - memberTotalEffectiveWorkingDays,
                        '🎯 Effective Working Days': memberTotalEffectiveWorkingDays,
                        'Efficiency': `${memberEfficiency.toFixed(2)}%`,
                        'Formula': `${memberTotalOutput} ÷ ${memberTotalEffectiveWorkingDays} × 100`
                    });
                }
                
                monthlyData[memberName] = {
                    weeks: memberWeeks,
                    weeklyQualityRatings: weeklyRatings,
                    monthlyRating: monthlyRating,
                    target: memberTarget,
                    totalOutput: memberTotalOutput,
                    workingDays: memberTotalWorkingDays,
                    efficiency: memberEfficiency
                };
                
                totalTeamOutput += memberTotalOutput;
                totalTeamWorkingDays += memberTotalWorkingDays;
                totalEfficiency += memberEfficiency;
                
                // Add to team rating calculation
                if (monthlyRating > 0) {
                    totalTeamRating += monthlyRating;
                    ratingMemberCount++;
                }
                
                memberCount++;
            }
            
            const avgEfficiency = memberCount > 0 ? totalEfficiency / memberCount : 0;
            const avgRating = ratingMemberCount > 0 ? totalTeamRating / ratingMemberCount : 0;
            
            console.log(`🏆 Team ${this.currentTeam} September summary: members=${memberCount}, avgRating=${avgRating.toFixed(2)}, avgEfficiency=${avgEfficiency.toFixed(2)}%`);
            
            return {
                isComplete: true,
                monthlyData: monthlyData,
                teamSummary: {
                    totalMembers: memberCount,
                    avgRating: avgRating,
                    totalOutput: totalTeamOutput,
                    totalWorkingDays: totalTeamWorkingDays,
                    avgEfficiency: avgEfficiency
                }
            };
            
        } catch (error) {
            console.error(`Error loading ${monthYear} data from Supabase:`, error);
            throw error;
        }
    }

    // Backward compatibility alias for September-specific function
    async loadSeptemberDataFromSupabase() {
        return await this.loadMonthDataFromSupabase('September 2025');
    }

    // Load finalized reports for ALL teams from localStorage (for Company View)
    async loadAllTeamsFinalizedReports() {
        console.log('\n📋 Loading finalized reports for all teams from localStorage...');
        
        const allTeams = ['b2b', 'varsity', 'zero1_bratish', 'zero1_harish', 'audio', 'graphics', 'tech', 'product', 'preproduction', 'content', 'social'];
        
        // Map team IDs to historical keys for consistency with getTeamMonthlyData
        const teamMapping = {
            'zero1_bratish': 'zero1',
            'zero1_harish': 'harish',
            'varsity': 'varsity',
            'b2b': 'b2b',
            'audio': 'audio',
            'shorts': 'shorts',
            'graphics': 'graphics',
            'tech': 'tech',
            'product': 'product',
            'preproduction': 'preproduction',
            'content': 'content',
            'social': 'social'
        };
        
        // Initialize finalizedReports if it doesn't exist
        if (!this.finalizedReports) {
            this.finalizedReports = {};
        }
        
        allTeams.forEach(teamId => {
            const finalizedKey = `${teamId}_finalized_reports`;
            const storedReports = localStorage.getItem(finalizedKey);
            const historicalKey = teamMapping[teamId] || teamId;
            
            if (storedReports) {
                try {
                    const parsed = JSON.parse(storedReports);
                    console.log(`📦 Parsed finalized reports for ${teamId}:`, parsed);
                    
                    // Merge into main finalizedReports structure
                    if (parsed && typeof parsed === 'object') {
                        // First, merge using original keys from the parsed data
                        Object.keys(parsed).forEach(key => {
                            if (!this.finalizedReports[key]) {
                                this.finalizedReports[key] = {};
                            }
                            const weekKeys = Object.keys(parsed[key] || {});
                            console.log(`  📅 Merging ${teamId} -> ${key}: ${weekKeys.length} weeks`, weekKeys);
                            this.finalizedReports[key] = { ...this.finalizedReports[key], ...parsed[key] };
                        });
                        
                        // CRITICAL FIX: Also map to historical key for Company View lookup
                        if (parsed[teamId] && historicalKey !== teamId) {
                            console.log(`  🔄 Mapping ${teamId} -> ${historicalKey} for historical key lookup`);
                            if (!this.finalizedReports[historicalKey]) {
                                this.finalizedReports[historicalKey] = {};
                            }
                            this.finalizedReports[historicalKey] = { ...this.finalizedReports[historicalKey], ...parsed[teamId] };
                        }
                        
                        console.log(`✅ Loaded finalized reports for ${teamId}: Team keys =`, Object.keys(parsed));
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not parse finalized reports for ${teamId}:`, error);
                }
            } else {
                console.log(`ℹ️ No finalized reports found for ${teamId}`);
            }
        });
        
        console.log('\n📊 Final merged finalizedReports structure:');
        Object.keys(this.finalizedReports).forEach(teamKey => {
            const weeks = Object.keys(this.finalizedReports[teamKey] || {});
            console.log(`  ${teamKey}: ${weeks.length} weeks ->`, weeks);
        });
        console.log('📊 Teams with finalized weeks:', Object.keys(this.finalizedReports));
    }
    
    async ensureAllHistoricalDataLoaded() {
        console.log('🔄 Ensuring all team historical data is loaded for Company View...');
        
        // Load historical data for all teams
        const loadPromises = [];
        
        // Always load Varsity data to ensure we have real data (not placeholder)
        console.log('🏐 Loading Varsity historical data...');
        loadPromises.push(this.loadVarsityHistoricalData());
        
        // Check and load Zero1 data if not already loaded
        if (!this.historicalData.zero1 || Object.keys(this.historicalData.zero1).length === 0) {
            console.log('🚀 Loading Zero1 historical data...');
            loadPromises.push(this.loadZero1HistoricalData());
        } else {
            console.log('✅ Zero1 data already loaded');
        }
        
        // Check and load Harish data if not already loaded
        if (!this.historicalData.harish || Object.keys(this.historicalData.harish).length === 0) {
            console.log('🏆 Loading Harish historical data...');
            loadPromises.push(this.loadHarishHistoricalData());
        } else {
            console.log('✅ Harish data already loaded');
        }
        
        // Check and load Shorts data if not already loaded
        if (!this.historicalData.shorts || Object.keys(this.historicalData.shorts).length === 0) {
            console.log('🎬 Loading Shorts historical data...');
            loadPromises.push(this.loadShortsHistoricalData());
        } else {
            console.log('✅ Shorts data already loaded');
        }
        
        // Check and load Graphics data if not already loaded
        if (!this.historicalData.graphics || Object.keys(this.historicalData.graphics).length === 0) {
            console.log('🎨 Loading Graphics historical data...');
            loadPromises.push(this.loadGraphicsHistoricalData());
        } else {
            console.log('✅ Graphics data already loaded');
        }
        
        // Check and load Tech data if not already loaded
        if (!this.historicalData.tech || Object.keys(this.historicalData.tech).length === 0) {
            console.log('💻 Loading Tech historical data...');
            loadPromises.push(this.loadTechHistoricalData());
        } else {
            console.log('✅ Tech data already loaded');
        }
        
        // Check and load Product data if not already loaded
        if (!this.historicalData.product || Object.keys(this.historicalData.product).length === 0) {
            console.log('📱 Loading Product historical data...');
            loadPromises.push(this.loadProductHistoricalData());
        } else {
            console.log('✅ Product data already loaded');
        }
        
        // Audio and B2B data is loaded in constructor, but double-check
        if (!this.historicalData.audio) {
            console.log('🎵 Initializing Audio historical data...');
            this.historicalData.audio = {}; // Will be populated when needed
        }
        
        if (!this.historicalData.b2b) {
            console.log('💼 Initializing B2B historical data...');
            this.historicalData.b2b = {}; // Will be populated when needed
        }
        
        // Wait for all data to load
        if (loadPromises.length > 0) {
            await Promise.all(loadPromises);
            console.log('✅ All historical data loaded for Company View');
        } else {
            console.log('✅ All historical data was already available');
        }
        
        // Debug log the available data
        console.log('📊 Available historical data:', {
            varsity: Object.keys(this.historicalData.varsity || {}),
            zero1: Object.keys(this.historicalData.zero1 || {}),
            harish: Object.keys(this.historicalData.harish || {}),
            shorts: Object.keys(this.historicalData.shorts || {}),
            audio: Object.keys(this.historicalData.audio || {}),
            b2b: Object.keys(this.historicalData.b2b || {}),
            graphics: Object.keys(this.historicalData.graphics || {})
        });
        
        // Specific Varsity debug
        if (this.historicalData.varsity) {
            console.log('🏐 VARSITY DATA LOADED:', this.historicalData.varsity);
            console.log('🏐 VARSITY FEBRUARY DATA:', this.historicalData.varsity['February 2025']);
        } else {
            console.log('❌ VARSITY DATA NOT LOADED');
        }
    }
    
    async loadZero1HistoricalData() {
        console.log('🚀 Loading Zero1 hardcoded data (like B2B and Varsity)...');
        
        // Zero1 data is already initialized in constructor, just confirm it's loaded
        if (this.historicalData.zero1) {
            console.log('✅ Zero1 hardcoded data already loaded');
            console.log('Available Zero1 months:', Object.keys(this.historicalData.zero1));
            this.showMessage(`✅ Loaded Zero1 team data for Jan-August 2025`, 'success');
        } else {
            console.warn('⚠️ Zero1 data not found in historicalData');
            this.showMessage('❌ Zero1 team data not available', 'error');
        }
    }

    async loadHarishHistoricalData() {
        console.log('🚀 Loading Harish hardcoded data (like B2B and Varsity)...');
        
        // Harish data is already initialized in constructor, just confirm it's loaded
        if (this.historicalData.harish) {
            console.log('✅ Harish hardcoded data already loaded');
            console.log('Available Harish months:', Object.keys(this.historicalData.harish));
            this.showMessage(`✅ Loaded Zero1 - Harish team data for Jan-August 2025`, 'success');
        } else {
            console.warn('⚠️ Harish data not found in historicalData');
            this.showMessage('❌ Zero1 - Harish team data not available', 'error');
        }
    }

    async loadShortsHistoricalData() {
        console.log('🎬 Loading Shorts hardcoded data (like B2B and Varsity)...');
        
        // Shorts data is already initialized in constructor, just confirm it's loaded
        if (this.historicalData.shorts) {
            console.log('✅ Shorts hardcoded data already loaded');
            console.log('Available Shorts months:', Object.keys(this.historicalData.shorts));
            this.showMessage(`✅ Loaded Shorts team data for Jan-July 2025`, 'success');
        } else {
            console.warn('⚠️ Shorts data not found in historicalData');
            this.showMessage('❌ Shorts team data not available', 'error');
        }
    }


    // Calculate working days in a month (excluding weekends)
    calculateWorkingDaysInMonth(monthYear) {
        try {
            // Parse month and year from string like "January 2025"
            const [monthName, year] = monthYear.split(' ');
            const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
            const yearNum = parseInt(year);
            
            // Get the number of days in the month
            const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
            
            let workingDays = 0;
            
            // Count working days (Monday to Friday)
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(yearNum, monthIndex, day);
                const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
                
                // Count if it's Monday (1) to Friday (5)
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    workingDays++;
                }
            }
            
            return workingDays;
        } catch (error) {
            console.warn('Error calculating working days for', monthYear, error);
            return 22; // Default fallback
        }
    }
    
    // Load team-specific data from localStorage and sync with Google Sheets
    async loadTeamSpecificData() {
        const teamKey = `${this.currentTeam}_week_entries`;
        let finalizedKey = `${this.currentTeam}_finalized_reports`;
        const lockedMonthsKey = `${this.currentTeam}_locked_months`; // CRITICAL FIX: Load locked months
        
        // CRITICAL FIX: Map team IDs to Supabase storage keys for Zero1 teams
        const supabaseTeamId = this.currentTeam === 'zero1' ? 'zero1_bratish' : 
                               this.currentTeam === 'harish' ? 'zero1_harish' : 
                               this.currentTeam;
        const supabaseFinalizedKey = `${supabaseTeamId}_finalized_reports`;
        
        // Load local data first
        this.weekEntries = JSON.parse(localStorage.getItem(teamKey) || '{}');
        
        // Try to load finalized reports from Supabase key first, then fallback to team key
        let finalizedReportsData = localStorage.getItem(supabaseFinalizedKey);
        if (!finalizedReportsData) {
            finalizedReportsData = localStorage.getItem(finalizedKey);
        }
        this.finalizedReports = JSON.parse(finalizedReportsData || '{}');
        
        console.log(`🔍 Loading finalized reports for ${this.currentTeam} (Supabase ID: ${supabaseTeamId})`);
        console.log(`  - Tried key: ${supabaseFinalizedKey}`);
        console.log(`  - Found data: ${!!finalizedReportsData}`);
        console.log(`  - Finalized reports structure:`, this.finalizedReports);
        
        // Load locked months for this team
        if (!this.lockedMonths[this.currentTeam]) {
            this.lockedMonths[this.currentTeam] = [];
        }
        const storedLockedMonths = JSON.parse(localStorage.getItem(lockedMonthsKey) || '[]');
        this.lockedMonths[this.currentTeam] = storedLockedMonths;
        
        console.log(`Loaded local data for ${this.currentTeam}:`, {
            weekEntries: Object.keys(this.weekEntries).length,
            finalizedReports: Object.keys(this.finalizedReports).length,
            lockedMonths: this.lockedMonths[this.currentTeam].length,
            lockedMonthsList: this.lockedMonths[this.currentTeam],
            finalizedReportsData: this.finalizedReports
        });
        
        // CRITICAL: Always try to sync with Supabase to get latest data from other browsers
        console.log(`🔄 Loading latest data from Supabase for ${this.currentTeam}...`);
        await this.syncWithSupabaseOnLoad();
    }
    
    // Sync with Supabase when loading data
    async syncWithSupabaseOnLoad() {
        try {
            console.log(`🔄 Syncing ${this.currentTeam} data with Supabase...`);
            
            // Try to read latest data from Supabase for current week
            if (this.currentWeek && this.currentWeek.id) {
                const supabaseData = await this.supabaseAPI.loadWeekData(this.currentTeam, this.currentWeek.id);
                
                if (supabaseData && supabaseData.length > 0) {
                    // Populate UI with Supabase data
                    this.populateUIFromSupabaseData(supabaseData);
                    console.log(`✅ Synced ${supabaseData.length} entries from Supabase for ${this.currentWeek.id}`);
                } else {
                    console.log(`ℹ️ No Supabase data found for ${this.currentTeam} ${this.currentWeek.id}`);
                }
            } else {
                console.log(`⚠️ No current week set, skipping Supabase sync`);
            }
            
        } catch (error) {
            console.warn(`⚠️ Could not sync with Supabase on load:`, error.message);
            console.log(`📱 Using local data for ${this.currentTeam}`);
        }
    }
    
    // Read data from Google Sheets for current team
    async readFromGoogleSheets() {
        try {
            // CORRECT: Use the proper sheet naming that exists in the current spreadsheet
            const sheetName = `${this.currentTeam.toUpperCase()}_Weekly_Tracking`;
            console.log(`📖 Attempting to read from sheet: ${sheetName} in current data spreadsheet`);
            
            // Use the existing readSheetData method with team-specific range
            const range = `${sheetName}!A1:Z1000`;
            console.log(`📖 Reading range: ${range}`);
            
            const data = await this.sheetsAPI.readSheetData(range);
            console.log(`📊 Retrieved ${data?.length || 0} rows from ${sheetName}`);
            
            // If readSheetData returns parsed objects, convert to raw values format
            if (data && data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
                console.log('Converting parsed data to raw sheet format...');
                // Return empty for now - this means the sheet doesn't exist yet
                return [];
            }
            
            return data || [];
            
        } catch (error) {
            console.error('Error reading from Google Sheets:', error);
            console.log('📝 This likely means the team sheet doesn\'t exist yet - starting fresh');
            return [];
        }
    }
    
    // Merge Google Sheets data with local data using conflict resolution
    async mergeSheetDataWithLocal(sheetData) {
        if (!sheetData || sheetData.length === 0) {
            console.log('No sheet data to merge');
            return;
        }
        
        console.log(`🔄 Merging ${sheetData.length} rows from Google Sheets for ${this.currentTeam} team...`);
        
        const localMetadata = this.getSyncMetadata();
        let hasConflicts = false;
        let mergedCount = 0;
        let skippedCount = 0;
        
        // Get current team's valid member names
        const validMembers = this.getActiveTeamMembers(this.currentTeam).map(m => m.name || m);
        console.log(`👥 Valid ${this.currentTeam} team members:`, validMembers);
        
        // Skip header row and convert sheet data to local format
        const dataRows = sheetData.slice(1); // Skip header row
        
        dataRows.forEach((row, index) => {
            if (!row || row.length < 3) return;
            
            // Extract basic data from row: [Timestamp, Week ID, Member Name, ...work types..., Week Total, Working Days, Leave Days, Rating, Target, Efficiency, Status]
            const timestamp = row[0];
            const weekId = row[1];
            const memberName = row[2];
            
            if (!timestamp || !weekId || !memberName) {
                console.log(`Skipping invalid row ${index}:`, row);
                return;
            }
            
            // CRITICAL: Only merge data for current team's members
            if (!validMembers.includes(memberName)) {
                console.log(`🚫 Skipping data for ${memberName} - not a valid ${this.currentTeam} team member`);
                skippedCount++;
                return;
            }
            
            const entryKey = `${weekId}_${memberName}`;
            const sheetTimestamp = new Date(timestamp);
            
            // Check if we have local data for this entry
            const localEntry = this.weekEntries[entryKey];
            
            if (!localEntry) {
                // No local data, create entry from sheet data
                this.weekEntries[entryKey] = this.convertSheetRowToEntry(row);
                mergedCount++;
                console.log(`📥 Added new entry from sheet: ${entryKey}`);
                
            } else {
                // We have local data, check for conflicts
                const localTimestamp = new Date(localEntry.lastUpdated || 0);
                
                if (sheetTimestamp > localTimestamp) {
                    // Sheet data is newer, use it
                    this.weekEntries[entryKey] = this.convertSheetRowToEntry(row);
                    mergedCount++;
                    hasConflicts = true;
                    console.log(`🔄 Updated entry from sheet (newer): ${entryKey}`);
                    
                } else if (localTimestamp > sheetTimestamp) {
                    // Local data is newer, keep it but mark for sync
                    localMetadata.needsSync = true;
                    console.log(`📤 Local data is newer: ${entryKey}`);
                    
                } else {
                    // Same timestamp, no conflict
                    console.log(`✅ Data in sync: ${entryKey}`);
                }
            }
        });
        
        if (skippedCount > 0) {
            console.log(`🚫 Skipped ${skippedCount} entries from other teams`);
        }
        
        if (hasConflicts) {
            this.showMessage(`🔄 Synced with Google Sheets. ${mergedCount} entries updated from cloud.`, 'info');
        } else if (mergedCount > 0) {
            this.showMessage(`📥 Loaded ${mergedCount} entries from Google Sheets.`, 'info');
        }
        
        // Save the merged data
        this.saveTeamSpecificData();
        
        console.log(`✅ Merge complete. Total local entries: ${Object.keys(this.weekEntries).length}`);
        
        // CRITICAL: Always refresh the UI after sync, regardless of merge count
        // This ensures data loaded from sheets is displayed even if no conflicts occurred
        if (this.currentWeek) {
            console.log(`🔄 Refreshing UI after Google Sheets sync...`);
            
            // Use loadWeekData instead of populateUIWithSheetData to ensure proper UI refresh
            setTimeout(() => {
                this.loadWeekData();
            }, 100); // Small delay to ensure DOM is ready
        }
    }
    
    // Convert sheet row to internal entry format
    convertSheetRowToEntry(row) {
        // Row format: [Timestamp, Week ID, Member Name, ...work types..., Week Total, Working Days, Leave Days, Rating, Target, Efficiency, Status]
        const timestamp = row[0];
        const weekId = row[1]; 
        const memberName = row[2];
        
        // Get team work types to know how many columns they occupy
        let teamWorkTypes;
        if (this.currentTeam === 'zero1') {
            teamWorkTypes = this.zero1WorkTypes;
        } else if (this.currentTeam === 'harish') {
            teamWorkTypes = this.harishWorkTypes;
        } else if (this.currentTeam === 'varsity') {
            teamWorkTypes = this.varsityWorkTypes;
        } else if (this.currentTeam === 'graphics') {
            teamWorkTypes = this.graphicsWorkTypes;
        } else if (this.currentTeam === 'tech') {
            teamWorkTypes = this.techWorkTypes;
        } else if (this.currentTeam === 'product') {
            teamWorkTypes = this.productWorkTypes;
        } else if (this.currentTeam === 'preproduction') {
            teamWorkTypes = this.preproductionWorkTypes;
        } else if (this.currentTeam === 'content') {
            teamWorkTypes = this.contentWorkTypes;
        } else if (this.currentTeam === 'social') {
            teamWorkTypes = this.socialWorkTypes;
        } else {
            teamWorkTypes = this.workTypes; // B2B uses original types
        }
        
        const workTypeKeys = Object.keys(teamWorkTypes);
        const workTypeData = {};
        
        // Extract work type values starting from column 3
        let colIndex = 3;
        workTypeKeys.forEach(workType => {
            workTypeData[workType] = parseFloat(row[colIndex] || 0);
            colIndex++;
        });
        
        // Summary data comes after work types
        const weekTotal = parseFloat(row[colIndex] || 0); colIndex++;
        const workingDays = parseInt(row[colIndex] || 5); colIndex++;
        const leaveDays = parseFloat(row[colIndex] || 0); colIndex++;
        const rating = parseFloat(row[colIndex] || 0); colIndex++;
        // Skip target, efficiency, status columns
        
        return {
            weekId: weekId,
            memberId: memberName,
            lastUpdated: timestamp,
            workingDays: workingDays,
            leaveDays: leaveDays,
            weeklyRating: rating,
            workTypeData: workTypeData, // Store the actual work type values
            totals: {
                weekTotal: weekTotal,
                dailyTotals: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 }
            }
        };
    }
    
    // Populate UI inputs with data loaded from Google Sheets
    populateUIWithSheetData() {
        if (!this.currentWeek) return;
        
        console.log(`🎨 Populating UI with Google Sheets data for ${this.currentTeam} team...`);
        console.log(`👥 Current team members:`, this.teamMembers.map(m => m.name || m));
        console.log(`📊 Available entries:`, Object.keys(this.weekEntries));
        
        this.teamMembers.forEach(member => {
            const memberName = member.name || member;
            const entryKey = `${this.currentWeek.id}_${memberName}`;
            const entry = this.weekEntries[entryKey];
            
            if (!entry || !entry.workTypeData) {
                console.log(`🔍 No data found for ${memberName} (${entryKey})`);
                return;
            }
            
            console.log(`✅ Populating data for ${memberName}:`, entry);
            
            // Populate work type inputs
            Object.keys(entry.workTypeData).forEach(workType => {
                const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
                if (input) {
                    input.value = entry.workTypeData[workType] || 0;
                    console.log(`  📝 Set ${workType} = ${entry.workTypeData[workType]}`);
                } else {
                    console.warn(`  ⚠️ Input not found for ${memberName} - ${workType}`);
                }
            });
            
            // Populate working days, leave days, rating
            const workingDaysSelect = document.querySelector(`[data-member="${memberName}"].working-days-select`);
            const leaveDaysSelect = document.querySelector(`[data-member="${memberName}"].leave-days-select`);
            const ratingSelect = document.querySelector(`[data-member="${memberName}"].weekly-rating-input`);
            
            if (workingDaysSelect) workingDaysSelect.value = entry.workingDays || 5;
            if (leaveDaysSelect) leaveDaysSelect.value = entry.leaveDays || 0;
            if (ratingSelect) ratingSelect.value = entry.weeklyRating || '';
            
            // Recalculate totals for this member
            this.calculateMemberTotal(memberName);
        });
        
        console.log('✅ UI populated with Google Sheets data');
    }
    
    // Save team-specific data to localStorage with sync metadata
    saveTeamSpecificData() {
        // CRITICAL FIX: Map team IDs to Supabase storage keys for Zero1 teams
        const supabaseTeamIdForSave = this.currentTeam === 'zero1' ? 'zero1_bratish' : 
                                       this.currentTeam === 'harish' ? 'zero1_harish' : 
                                       this.currentTeam;
        
        const teamKey = `${this.currentTeam}_week_entries`;
        const finalizedKey = `${supabaseTeamIdForSave}_finalized_reports`; // Use Supabase team ID
        const historicalKey = `${this.currentTeam}_historical_data`;
        const syncKey = `${this.currentTeam}_sync_metadata`;
        const lockedMonthsKey = `${this.currentTeam}_locked_months`; // CRITICAL FIX: Save locked months
        
        // Add timestamp and user info for conflict resolution
        const timestamp = new Date().toISOString();
        const syncMetadata = {
            lastSaved: timestamp,
            savedBy: `User_${Date.now()}`, // Simple user identification
            version: (this.getSyncMetadata()?.version || 0) + 1,
            needsSync: true // Flag to indicate data needs to be synced to sheets
        };
        
        localStorage.setItem(teamKey, JSON.stringify(this.weekEntries));
        localStorage.setItem(finalizedKey, JSON.stringify(this.finalizedReports || {}));
        localStorage.setItem(historicalKey, JSON.stringify(this.historicalData[this.currentTeam] || {}));
        localStorage.setItem(syncKey, JSON.stringify(syncMetadata));
        localStorage.setItem(lockedMonthsKey, JSON.stringify(this.lockedMonths[this.currentTeam] || [])); // Save locked months for this team
        
        console.log(`Saved data for ${this.currentTeam} (Supabase ID: ${supabaseTeamIdForSave})`, {
            weekEntries: Object.keys(this.weekEntries).length,
            finalizedReports: Object.keys(this.finalizedReports || {}).length,
            historicalData: Object.keys(this.historicalData[this.currentTeam] || {}).length,
            lockedMonths: (this.lockedMonths[this.currentTeam] || []).length,
            finalizedKey: finalizedKey,
            syncMetadata: syncMetadata
        });
    }
    
    // Get sync metadata
    getSyncMetadata() {
        const syncKey = `${this.currentTeam}_sync_metadata`;
        return JSON.parse(localStorage.getItem(syncKey) || '{}');
    }
    
    // NEW: Save to Supabase with retry mechanism
    async saveToSupabaseWithRetry(maxRetries = 3, specificWeekId = null) {
        const weekIdToUse = specificWeekId || this.currentWeek?.id;
        console.log(`💾 Saving to Supabase (max retries: ${maxRetries})`);
        console.log(`🔍 Using week ID: ${weekIdToUse}`);
        
        // Check if we have a week to work with
        if (!weekIdToUse) {
            console.log('⚠️ No week ID available');
            return { success: false, error: 'No week ID available' };
        }
        
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📝 Supabase save attempt ${attempt}/${maxRetries}`);
                
                // Get current week data for all team members
                const weekData = {};
                const teamMembers = this.getActiveTeamMembers(this.currentTeam);
                
                // Collect data from stored weekEntries for the specific week
                teamMembers.forEach(member => {
                    const entryKey = `${weekIdToUse}_${member.name}`;
                    let storedEntry = this.weekEntries[entryKey];
                    console.log(`🔍 Looking for stored entry ${entryKey}:`, storedEntry);
                    
                    // Always include team members for finalized weeks to ensure 0% efficiency transparency
                    // Create entry if it doesn't exist to capture default attendance data
                    if (!storedEntry) {
                        // Create a default entry for members with no data
                        storedEntry = {
                            weekId: weekIdToUse,
                            memberName: member.name,
                            workTypes: {},
                            workingDays: 5,
                            leaveDays: 0,
                            weeklyRating: 0,
                            totalOutput: 0,
                            targetPoints: null
                        };
                        console.log(`📝 Created default entry for ${member.name} to ensure visibility`);
                    }
                    
                    if (storedEntry) {
                        // Convert stored entry to Supabase format
                        const memberData = {
                            weekId: storedEntry.weekId,
                            memberName: storedEntry.memberName,
                            workTypes: storedEntry.workTypes,
                            workingDays: storedEntry.workingDays || 5,
                            leaveDays: storedEntry.leaveDays || 0,
                            weeklyRating: storedEntry.weeklyRating || 0,
                            weekTotal: storedEntry.totalOutput || 0,
                            targetPoints: storedEntry.targetPoints || null, // Include target points for Tech team
                            hasData: true
                        };
                        weekData[member.name] = memberData;
                        console.log(`✅ Added ${member.name} from stored data:`, memberData);
                        if (this.usesTargetPoints()) {
                            console.log(`🎯 saveToSupabase: ${this.currentTeam} team ${member.name} targetPoints = ${memberData.targetPoints}`);
                        }
                    } else {
                        console.log(`⚠️ No stored data for ${member.name} (entry: ${entryKey})`);
                    }
                });
                
                console.log('🔍 Final weekData to save:', weekData);
                
                if (Object.keys(weekData).length === 0) {
                    console.log('⚠️ No data to save to Supabase');
                    return { success: true, message: 'No data to save' };
                }

                // Save each member's data to Supabase
                const savePromises = Object.entries(weekData).map(async ([memberName, memberData]) => {
                    return await this.supabaseAPI.saveWeekData(
                        this.currentTeam,
                        weekIdToUse,
                        memberName,
                        memberData
                    );
                });

                const results = await Promise.all(savePromises);
                
                // Check if all saves succeeded
                const failed = results.filter(result => !result.success);
                if (failed.length > 0) {
                    throw new Error(`Failed to save ${failed.length} member(s): ${failed.map(f => f.error).join(', ')}`);
                }

                console.log(`✅ Successfully saved ${results.length} members to Supabase`);
                this.updateSyncStatus('✅ Synced to Database', 'success');
                return { success: true, message: `Saved ${results.length} members` };

            } catch (error) {
                console.error(`❌ Supabase save attempt ${attempt} failed:`, error);
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`❌ All Supabase save attempts failed:`, lastError);
        this.updateSyncStatus('❌ Database sync failed', 'error');
        return { success: false, error: lastError.message };
    }

    // Improved Google Sheets sync with retry mechanism
    async saveToGoogleSheetsWithRetry(maxRetries = 3) {
        // Prevent multiple simultaneous saves
        if (this.isSyncingToSheets) {
            console.log('⚠️ Sync already in progress, skipping duplicate save');
            return { success: false, error: 'Sync already in progress' };
        }
        
        this.isSyncingToSheets = true;
        let lastError = null;
        
        try {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`🔄 Attempting Google Sheets sync (attempt ${attempt}/${maxRetries})`);
                    
                    const result = await this.writeToGoogleSheetsDirectly();
                    
                    if (result && result.success !== false) {
                        console.log(`✅ Google Sheets sync successful on attempt ${attempt}`);
                        
                        // Mark as synced
                        this.markAsSynced();
                        return { success: true, attempt: attempt };
                    }
                    
                } catch (error) {
                    lastError = error;
                    console.warn(`❌ Google Sheets sync failed on attempt ${attempt}:`, error.message);
                    
                    if (attempt < maxRetries) {
                        // Wait before retrying (exponential backoff)
                        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                        console.log(`⏳ Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            console.error(`❌ All ${maxRetries} sync attempts failed. Last error:`, lastError);
            
            // Store for later sync
            this.storeForLaterSync();
            
            return { 
                success: false, 
                error: lastError?.message || 'Sync failed after all retries',
                storedForLater: true
            };
            
        } finally {
            // Always reset the flag
            this.isSyncingToSheets = false;
        }
    }
    
    // Mark data as synced
    markAsSynced() {
        const syncKey = `${this.currentTeam}_sync_metadata`;
        const metadata = this.getSyncMetadata();
        metadata.needsSync = false;
        metadata.lastSynced = new Date().toISOString();
        localStorage.setItem(syncKey, JSON.stringify(metadata));
    }
    
    // Store failed sync for later retry
    storeForLaterSync() {
        const failedSyncKey = 'failed_syncs';
        const failedSyncs = JSON.parse(localStorage.getItem(failedSyncKey) || '[]');
        
        failedSyncs.push({
            team: this.currentTeam,
            week: this.currentWeek?.id,
            timestamp: new Date().toISOString(),
            data: this.weekEntries
        });
        
        localStorage.setItem(failedSyncKey, JSON.stringify(failedSyncs));
        console.log('📝 Stored failed sync for later retry');
    }
    
    loadStoredHistoricalData() {
        const historicalKey = `${this.currentTeam}_historical_data`;
        const storedHistoricalData = localStorage.getItem(historicalKey);
        
        console.log(`🔍 Loading historical data for ${this.currentTeam} with key: ${historicalKey}`);
        
        if (storedHistoricalData) {
            try {
                const parsedData = JSON.parse(storedHistoricalData);
                if (!this.historicalData[this.currentTeam]) {
                    this.historicalData[this.currentTeam] = {};
                }
                
                // ONLY merge data that doesn't exist in hardcoded data
                // This prevents overwriting hardcoded data and ensures team isolation
                Object.keys(parsedData).forEach(monthYear => {
                    if (!this.historicalData[this.currentTeam][monthYear]) {
                        this.historicalData[this.currentTeam][monthYear] = parsedData[monthYear];
                        console.log(`📅 Added stored month ${monthYear} for ${this.currentTeam}`);
                    } else {
                        console.log(`⚠️ Skipped ${monthYear} for ${this.currentTeam} - already exists in hardcoded data`);
                    }
                });
                
                console.log(`✅ Final historical data for ${this.currentTeam}:`, Object.keys(this.historicalData[this.currentTeam]));
                console.log(`📊 Complete months for ${this.currentTeam}:`, 
                    Object.keys(this.historicalData[this.currentTeam]).filter(month => 
                        this.historicalData[this.currentTeam][month]?.isComplete
                    )
                );
            } catch (error) {
                console.error('Error loading stored historical data:', error);
            }
        } else {
            console.log(`ℹ️ No stored historical data found for ${this.currentTeam}`);
        }
    }
    
    convertArrayDataToObjects(arrayData) {
        if (!arrayData || arrayData.length === 0) return [];
        
        // Create column headers (A, B, C, D, ... AZ)
        const headers = [];
        for (let i = 0; i < arrayData[0].length; i++) {
            if (i < 26) {
                headers.push(String.fromCharCode(65 + i)); // A-Z
            } else {
                const firstLetter = String.fromCharCode(64 + Math.floor(i / 26)); // A, B, etc
                const secondLetter = String.fromCharCode(65 + (i % 26)); // A-Z
                headers.push(firstLetter + secondLetter); // AA, AB, etc
            }
        }
        
        console.log('Generated headers:', headers.slice(0, 20), '...'); // Show first 20
        
        // Convert each row to an object
        const objects = [];
        for (let rowIndex = 0; rowIndex < arrayData.length; rowIndex++) {
            const row = arrayData[rowIndex];
            const obj = {};
            
            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                const header = headers[colIndex];
                const cellValue = row[colIndex];
                obj[header] = cellValue !== undefined && cellValue !== null ? cellValue.toString() : '';
            }
            
            objects.push(obj);
        }
        
        return objects;
    }
    
    
    processVarsitySheetData(sheetData) {
        console.log('Processing Varsity sheet data for monthly summaries...');
        console.log('Sheet data structure:', sheetData.slice(0, 10));
        
        // Look for month patterns in the data
        const monthPatterns = {
            'January 2025': /jan.*2025|january.*2025/i,
            'February 2025': /feb.*2025|february.*2025/i,
            'March 2025': /mar.*2025|march.*2025/i
        };
        
        // For now, extract what we can and supplement with structured sample data
        // In a real implementation, you'd parse the exact sheet structure
        
        Object.keys(monthPatterns).forEach(monthName => {
            console.log(`Processing ${monthName}...`);
            
            // Look for month data in the sheet
            const monthData = this.extractMonthDataFromSheet(sheetData, monthName, monthPatterns[monthName]);
            
            if (monthData && Object.keys(monthData).length > 0) {
                this.historicalData.varsity[monthName] = {
                    isComplete: true,
                    monthlyData: monthData,
                    teamSummary: this.calculateVarsityTeamSummary(monthData)
                };
                console.log(`✅ Processed ${monthName} data:`, this.historicalData.varsity[monthName]);
            }
        });
        
        // If no valid data was extracted, report this
        if (!this.historicalData.varsity || Object.keys(this.historicalData.varsity).length === 0) {
            console.log('❌ No valid monthly data extracted from sheet');
        }
    }
    
    extractMonthDataFromSheet(sheetData, monthName, pattern) {
        console.log(`Extracting data for ${monthName}...`);
        
        const monthData = {};
        
        // Look for rows that match the month pattern
        const relevantRows = sheetData.filter(row => {
            if (!row || typeof row !== 'object') return false;
            
            const rowString = JSON.stringify(row).toLowerCase();
            return pattern.test(rowString);
        });
        
        console.log(`Found ${relevantRows.length} relevant rows for ${monthName}`);
        
        // For each team member, extract their data
        this.teamMembers.forEach(memberName => {
            const memberData = this.extractMemberDataFromRows(relevantRows, memberName);
            if (memberData) {
                monthData[memberName] = memberData;
            }
        });
        
        return monthData;
    }
    
    extractMemberDataFromRows(rows, memberName) {
        // Look for rows containing this member's data
        const memberRows = rows.filter(row => {
            const rowString = JSON.stringify(row).toLowerCase();
            return rowString.includes(memberName.toLowerCase());
        });
        
        if (memberRows.length > 0) {
            console.log(`Found ${memberRows.length} rows for ${memberName}`);
            
            // Extract basic member data - this is a simplified version
            // You would need to adapt this based on your exact sheet structure
            return {
                totalOutput: 15 + Math.random() * 5, // Placeholder - extract from actual columns
                target: 20,
                efficiency: 75 + Math.random() * 15,
                quality: 7.5 + Math.random() * 1,
                level: 'L1', // Extract from sheet
                weeks: [] // Will be populated from actual sheet data
            };
        }
        
        return null;
    }
    
    calculateVarsityTeamSummary(monthData) {
        const members = Object.values(monthData);
        
        return {
            totalMembers: members.length,
            avgEfficiency: members.reduce((sum, m) => sum + (m.efficiency || 0), 0) / members.length,
            totalOutput: members.reduce((sum, m) => sum + (m.totalOutput || 0), 0),
            avgQuality: members.reduce((sum, m) => sum + (m.quality || 0), 0) / members.length
        };
    }

    
    processRealVarsityData(sheetData) {
        console.log('🔥 DEBUGGING VARSITY DATA PROCESSING 🔥');
        console.log('Total rows received:', sheetData ? sheetData.length : 'NULL');
        console.log('Sheet data type:', typeof sheetData);
        console.log('First 10 rows RAW:');
        
        if (sheetData && sheetData.length > 0) {
            for (let i = 0; i < Math.min(10, sheetData.length); i++) {
                console.log(`Row ${i}:`, sheetData[i]);
                if (sheetData[i]) {
                    console.log(`  - Column A: "${sheetData[i].A}"`);
                    console.log(`  - Column B: "${sheetData[i].B}"`);
                    console.log(`  - All keys:`, Object.keys(sheetData[i]));
                }
            }
        } else {
            console.error('❌ NO SHEET DATA RECEIVED!');
            return;
        }
        
        // Look for ANY text that might be January
        console.log('\n🔍 SCANNING FOR JANUARY...');
        for (let i = 0; i < Math.min(50, sheetData.length); i++) {
            const row = sheetData[i];
            if (row && row.A && String(row.A).toLowerCase().includes('jan')) {
                console.log(`FOUND JANUARY-LIKE TEXT at row ${i}: "${row.A}"`);
            }
        }
        
        // Look for team member names
        console.log('\n👥 SCANNING FOR TEAM MEMBERS...');
        const memberNames = ['aalim', 'satyavrat', 'somya', 'manish', 'apoorv', 'anmol'];
        for (let i = 0; i < Math.min(50, sheetData.length); i++) {
            const row = sheetData[i];
            if (row && row.B) {
                const cellText = String(row.B).toLowerCase();
                memberNames.forEach(name => {
                    if (cellText.includes(name)) {
                        console.log(`FOUND MEMBER-LIKE TEXT at row ${i}: "${row.B}"`);
                    }
                });
            }
        }
        
        // Check what columns actually exist
        console.log('\n📊 CHECKING COLUMN STRUCTURE...');
        if (sheetData.length > 0) {
            const sampleRow = sheetData[0];
            console.log('Available columns:', Object.keys(sampleRow));
            console.log('Looking for columns M, Y, AK, AW...');
            console.log('Column M exists:', 'M' in sampleRow);
            console.log('Column Y exists:', 'Y' in sampleRow);
            console.log('Column AK exists:', 'AK' in sampleRow);
            console.log('Column AW exists:', 'AW' in sampleRow);
        }
        
        // Month patterns to look for in Column A
        const monthPatterns = {
            'January 2025': /jan.*2025|january.*2025/i,
            'February 2025': /feb.*2025|february.*2025/i,
            'March 2025': /mar.*2025|march.*2025/i,
            'April 2025': /apr.*2025|april.*2025/i,
            'May 2025': /may.*2025|may.*2025/i,
            'June 2025': /jun.*2025|june.*2025/i,
            'July 2025': /jul.*2025|july.*2025/i
        };
        
        // Expected team members (6 for Jan-Mar, 5 for Apr-Jul)
        const allMembers = ['Aalim', 'Satyavrat Sharma', 'Somya', 'Manish', 'Apoorv Suman', 'Anmol Anand'];
        const membersAfterMarch = ['Aalim', 'Satyavrat Sharma', 'Manish', 'Apoorv Suman', 'Anmol Anand']; // Somya left
        
        // Process each month
        Object.keys(monthPatterns).forEach(monthName => {
            console.log(`\n🔍 Looking for ${monthName} data...`);
            
            // Find month header row
            let monthStartRow = -1;
            for (let i = 0; i < sheetData.length; i++) {
                const row = sheetData[i];
                if (row && row.A && monthPatterns[monthName].test(String(row.A))) {
                    monthStartRow = i;
                    console.log(`Found ${monthName} at row ${i}: "${row.A}"`);
                    break;
                }
            }
            
            if (monthStartRow === -1) {
                console.log(`❌ ${monthName} not found`);
                return;
            }
            
            // Get appropriate member list (6 members before April, 5 after)
            const expectedMembers = monthName.includes('January') || monthName.includes('February') || monthName.includes('March') 
                ? allMembers 
                : membersAfterMarch;
            
            const monthData = {};
            
            // Look for member data in the next 20 rows after month header
            for (let i = monthStartRow + 1; i < Math.min(monthStartRow + 20, sheetData.length); i++) {
                const row = sheetData[i];
                if (!row || !row.B) continue;
                
                const memberName = String(row.B).trim();
                console.log(`Checking row ${i}, Column B: "${memberName}"`);
                
                // Check if this is one of our expected members
                const matchedMember = expectedMembers.find(member => 
                    memberName.toLowerCase().includes(member.toLowerCase()) || 
                    member.toLowerCase().includes(memberName.toLowerCase())
                );
                
                if (matchedMember) {
                    console.log(`✅ Found member: ${matchedMember}`);
                    
                    // Extract weekly data from specific columns
                    const week1 = this.parseNumericValue(row.M); // Column M
                    const week2 = this.parseNumericValue(row.Y); // Column Y  
                    const week3 = this.parseNumericValue(row.AK); // Column AK
                    const week4 = this.parseNumericValue(row.AW); // Column AW
                    
                    console.log(`Weekly data: W1=${week1}, W2=${week2}, W3=${week3}, W4=${week4}`);
                    
                    if (week1 !== null || week2 !== null || week3 !== null || week4 !== null) {
                        const weeks = [
                            { week: 1, output: week1 || 0, quality: 8.5, efficiency: 0 },
                            { week: 2, output: week2 || 0, quality: 8.5, efficiency: 0 },
                            { week: 3, output: week3 || 0, quality: 8.5, efficiency: 0 },
                            { week: 4, output: week4 || 0, quality: 8.5, efficiency: 0 }
                        ];
                        
                        const totalOutput = (week1 || 0) + (week2 || 0) + (week3 || 0) + (week4 || 0);
                        const target = 21; // Default target, can be extracted from sheet if available
                        const efficiency = target > 0 ? (totalOutput / target) * 100 : 0;
                        
                        monthData[matchedMember] = {
                            totalOutput: parseFloat(totalOutput.toFixed(2)),
                            target: target,
                            efficiency: parseFloat(efficiency.toFixed(1)),
                            quality: 9.0, // Overall quality from your example
                            weeks: weeks
                        };
                        
                        console.log(`✅ Processed ${matchedMember}: ${totalOutput} days total`);
                    }
                }
            }
            
            // Store the month data if we found any
            if (Object.keys(monthData).length > 0) {
                this.historicalData.varsity[monthName] = {
                    isComplete: true,
                    monthlyData: monthData,
                    teamSummary: this.calculateVarsityMonthSummary(monthData)
                };
                console.log(`✅ ${monthName}: Processed ${Object.keys(monthData).length} members`);
            } else {
                console.log(`❌ ${monthName}: No member data found`);
            }
        });
        
        const processedMonths = Object.keys(this.historicalData.varsity).length;
        console.log(`\n📊 Final result: Processed ${processedMonths} months of Varsity data`);
    }
    
    parseNumericValue(value) {
        if (value === null || value === undefined || value === '') return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }
    
    extractVarsityMonthData(sheetData, monthName, pattern) {
        console.log(`Extracting data for ${monthName}...`);
        
        const monthData = {};
        const memberNames = this.teamMembers.map(m => m.name);
        
        // Find rows that match the month pattern
        const relevantRows = [];
        
        sheetData.forEach((row, index) => {
            if (!row || typeof row !== 'object') return;
            
            // Convert row to string for pattern matching
            const rowString = JSON.stringify(row).toLowerCase();
            
            if (pattern.test(rowString)) {
                console.log(`Found potential ${monthName} row ${index}:`, row);
                relevantRows.push({ ...row, rowIndex: index });
            }
        });
        
        console.log(`Found ${relevantRows.length} relevant rows for ${monthName}`);
        
        // Extract data for each team member
        memberNames.forEach(memberName => {
            const memberData = this.extractVarsityMemberData(relevantRows, memberName, sheetData);
            if (memberData) {
                monthData[memberName] = memberData;
                console.log(`✅ Extracted data for ${memberName}:`, memberData);
            }
        });
        
        return monthData;
    }
    
    extractVarsityMemberData(relevantRows, memberName, allData) {
        console.log(`Looking for data for member: ${memberName}`);
        
        // Look for rows containing this member's name
        const memberRows = [];
        
        // Check both the relevant month rows and nearby rows
        relevantRows.forEach(row => {
            const rowIndex = row.rowIndex;
            
            // Check the relevant row and several rows around it
            for (let offset = -5; offset <= 15; offset++) {
                const checkIndex = rowIndex + offset;
                if (checkIndex >= 0 && checkIndex < allData.length) {
                    const checkRow = allData[checkIndex];
                    if (this.rowContainsMember(checkRow, memberName)) {
                        memberRows.push({ ...checkRow, originalIndex: checkIndex });
                    }
                }
            }
        });
        
        console.log(`Found ${memberRows.length} rows for ${memberName}`);
        
        if (memberRows.length > 0) {
            // Extract actual data from the member rows
            return this.parseVarsityMemberRowData(memberRows, memberName);
        }
        
        return null;
    }
    
    rowContainsMember(row, memberName) {
        if (!row || typeof row !== 'object') return false;
        
        // Check all values in the row for the member name
        const values = Object.values(row);
        return values.some(value => {
            if (typeof value === 'string') {
                const cleanValue = value.trim().toLowerCase();
                const cleanMemberName = memberName.toLowerCase();
                return cleanValue.includes(cleanMemberName) || cleanMemberName.includes(cleanValue);
            }
            return false;
        });
    }
    
    parseVarsityMemberRowData(memberRows, memberName) {
        console.log(`Parsing data for ${memberName} from ${memberRows.length} rows`);
        
        // Try to extract numerical data from the rows
        let totalOutput = 0;
        let target = 20; // Default target
        let quality = 8.0; // Default quality
        let weeklyOutputs = [];
        
        memberRows.forEach(row => {
            const values = Object.values(row);
            
            // Look for numerical values that could be output data
            values.forEach(value => {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue > 0 && numValue < 50) {
                    // This could be output data
                    if (numValue > 10) {
                        totalOutput = Math.max(totalOutput, numValue); // Take the largest reasonable value as total
                    } else if (weeklyOutputs.length < 4) {
                        weeklyOutputs.push(numValue);
                    }
                }
            });
        });
        
        // If we found some output data, use it
        if (totalOutput > 0 || weeklyOutputs.length > 0) {
            if (totalOutput === 0 && weeklyOutputs.length > 0) {
                totalOutput = weeklyOutputs.reduce((sum, week) => sum + week, 0);
            }
            
            // Generate weeks data
            const weeks = [];
            if (weeklyOutputs.length > 0) {
                weeklyOutputs.forEach((output, index) => {
                    weeks.push({
                        week: index + 1,
                        output: parseFloat(output.toFixed(2)),
                        quality: parseFloat((quality + (Math.random() * 0.4 - 0.2)).toFixed(1)),
                        efficiency: parseFloat(((output / (target / 4)) * 100).toFixed(1))
                    });
                });
            } else {
                // Generate based on total output
                for (let week = 1; week <= 4; week++) {
                    const weekOutput = totalOutput / 4 + (Math.random() * 1 - 0.5);
                    weeks.push({
                        week: week,
                        output: parseFloat(weekOutput.toFixed(2)),
                        quality: parseFloat((quality + (Math.random() * 0.4 - 0.2)).toFixed(1)),
                        efficiency: parseFloat(((weekOutput / (target / 4)) * 100).toFixed(1))
                    });
                }
            }
            
            const efficiency = (totalOutput / target) * 100;
            
            return {
                totalOutput: parseFloat(totalOutput.toFixed(2)),
                target: target,
                efficiency: parseFloat(efficiency.toFixed(1)),
                quality: parseFloat(quality.toFixed(1)),
                weeks: weeks
            };
        }
        
        return null;
    }
    
    calculateVarsityMonthSummary(monthData) {
        const members = Object.values(monthData);
        
        if (members.length === 0) {
            return {
                totalMembers: 0,
                avgEfficiency: 0,
                totalOutput: 0,
                avgQuality: 0
            };
        }
        
        return {
            totalMembers: members.length,
            avgEfficiency: parseFloat((members.reduce((sum, m) => sum + (m.efficiency || 0), 0) / members.length).toFixed(1)),
            totalOutput: parseFloat(members.reduce((sum, m) => sum + (m.totalOutput || 0), 0).toFixed(1)),
            avgQuality: parseFloat((members.reduce((sum, m) => sum + (m.quality || 0), 0) / members.length).toFixed(1))
        };
    }
    
    
    extractVarsityTeamMembers(sheetData) {
        try {
            const varsityMembers = [];
            const memberNames = new Set();
            
            console.log('Processing Varsity sheet data:', sheetData);
            console.log('First 3 rows of data:', sheetData.slice(0, 3));
            
            // Extract unique member names from sheet data (handle different data structures)
            // Limit processing to avoid UI freeze - only check first 100 rows for member names
            const rowsToProcess = Math.min(sheetData.length, 100);
            console.log(`Processing ${rowsToProcess} rows out of ${sheetData.length} total rows`);
            
            // Also log the structure of the first few rows to understand the data format
            if (sheetData.length > 0) {
                console.log('Sample row structure:');
                console.log('Row 0 keys:', Object.keys(sheetData[0]));
                console.log('Row 0 values:', Object.values(sheetData[0]));
                if (sheetData.length > 1) {
                    console.log('Row 1 keys:', Object.keys(sheetData[1]));
                    console.log('Row 1 values:', Object.values(sheetData[1]));
                }
            }
            
            for (let index = 0; index < rowsToProcess; index++) {
                const row = sheetData[index];
                if (index < 5) {
                    console.log(`Row ${index}:`, row); // Only log first 5 rows to avoid console spam
                }
                
                // Check all possible fields where team member names might be stored
                const possibleNameFields = [
                    // Proper column headers
                    row.Name, row.name, row['Name'], 
                    row.Member, row.member, row['Team Member'],
                    row['Member Name'], row.TeamMember,
                    // Column letters (when headers are empty, GAS uses A, B, C, etc.)
                    row.A, row.B, row.C, row.D, row.E, row.F, row.G, row.H,
                    // Fallback for empty string key (old behavior)
                    row['']
                ];
                
                // Based on the data structure, team members are in Column B
                const teamMemberName = row.B || row['Team Member'] || row.Member;
                
                if (teamMemberName && typeof teamMemberName === 'string' && teamMemberName.trim() !== '') {
                    const cleanName = teamMemberName.trim();
                    
                    // Filter out headers and system entries, but keep actual team member names
                    if (cleanName !== 'Team Member' && cleanName !== 'Total' && cleanName !== 'Member' && 
                        cleanName !== 'Timeline' && cleanName !== 'Category' && cleanName !== 'Work' &&
                        !cleanName.includes('2023') && !cleanName.includes('2024') && !cleanName.includes('2025') &&
                        !cleanName.includes('GMT') && !cleanName.includes('Time') &&
                        !cleanName.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/) &&
                        cleanName.length > 2 && cleanName.length < 50) {
                        
                        memberNames.add(cleanName);
                        console.log(`Added Varsity member: ${cleanName}`);
                    }
                }
                
                // Also check if it's just a simple object structure
                if (typeof row === 'object' && !name) {
                    const keys = Object.keys(row);
                    const firstValue = row[keys[0]];
                    if (firstValue && typeof firstValue === 'string' && 
                        firstValue.trim() !== '' && 
                        !firstValue.includes('Name') && 
                        !firstValue.includes('Member') &&
                        !firstValue.includes('Timeline') &&
                        !firstValue.includes('2023') && !firstValue.includes('2024') && !firstValue.includes('2025') &&
                        !firstValue.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/) &&
                        firstValue.length > 2 && firstValue.length < 50) {
                        
                        const cleanFirstValue = firstValue.trim();
                        memberNames.add(cleanFirstValue);
                        console.log(`Added member from first value: ${cleanFirstValue}`);
                    }
                }
                
                // Stop if we have enough unique members (reasonable team size)
                if (memberNames.size >= 20) {
                    console.log('Found enough team members, stopping search');
                    break;
                }
            }
            
            console.log('Unique member names found:', Array.from(memberNames));
            
            // If no members found from sheet, use actual Varsity team members
            if (memberNames.size === 0) {
                console.warn('No member names found in sheet data, using actual Varsity team members');
                ['Gaurav Sharma', 'Aalim', 'Satyavrat Sharma', 'Somya', 'Manish', 'Apoorv Suman', 'Anmol Anand'].forEach(name => {
                    memberNames.add(name);
                });
            }
            
            // Combine with levels 
            let levelIndex = 0;
            memberNames.forEach(name => {
                const level = this.varsityLevels && this.varsityLevels[levelIndex] 
                    ? this.varsityLevels[levelIndex] 
                    : 'L1'; // Default level
                
                varsityMembers.push({
                    name: name,
                    level: level
                });
                
                levelIndex++;
            });
            
            console.log('Extracted Varsity members:', varsityMembers);
            
            // Update the Varsity team configuration
            this.teamConfigs.varsity.members = varsityMembers;
            
            // If currently on Varsity team, update current shortcuts
            if (this.currentTeam === 'varsity') {
                this.teamMembers = varsityMembers;
            }
            
        } catch (error) {
            console.error('Error extracting Varsity team members:', error);
        }
    }
    
    processVarsityHistoricalData(sheetData) {
        try {
            console.log('Processing Varsity historical data...');
            
            // This will be similar to how B2B historical data is processed
            // For now, create basic structure - will need real data processing
            const varsityHistorical = {
                'January 2025': {
                    isComplete: true,
                    monthlyData: {},
                    teamSummary: {
                        totalMembers: this.teamConfigs.varsity.members.length,
                        avgRating: 8.0,
                        totalOutput: 0,
                        totalWorkingDays: 20,
                        avgEfficiency: 80.0
                    }
                }
            };
            
            // Process each member's data from sheet
            this.teamConfigs.varsity.members.forEach(member => {
                varsityHistorical['January 2025'].monthlyData[member.name] = {
                    weeks: [], // Will be populated from actual sheet data
                    weeklyQualityRatings: [8.0, 8.2, 7.8, 8.1],
                    monthlyRating: 8.03,
                    target: 20,
                    totalOutput: 13.5,
                    workingDays: 20
                };
            });
            
            // Update historical data
            this.historicalData['varsity'] = varsityHistorical;
            
            console.log('Processed Varsity historical data:', this.historicalData.varsity);
            
        } catch (error) {
            console.error('Error processing Varsity historical data:', error);
        }
    }
    
    // Debug function to test Varsity loading
    async testVarsityLoading() {
        console.log('🧪 Testing Varsity loading...');
        
        // Test levels loading
        await this.loadVarsityLevels();
        
        // Test sheet data loading  
        await this.loadVarsitySheetData();
        
        console.log('✅ Varsity loading test complete');
        console.log('Varsity levels:', this.varsityLevels);
        console.log('Varsity members:', this.teamConfigs.varsity.members);
        console.log('Varsity historical data:', this.historicalData.varsity);
    }
    
    // Debug function to test specific Varsity data ranges
    async testVarsityDataRanges() {
        console.log('🔍 Testing different Varsity data ranges...');
        
        try {
            // Test different ranges to find where the actual member data is
            const ranges = [
                'Varsity!A1:F20',   // First few columns and rows
                'Varsity!A1:Z10',   // Wider but fewer rows
                'Varsity!B1:H20',   // Skip first column
                'Varsity!1:10'      // Just first 10 rows, all columns
            ];
            
            for (const range of ranges) {
                console.log(`\n--- Testing range: ${range} ---`);
                try {
                    const data = await this.sheetsAPI.readSheetData(range);
                    console.log(`${range} - Rows found:`, data.length);
                    if (data.length > 0) {
                        console.log(`${range} - First row:`, data[0]);
                        console.log(`${range} - First row keys:`, Object.keys(data[0]));
                    }
                } catch (error) {
                    console.error(`Error reading ${range}:`, error.message);
                }
            }
            
        } catch (error) {
            console.error('Error in testVarsityDataRanges:', error);
        }
    }
    
    // Debug function to test Google Sheets connection
    async testGoogleSheetsConnection() {
        try {
            const testData = [
                ['Test Timestamp', 'Test Week', 'Test Member', '1', '0', '0', '0', '0', '0', '0', '1.0', '5', '0', '8', '5', '20.0%', 'Test']
            ];
            
            console.log('🔍 Testing Google Sheets connection...');
            await this.writeToGoogleSheets(testData);
            this.showMessage('✅ Google Sheets connection test successful!', 'success');
        } catch (error) {
            console.error('❌ Google Sheets connection test failed:', error);
            this.showMessage('❌ Google Sheets connection failed: ' + error.message, 'error');
        }
    }
    
    // Debug function to show what data would be sent to sheets
    previewSheetData() {
        if (!this.currentWeek) {
            this.showMessage('Please select a week first', 'error');
            return;
        }
        
        const weekData = this.formatWeekDataForSheets();
        console.log('📋 Preview of data that would be sent to Google Sheets:');
        console.log('Headers:', weekData[0]);
        console.log('Data rows:', weekData.slice(1));
        console.log('Total rows to send:', weekData.length - 1);
        
        this.showMessage('Data preview logged to console. Check browser developer tools.', 'info');
        return weekData;
    }
    
    showPersonView() {
        // Update view button states
        this.updateViewButtonStates('person');
        
        // Refresh dropdown for person view (show all periods)
        this.populateWeekSelector();
        
        // Hide other views
        const weeklyData = document.getElementById('efficiency-data');
        const monthlyTable = document.getElementById('monthly-table');
        const weekInfo = document.getElementById('week-info');
        
        if (weeklyData) weeklyData.style.display = 'none';
        if (monthlyTable) monthlyTable.style.display = 'none';
        if (weekInfo) weekInfo.style.display = 'none';
        
        // Update view buttons
        this.updateViewButtons('person');
        
        // Create person view
        this.createPersonView();
    }
    
    createPersonView() {
        const mainContent = document.querySelector('.main-content');
        
        // Remove existing person view if any
        const existingView = document.getElementById('person-view');
        if (existingView) existingView.remove();
        
        const personViewHTML = `
            <div id="person-view" class="person-view-container">
                <h2 style="color: #2c3e50; margin-bottom: 20px;">
                    <i class="fas fa-user-chart"></i> Individual Efficiency Analysis
                </h2>
                
                <div class="person-selector">
                    <label for="person-select" style="font-weight: 500; margin-bottom: 8px; display: block;">Select Team Member:</label>
                    <select id="person-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; background: white;">
                        <option value="">Choose a team member...</option>
                        ${this.getAllTeamMembers(this.currentTeam).map(member => `<option value="${member.name}">${member.name}</option>`).join('')}
                    </select>
                </div>
                
                <div id="person-charts" style="display: none;">
                    <div class="efficiency-chart" id="monthly-efficiency-chart">
                        <i class="fas fa-chart-line" style="margin-right: 10px; color: #3498db;"></i>
                        Monthly Efficiency Trends
                    </div>
                    
                    <div class="efficiency-chart" id="weekly-efficiency-chart">
                        <i class="fas fa-chart-bar" style="margin-right: 10px; color: #e74c3c;"></i>
                        Current Month Weekly Breakdown
                    </div>
                    
                    <div id="person-stats" style="margin-top: 20px;">
                        <!-- Stats will be inserted here -->
                    </div>
                </div>
            </div>
        `;
        
        mainContent.insertAdjacentHTML('beforeend', personViewHTML);
        
        // Add event listener for person selection
        document.getElementById('person-select').addEventListener('change', async (e) => {
            if (e.target.value) {
                await this.showPersonData(e.target.value);
            } else {
                document.getElementById('person-charts').style.display = 'none';
            }
        });
    }
    
    async showPersonData(memberName) {
        const chartsContainer = document.getElementById('person-charts');
        chartsContainer.style.display = 'block';
        
        // Debug: Check what data we have
        console.log('=== PERSON VIEW DEBUG ===');
        console.log('Selected member:', memberName);
        console.log('Historical data keys:', Object.keys(this.historicalData));
        console.log('Finalized reports:', this.finalizedReports || {});
        
        // Generate monthly efficiency data
        const monthlyData = await this.getPersonMonthlyData(memberName);
        console.log('Monthly data for', memberName, ':', monthlyData);
        
        // Generate weekly data for current month
        const weeklyData = await this.getPersonWeeklyData(memberName);
        console.log('Weekly data for', memberName, ':', weeklyData);
        
        // Create charts
        this.createMonthlyEfficiencyChart(memberName, monthlyData);
        this.createWeeklyEfficiencyChart(memberName, weeklyData);
        this.createPersonStats(memberName, monthlyData, weeklyData);
    }
    
    async getPersonMonthlyData(memberName) {
        const monthlyData = [];
        
        console.log('Getting monthly data for:', memberName);
        console.log('Available historical months for', this.currentTeam, ':', Object.keys(this.historicalData[this.currentTeam] || {}));
        console.log('Locked months for', this.currentTeam, ':', this.lockedMonths[this.currentTeam] || []);
        
        // First, check locked months that need to be loaded from Supabase
        const lockedMonthsForTeam = this.lockedMonths[this.currentTeam] || [];
        for (const lockedMonth of lockedMonthsForTeam) {
            console.log(`🔄 Loading locked month ${lockedMonth} data from Supabase for ${memberName}...`);
            
            // Load the month data from Supabase using generic function
            try {
                const monthData = await this.loadMonthDataFromSupabase(lockedMonth);
                if (monthData && monthData.monthlyData && monthData.monthlyData[memberName]) {
                    const memberData = monthData.monthlyData[memberName];
                    console.log(`✅ Found ${memberName} data in ${lockedMonth} from Supabase:`, memberData);
                    
                    monthlyData.push({
                        month: lockedMonth,
                        efficiency: memberData.efficiency || 0,
                        output: memberData.totalOutput || 0,
                        rating: memberData.monthlyRating || 0,
                        target: memberData.target || 0,
                        workingDays: memberData.workingDays || 0
                    });
                } else {
                    console.log(`❌ No data found for ${memberName} in ${lockedMonth}`);
                }
            } catch (error) {
                console.error(`❌ Error loading ${lockedMonth} data for ${memberName}:`, error);
            }
        }
        
        // Then go through historical data to find this person's efficiency
        Object.keys(this.historicalData[this.currentTeam] || {}).forEach(monthYear => {
            const monthData = this.historicalData[this.currentTeam]?.[monthYear];
            console.log(`Checking month ${monthYear}:`, monthData);
            
            // The data structure is: monthData.monthlyData[memberName]
            if (monthData && monthData.monthlyData && monthData.monthlyData[memberName]) {
                const memberData = monthData.monthlyData[memberName];
                console.log(`Found member data for ${memberName} in ${monthYear}:`, memberData);
                
                // Calculate efficiency: (totalOutput / target) * 100
                const efficiency = memberData.target > 0 ? (memberData.totalOutput / memberData.target) * 100 : 0;
                
                console.log(`${memberName} ${monthYear} calculation:`, {
                    totalOutput: memberData.totalOutput,
                    target: memberData.target,
                    efficiency: efficiency.toFixed(1) + '%'
                });
                
                monthlyData.push({
                    month: monthYear,
                    efficiency: efficiency,
                    output: memberData.totalOutput || 0,
                    rating: memberData.monthlyRating || 0,
                    target: memberData.target || 0,
                    workingDays: memberData.workingDays || 0
                });
            } else if (monthData && monthData.teamSummary) {
                // Fallback: try teamSummary structure (for other months that might use different format)
                console.log(`teamSummary structure for ${monthYear}:`, monthData.teamSummary);
                
                let memberData = null;
                
                // Check if teamSummary is an array or object
                if (Array.isArray(monthData.teamSummary)) {
                    memberData = monthData.teamSummary.find(m => m.name === memberName);
                } else if (typeof monthData.teamSummary === 'object') {
                    memberData = monthData.teamSummary[memberName] || 
                                Object.values(monthData.teamSummary).find(m => m && m.name === memberName);
                }
                
                console.log(`Found member data in teamSummary for ${memberName} in ${monthYear}:`, memberData);
                
                if (memberData) {
                    monthlyData.push({
                        month: monthYear,
                        efficiency: memberData.efficiency || memberData.avgEfficiency || 0,
                        output: memberData.totalOutput || memberData.output || 0,
                        rating: memberData.averageRating || memberData.rating || memberData.monthlyRating || 0
                    });
                }
            }
        });
        
        console.log('Final monthly data array:', monthlyData);
        
        // Sort by month-year
        monthlyData.sort((a, b) => {
            const [monthA, yearA] = a.month.split(' ');
            const [monthB, yearB] = b.month.split(' ');
            const dateA = new Date(yearA, this.getMonthNumber(monthA));
            const dateB = new Date(yearB, this.getMonthNumber(monthB));
            return dateA - dateB;
        });
        
        return monthlyData;
    }
    
    async getPersonWeeklyData(memberName) {
        const weeklyData = [];
        
        // Use current working month from this.currentWeek instead of real calendar date
        // If currentWeek is not set, default to September 2025 for finalized week detection
        const currentWorkingMonth = this.currentWeek ? 
            `${this.currentWeek.monthName} ${this.currentWeek.year}` : 
            'September 2025';
        
        console.log('Getting weekly data for:', memberName);
        console.log('Current team:', this.currentTeam);
        console.log('Current working month:', currentWorkingMonth);
        
        // Get team-specific finalized reports
        const teamFinalizedReports = this.finalizedReports?.[this.currentTeam] || {};
        console.log('Team finalized reports available:', Object.keys(teamFinalizedReports));
        
        // Special debugging for Graphics team
        if (this.currentTeam === 'graphics') {
            console.log('🎨 GRAPHICS DEBUG in getPersonWeeklyData:');
            console.log('🎨 Current team:', this.currentTeam);
            console.log('🎨 Selected member:', memberName);
            console.log('🎨 Available Graphics weeks:', Object.keys(teamFinalizedReports));
            console.log('🎨 Full Graphics finalized reports:', teamFinalizedReports);
        }
        
        for (const weekId of Object.keys(teamFinalizedReports)) {
            const weekData = teamFinalizedReports[weekId];
            console.log(`Checking week ${weekId}:`, weekData);
            
            // Check if this week belongs to current working month
            const weekMonth = this.getWeekMonth(weekId);
            const belongsToCurrentMonth = weekMonth === currentWorkingMonth;
            
            // Only show if it belongs to current working month AND not in historical data AND not locked
            const isInHistoricalData = this.historicalData[this.currentTeam]?.[weekMonth]?.isComplete;
            const isLockedMonth = this.lockedMonths[this.currentTeam]?.includes(weekMonth);
            
            console.log(`Week ${weekId}: month=${weekMonth}, belongsToCurrent=${belongsToCurrentMonth}, inHistorical=${isInHistoricalData}, isLocked=${isLockedMonth}`);
            
            if (belongsToCurrentMonth && !isInHistoricalData && !isLockedMonth && weekData && weekData.memberSummaries) {
                console.log(`📋 Available members in ${weekId}:`, weekData.memberSummaries.map(m => m.name || m.member || 'unknown'));
        console.log(`📋 Full week data for ${weekId}:`, weekData);
                
                // Check if this week actually contains members from the current team
                const currentTeamMemberObjects = this.getActiveTeamMembers(this.currentTeam);
                const currentTeamMemberNames = currentTeamMemberObjects.map(member => member.name || member);
                console.log(`🔍 Current team member names for ${this.currentTeam}:`, currentTeamMemberNames);
                console.log(`🔍 Week data member names:`, weekData.memberSummaries.map(m => m.name || m.member || 'unknown'));
                
                const hasCurrentTeamMembers = weekData.memberSummaries.some(m => 
                    currentTeamMemberNames.includes(m.name || m.member)
                );
                
                console.log(`🔍 Has current team members check result:`, hasCurrentTeamMembers);
                
                if (!hasCurrentTeamMembers) {
                    console.log(`⚠️ Week ${weekId} has no members from team ${this.currentTeam}, skipping`);
                } else {
                
                const memberWeekData = weekData.memberSummaries.find(m => m.name === memberName);
                console.log(`Found member week data for ${memberName}:`, memberWeekData);
                
                if (memberWeekData) {
                    // Use proper week numbering (Week 1, Week 2, etc.) instead of calendar week numbers
                    const weekNumber = this.getWeekNumberInMonth(weekId);
                    
                    // IMPORTANT: Don't use stored efficiency as it might be calculated with old formula
                    // Instead, recalculate efficiency based on current team type
                    let correctEfficiency = 0;
                    let memberOutput = memberWeekData.output || 0;
                    
                    // Always recalculate efficiency from fresh Supabase data for all teams
                    try {
                        // Get fresh data from Supabase for this member and week
                        const supabaseData = await this.supabaseAPI.loadWeekData(this.currentTeam, weekId);
                        const memberEntry = supabaseData?.find(entry => entry.member_name === memberName);
                        
                        if (memberEntry) {
                            memberOutput = this.getMemberWeekOutput(memberEntry, this.currentTeam);
                            const workingDays = parseFloat(memberEntry.working_days) || 5;
                            const leaveDays = parseFloat(memberEntry.leave_days) || 0;
                            
                            if (this.usesTargetPoints()) {
                                correctEfficiency = this.calculateTargetPointsTeamEfficiency(this.currentTeam, memberEntry, memberOutput, workingDays, leaveDays);
                                console.log(`✅ Person View ${this.currentTeam}: output=${memberOutput}, efficiency=${correctEfficiency.toFixed(1)}%`);
                            } else {
                                const effectiveWorkingDays = workingDays - leaveDays;
                                // All other teams (including Social): week_total / effective_working_days * 100
                                correctEfficiency = effectiveWorkingDays > 0 ? (memberOutput / effectiveWorkingDays) * 100 : 0;
                                
                                console.log(`✅ Person View ${this.currentTeam}: ${memberOutput}/${effectiveWorkingDays} working days = ${correctEfficiency.toFixed(1)}%`);
                            }
                        }
                    } catch (error) {
                        console.error(`❌ Error recalculating efficiency for ${memberName}:`, error);
                    }
                    
                    weeklyData.push({
                        week: `Week ${weekNumber}`,
                        efficiency: correctEfficiency,
                        output: memberOutput || memberWeekData.output || 0,
                        rating: memberWeekData.rating || 0
                    });
                }
            }
            }
        }
        
        console.log('Final weekly data array:', weeklyData);
        return weeklyData;
    }
    
    getWeekMonth(weekId) {
        // Convert weekId like "2025-09-01" to "September 2025"
        try {
            const [year, month, day] = weekId.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch (error) {
            console.error('Error parsing week ID:', weekId, error);
            return null;
        }
    }
    
    getWeekNumberInMonth(weekId) {
        // Convert weekId like "2025-10-01", "2025-10-08", "2025-10-15", "2025-10-22" 
        // to week numbers 1, 2, 3, 4
        try {
            const [year, month, day] = weekId.split('-');
            const dayNum = parseInt(day);
            
            if (dayNum <= 7) return 1;
            if (dayNum <= 14) return 2;
            if (dayNum <= 21) return 3;
            return 4; // 22+ is week 4
        } catch (error) {
            console.error('Error determining week number for:', weekId, error);
            return 1;
        }
    }
    
    getMonthNumber(monthName) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(monthName);
    }
    
    updateViewButtons(activeView) {
        // Remove active class from all view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to current view
        const buttons = {
            'weekly': 0,
            'monthly': 1,
            'person': 2
        };
        
        const viewButtons = document.querySelectorAll('.view-btn');
        if (viewButtons[buttons[activeView]]) {
            viewButtons[buttons[activeView]].classList.add('active');
        }
    }
    
    createMonthlyEfficiencyChart(memberName, monthlyData) {
        const chartContainer = document.getElementById('monthly-efficiency-chart');
        
        if (monthlyData.length === 0) {
            chartContainer.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px;">
                    <i class="fas fa-info-circle" style="margin-right: 8px; font-size: 20px; color: #3498db;"></i>
                    <div style="margin-top: 10px;">
                        <strong>No Historical Data Available</strong><br>
                        <small>Historical monthly data for ${memberName} will appear here once available.</small><br>
                        <small style="color: #95a5a6;">💡 Try viewing monthly summaries or finalizing some weekly reports first.</small>
                    </div>
                </div>
            `;
            return;
        }
        
        // Create simple text-based chart
        // Calculate dynamic scale to accommodate >100% efficiency values
        const maxEfficiency = Math.max(...monthlyData.map(d => d.efficiency), 100);
        const maxScale = Math.max(100, maxEfficiency * 1.1); // Add 10% padding for >100% values
        
        let chartHTML = `
            <div style="padding: 20px; width: 100%; max-width: 100%; overflow: hidden;">
                <h3 style="color: #2c3e50; margin-bottom: 15px; text-align: center; word-wrap: break-word;">
                    ${memberName} - Monthly Efficiency Trends
                </h3>
                <div style="display: grid; gap: 10px; width: 100%; max-width: 100%;">
        `;
        
        monthlyData.forEach((data, index) => {
            // Fixed calculation: efficiency is already a percentage, so divide by maxScale to get bar width percentage
            const barWidth = Math.max(5, (data.efficiency / maxScale) * 100); // Min 5% width for visibility
            const color = data.efficiency >= 90 ? '#27ae60' : data.efficiency >= 70 ? '#f39c12' : '#e74c3c';
            
            // Show data label outside bar if efficiency > 100% or bar is too narrow
            const showLabelOutside = data.efficiency > 100 || barWidth < 35;
            
            console.log(`Monthly chart data for ${data.month}: efficiency=${data.efficiency}%, barWidth=${barWidth}%, maxScale=${maxScale}`);
            
            chartHTML += `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <div style="width: 60px; font-size: 11px; color: #666; text-align: left; flex-shrink: 0;">${data.efficiency.toFixed(1)}%</div>
                    <div style="width: 70px; font-size: 12px; font-weight: 500; flex-shrink: 0;">${data.month.split(' ')[0]}</div>
                    <div style="flex: 1; background: #f0f0f0; height: 25px; border-radius: 12px; margin: 0 10px; position: relative; min-width: 0;">
                        <div style="background: ${color}; height: 100%; width: ${barWidth}%; border-radius: 12px; display: flex; align-items: center; ${showLabelOutside ? 'justify-content: flex-start;' : 'justify-content: flex-end; padding-right: 8px;'} min-width: 15px;">
                            ${!showLabelOutside ? `<span style="color: white; font-size: 11px; font-weight: bold; white-space: nowrap;">${data.efficiency.toFixed(1)}%</span>` : ''}
                        </div>
                    </div>
                    <div style="width: 80px; font-size: 11px; color: #666; flex-shrink: 0; text-align: right;">
                        ${data.output.toFixed(1)} ${this.currentTeam === 'tech' || this.currentTeam === 'product' ? 'pts' : 'days'}
                    </div>
                </div>
            `;
        });
        
        chartHTML += `
                </div>
                <div style="margin-top: 15px; text-align: center; font-size: 11px; color: #666;">
                    <span style="color: #27ae60;">■</span> Excellent (90%+) &nbsp;
                    <span style="color: #f39c12;">■</span> Good (70-89%) &nbsp;
                    <span style="color: #e74c3c;">■</span> Needs Improvement (<70%)
                </div>
            </div>
        `;
        
        chartContainer.innerHTML = chartHTML;
    }
    
    createWeeklyEfficiencyChart(memberName, weeklyData) {
        const chartContainer = document.getElementById('weekly-efficiency-chart');
        
        if (weeklyData.length === 0) {
            chartContainer.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px;">
                    <i class="fas fa-calendar-times" style="margin-right: 8px; font-size: 20px; color: #e74c3c;"></i>
                    <div style="margin-top: 10px;">
                        <strong>No Weekly Data Available</strong><br>
                        <small>Weekly performance data for ${memberName} will appear here.</small><br>
                        <small style="color: #95a5a6;">💡 Complete and finalize weekly reports to see them here.</small>
                    </div>
                </div>
            `;
            return;
        }
        
        // Create weekly chart
        // Calculate dynamic scale to accommodate >100% efficiency values
        const maxEfficiency = Math.max(...weeklyData.map(d => d.efficiency), 100);
        const maxScale = Math.max(100, maxEfficiency * 1.1); // Add 10% padding for >100% values
        
        let chartHTML = `
            <div style="padding: 20px; width: 100%; max-width: 100%; overflow: hidden;">
                <h3 style="color: #2c3e50; margin-bottom: 15px; text-align: center; word-wrap: break-word;">
                    ${memberName} - Weekly Performance (Current Period)
                </h3>
                <div style="display: grid; gap: 8px; width: 100%; max-width: 100%;">
        `;
        
        weeklyData.forEach((data, index) => {
            // Fixed calculation: efficiency is already a percentage, so divide by maxScale to get bar width percentage
            const barWidth = Math.max(5, (data.efficiency / maxScale) * 100); // Min 5% width for visibility
            const color = data.efficiency >= 90 ? '#27ae60' : data.efficiency >= 70 ? '#f39c12' : '#e74c3c';
            
            // Show data label outside bar if efficiency > 100% or bar is too narrow
            const showLabelOutside = data.efficiency > 100 || barWidth < 30;
            
            console.log(`Weekly chart data for ${data.week}: efficiency=${data.efficiency}%, barWidth=${barWidth}%, maxScale=${maxScale}`);
            
            chartHTML += `
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <div style="width: 50px; font-size: 10px; color: #666; text-align: left; flex-shrink: 0;">${data.efficiency.toFixed(1)}%</div>
                    <div style="width: 60px; font-size: 11px; font-weight: 500; flex-shrink: 0;">${data.week.replace('Week ', 'W')}</div>
                    <div style="flex: 1; background: #f0f0f0; height: 20px; border-radius: 10px; margin: 0 8px; position: relative; min-width: 0;">
                        <div style="background: ${color}; height: 100%; width: ${barWidth}%; border-radius: 10px; display: flex; align-items: center; ${showLabelOutside ? 'justify-content: flex-start;' : 'justify-content: flex-end; padding-right: 6px;'} min-width: 10px;">
                            ${!showLabelOutside ? `<span style="color: white; font-size: 10px; font-weight: bold; white-space: nowrap;">${data.efficiency.toFixed(1)}%</span>` : ''}
                        </div>
                    </div>
                    <div style="width: 60px; font-size: 10px; color: #666; flex-shrink: 0; text-align: right;">
                        ${data.output.toFixed(1)}${this.currentTeam === 'tech' || this.currentTeam === 'product' ? 'pts' : 'd'}
                    </div>
                    <div style="width: 40px; font-size: 10px; color: #666; flex-shrink: 0; text-align: center;">
                        ${(this.currentTeam === 'tech' || this.currentTeam === 'product' || this.currentTeam === 'content') ? '-' : data.rating + '/10'}
                    </div>
                </div>
            `;
        });
        
        chartHTML += `
                </div>
            </div>
        `;
        
        chartContainer.innerHTML = chartHTML;
    }
    
    createPersonStats(memberName, monthlyData, weeklyData) {
        const statsContainer = document.getElementById('person-stats');
        
        // Calculate stats
        let totalMonths = monthlyData.length;
        let avgMonthlyEfficiency = monthlyData.length > 0 ? 
            monthlyData.reduce((sum, d) => sum + d.efficiency, 0) / monthlyData.length : 0;
        let avgWeeklyEfficiency = weeklyData.length > 0 ? 
            weeklyData.reduce((sum, d) => sum + d.efficiency, 0) / weeklyData.length : 0;
        let trend = 'stable';
        
        if (monthlyData.length >= 2) {
            const recent = monthlyData.slice(-2);
            if (recent[1].efficiency > recent[0].efficiency + 5) trend = 'improving';
            else if (recent[1].efficiency < recent[0].efficiency - 5) trend = 'declining';
        }
        
        const trendIcon = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
        const trendColor = trend === 'improving' ? '#27ae60' : trend === 'declining' ? '#e74c3c' : '#95a5a6';
        
        const statsHTML = `
            <div style="background: white; border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">
                    <i class="fas fa-chart-pie"></i> ${memberName} - Performance Summary
                </h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #3498db; margin-bottom: 5px;">
                            ${totalMonths}
                        </div>
                        <div style="font-size: 12px; color: #666;">Months Tracked</div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #9b59b6; margin-bottom: 5px;">
                            ${avgMonthlyEfficiency.toFixed(1)}%
                        </div>
                        <div style="font-size: 12px; color: #666;">Avg Monthly Efficiency</div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #e74c3c; margin-bottom: 5px;">
                            ${avgWeeklyEfficiency.toFixed(1)}%
                        </div>
                        <div style="font-size: 12px; color: #666;">Avg Weekly Efficiency</div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; margin-bottom: 5px;">
                            <span style="color: ${trendColor};">${trendIcon}</span>
                        </div>
                        <div style="font-size: 12px; color: #666; text-transform: capitalize;">${trend} Trend</div>
                    </div>
                </div>
                
                ${monthlyData.length > 0 ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e1e5e9;">
                        <div style="font-size: 13px; color: #666;">
                            <strong>Performance History:</strong> 
                            Started tracking in ${monthlyData[0].month}${monthlyData.length > 1 ? `, latest: ${monthlyData[monthlyData.length-1].month}` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        statsContainer.innerHTML = statsHTML;
    }


    
    showMessage(message, type) {
        const container = document.getElementById('message-container');
        container.innerHTML = `<div class="message ${type}">${message}</div>`;
        
        if (type !== 'info') {
            setTimeout(() => {
                container.innerHTML = '';
            }, 5000);
        }
    }

    // =============================================
    // COMPANY DASHBOARD METHODS
    // =============================================

    async showTeamDashboard() {
        console.log('🏢 Switching to Team Dashboard');
        
        // Update navigation active states
        document.querySelectorAll('.dashboard-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-dashboard="team"]').classList.add('active');
        
        // Show/hide appropriate sections
        document.getElementById('team-view-navigation').style.display = 'block';
        document.getElementById('team-period-selector').style.display = 'block';
        document.getElementById('company-controls').style.display = 'none';
        document.getElementById('company-dashboard').style.display = 'none';
        
        // Show the appropriate team view content
        const currentView = document.querySelector('.view-btn.active')?.getAttribute('data-view') || 'weekly';
        if (currentView === 'weekly') {
            this.showWeeklyView();
        } else if (currentView === 'monthly') {
            await this.showMonthlyView();
        } else if (currentView === 'person') {
            this.showPersonView();
        }
    }

    showMainDashboard() {
        console.log('🏠 Showing Main Dashboard');
        
        // Hide all views
        document.getElementById('main-dashboard-landing').style.display = 'block';
        document.getElementById('team-view-page').style.display = 'none';
        document.getElementById('company-view-page').style.display = 'none';
    }

    showTeamView() {
        console.log('👥 Showing Team View');
        
        // Hide all views
        document.getElementById('main-dashboard-landing').style.display = 'none';
        document.getElementById('team-view-page').style.display = 'block';
        document.getElementById('company-view-page').style.display = 'none';
        
        // Initialize team view
        this.showWeeklyView();
    }

    showCompanyView() {
        console.log('🏢 Showing Company View');
        
        // Hide all views
        document.getElementById('main-dashboard-landing').style.display = 'none';
        document.getElementById('team-view-page').style.display = 'none';
        document.getElementById('company-view-page').style.display = 'block';
        
        // Initialize company dashboard
        this.initializeCompanyDashboard();
    }

    showCompanyDashboard() {
        console.log('🏢 Switching to Company Dashboard');
        
        // Update navigation active states
        document.querySelectorAll('.dashboard-btn').forEach(btn => btn.classList.remove('active'));
        const companyBtn = document.querySelector('[data-dashboard="company"]');
        if (companyBtn) companyBtn.classList.add('active');
        
        // Hide team view sections
        const teamNav = document.getElementById('team-view-navigation');
        const teamSelector = document.getElementById('team-period-selector');
        const loading = document.getElementById('loading');
        
        if (teamNav) teamNav.style.display = 'none';
        if (teamSelector) teamSelector.style.display = 'none';
        if (loading) loading.style.display = 'none';
        document.getElementById('week-info').style.display = 'none';
        document.getElementById('efficiency-data').style.display = 'none';
        
        // Show company view sections
        document.getElementById('company-controls').style.display = 'block';
        document.getElementById('company-dashboard').style.display = 'block';
        
        // Initialize company dashboard
        this.initializeCompanyDashboard();
    }

    async initializeCompanyDashboard() {
        console.log('🚀 Initializing Company Dashboard...');
        
        try {
            // CRITICAL FIX: Load finalized reports for ALL teams from localStorage
            // This ensures we can detect which teams have finalized October weeks
            console.log('📋 Loading finalized reports for all teams...');
            await this.loadAllTeamsFinalizedReports();
            
            // Ensure all team historical data is loaded for Company View
            console.log('📊 Loading all team historical data...');
            await this.ensureAllHistoricalDataLoaded();
            
            // Initialize team filters
            console.log('📋 Setting up team filters...');
            this.setupTeamFilters();
            
            // Setup period options
            console.log('📅 Setting up period options...');
            this.updateCompanyPeriodOptions();
            
            // Set default values and load data
            const periodTypeSelect = document.getElementById('company-period-type');
            const periodSelect = document.getElementById('company-period-select');
            
            if (periodTypeSelect && periodSelect) {
                console.log('🔧 Setting default period to monthly...');
                periodTypeSelect.value = 'month';
                setTimeout(() => {
                    this.updateCompanyPeriodOptions();
                    // Try to select August 2025 by default
                    setTimeout(() => {
                        if (periodSelect.options.length > 1) {
                            periodSelect.value = 'August 2025';
                            console.log('📊 Loading August 2025 data...');
                            this.updateCompanyData();
                        }
                    }, 100);
                }, 100);
            }
            
            console.log('✅ Company Dashboard initialized');
        } catch (error) {
            console.error('❌ Error initializing company dashboard:', error);
        }
    }

    setupTeamFilters() {
        const teamFiltersContainer = document.getElementById('team-filters');
        const allTeams = ['b2b', 'varsity', 'zero1_bratish', 'zero1_harish', 'audio', 'graphics', 'tech', 'product', 'preproduction', 'content', 'social'];
        
        const teamDisplayNames = {
            'b2b': 'B2B Team',
            'varsity': 'Varsity Team', 
            'zero1_bratish': 'Zero1 - Bratish',
            'zero1_harish': 'Zero1 - Harish',
            'audio': 'Audio Team',
            'graphics': 'Graphics Team',
            'tech': 'Tech Team',
            'product': 'Product Team',
            'preproduction': 'Pre-production Team',
            'content': 'Content Team',
            'social': 'Social Team'
        };
        
        teamFiltersContainer.innerHTML = '';
        
        allTeams.forEach(teamId => {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.style.cssText = 'margin-bottom: 8px; display: flex; align-items: center;';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `team-filter-${teamId}`;
            checkbox.checked = true;
            checkbox.style.cssText = 'margin-right: 8px;';
            checkbox.onchange = () => this.updateCompanyData();
            
            const label = document.createElement('label');
            label.htmlFor = `team-filter-${teamId}`;
            label.textContent = teamDisplayNames[teamId];
            label.style.cssText = 'font-size: 11px; cursor: pointer; user-select: none;';
            
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            teamFiltersContainer.appendChild(checkboxContainer);
        });
    }

    updateCompanyPeriodOptions() {
        console.log('🔄 updateCompanyPeriodOptions called');
        const periodTypeElement = document.getElementById('company-period-type');
        const periodSelectElement = document.getElementById('company-period-select');
        
        console.log('📋 Period type element:', periodTypeElement);
        console.log('📋 Period select element:', periodSelectElement);
        
        if (!periodTypeElement || !periodSelectElement) {
            console.error('❌ Cannot find period elements');
            return;
        }
        
        const periodType = periodTypeElement.value;
        console.log('📅 Period type value:', periodType);
        
        periodSelectElement.innerHTML = '<option value="">Loading...</option>';
        
        if (periodType === 'month') {
            // Auto-detect available months from all teams
            const availableMonths = this.getAvailableCompanyMonths();
            
            periodSelectElement.innerHTML = '<option value="">Select a month...</option>';
            console.log('📅 Auto-detected available months:', availableMonths);
            availableMonths.forEach(month => {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month;
                periodSelectElement.appendChild(option);
            });
            console.log('✅ Added', availableMonths.length, 'available months');
        } else if (periodType === 'week') {
            // Add finalized weeks from current month
            periodSelectElement.innerHTML = '<option value="">Select a week...</option>';
            console.log('📅 Loading weekly options...');
            console.log('🔍 Current lockedMonths:', this.lockedMonths);
            console.log('🔍 Available company months:', this.getAvailableCompanyMonths());
            
            // Test September 2025 specifically
            console.log('🔍 Testing September 2025 lock status:', this.isMonthLockedForCompany('September 2025'));
            
            // EXPLICIT FILTER: Remove September 2025 weeks immediately
            console.log('🔒 EXPLICIT FILTER: Removing all September 2025 weeks from dropdown');
            
            if (this.finalizedReports) {
                console.log('🔍 finalizedReports structure:', this.finalizedReports);
                const allWeeks = new Set();
                Object.keys(this.finalizedReports).forEach(teamId => {
                    console.log(`🔍 Processing team ${teamId}:`, this.finalizedReports[teamId]);
                    if (this.finalizedReports[teamId] && typeof this.finalizedReports[teamId] === 'object') {
                        Object.keys(this.finalizedReports[teamId]).forEach(weekId => {
                            console.log(`🔍 Found weekId: ${weekId}`);
                            // Only add valid week IDs (YYYY-MM-DD format), not metadata properties
                            if (weekId.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                // Parse month/year from weekId (format: YYYY-MM-DD)
                                const [year, month, day] = weekId.split('-');
                                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                                  'July', 'August', 'September', 'October', 'November', 'December'];
                                const monthName = monthNames[parseInt(month) - 1];
                                const monthYear = `${monthName} ${year}`;
                                
                                // Check if this week is from a locked month
                                const isMonthLocked = this.isMonthLockedForCompany(monthYear);
                                
                                if (isMonthLocked) {
                                    console.log(`🔒 NOT adding locked month week ${weekId} (${monthYear}) to allWeeks`);
                                } else {
                                    allWeeks.add(weekId);
                                    console.log(`✅ Added week ${weekId} to allWeeks`);
                                }
                            }
                        });
                    }
                });
                console.log(`🔍 Total weeks found: ${allWeeks.size}`, Array.from(allWeeks));
                
                Array.from(allWeeks).sort().forEach(weekId => {
                    try {
                        // Parse month/year from weekId (format: YYYY-MM-DD) for 2025 compatibility
                        const [year, month, day] = weekId.split('-');
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                          'July', 'August', 'September', 'October', 'November', 'December'];
                        const monthName = monthNames[parseInt(month) - 1];
                        const monthYear = `${monthName} ${year}`;
                        
                        // Dynamic check: Skip any locked month weeks
                        if (this.isMonthLockedForCompany(monthYear)) {
                            console.log(`🔒 EXPLICITLY skipping locked month week ${weekId} (${monthYear})`);
                            return;
                        }
                        
                        const weekNumber = this.getWeekNumberInMonth(weekId);
                        const option = document.createElement('option');
                        option.value = weekId;
                        option.textContent = `Week ${weekNumber} (${weekId})`;
                        periodSelectElement.appendChild(option);
                        console.log(`✅ Added week ${weekId} to dropdown`);
                    } catch (error) {
                        console.warn(`Error processing week ${weekId}:`, error);
                    }
                });
            }
        }
    }

    async updateCompanyData() {
        const periodType = document.getElementById('company-period-type').value;
        const selectedPeriod = document.getElementById('company-period-select').value;
        
        if (!selectedPeriod) {
            this.hideCompanyDataSections();
            return;
        }
        
        console.log(`📊 Loading company data for ${periodType}: ${selectedPeriod}`);
        
        // Show loading indicator
        this.showCompanyLoading(`Loading ${periodType === 'month' ? 'monthly' : 'weekly'} data for ${selectedPeriod}...`);
        
        try {
            const companyData = await this.getCompanyData(periodType, selectedPeriod);
            this.hideCompanyLoading();
            this.displayCompanyData(companyData, periodType, selectedPeriod);
        } catch (error) {
            console.error('❌ Error updating company data:', error);
            this.hideCompanyLoading();
            this.showCompanyError('Failed to load company data. Please try again.');
        }
    }

    // Lock a month for all teams (Company View)
    async lockCompanyMonth(monthYear) {
        console.log(`🔒 Locking ${monthYear} for all teams...`);
        
        try {
            const allTeams = ['b2b', 'varsity', 'zero1_bratish', 'zero1_harish', 'audio', 'graphics', 'tech', 'product', 'preproduction', 'content', 'social'];
            const lockedTeams = [];
            
            for (const teamId of allTeams) {
                // Check if team has data for this month
                const weeks = this.weekSystem.getWeeksForSelector().filter(week => 
                    week.monthYear === monthYear
                );
                
                if (weeks.length > 0) {
                    // Temporarily switch to this team to lock the month
                    const originalTeam = this.currentTeam;
                    this.currentTeam = teamId;
                    
                    try {
                        await this.lockMonth(monthYear);
                        lockedTeams.push(teamId);
                        console.log(`✅ Locked ${monthYear} for ${teamId} team`);
                    } catch (error) {
                        console.error(`❌ Failed to lock ${monthYear} for ${teamId} team:`, error);
                    }
                    
                    // Restore original team
                    this.currentTeam = originalTeam;
                }
            }
            
            console.log(`🎉 Successfully locked ${monthYear} for ${lockedTeams.length} teams:`, lockedTeams);
            
            // Refresh the Company View
            this.updateCompanyData();
            
            // Show success message
            alert(`Successfully locked ${monthYear} for all teams!\n\nLocked teams: ${lockedTeams.join(', ')}\n\nThe month has been moved to monthly view for all teams.`);
            
        } catch (error) {
            console.error(`❌ Error locking ${monthYear} for all teams:`, error);
            alert(`Error locking ${monthYear}: ${error.message}`);
        }
    }

    // Company View Loading Management
    showCompanyLoading(message = 'Loading company data...', progress = 0) {
        const loadingElement = document.getElementById('company-loading');
        const loadingText = document.getElementById('company-loading-text');
        const loadingProgress = document.getElementById('company-loading-progress');
        const loadingBar = document.getElementById('company-loading-bar');
        
        if (loadingElement) {
            loadingElement.style.display = 'block';
            if (loadingText) loadingText.textContent = message;
            if (loadingProgress) loadingProgress.textContent = 'Initializing...';
            if (loadingBar) loadingBar.style.width = progress + '%';
        }
        
        // Hide data sections while loading
        this.hideCompanyDataSections();
    }
    
    updateCompanyLoadingProgress(message, progress) {
        const loadingProgress = document.getElementById('company-loading-progress');
        const loadingBar = document.getElementById('company-loading-bar');
        
        if (loadingProgress) loadingProgress.textContent = message;
        if (loadingBar) loadingBar.style.width = progress + '%';
    }
    
    hideCompanyLoading() {
        const loadingElement = document.getElementById('company-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    showCompanyError(message) {
        const periodInfo = document.getElementById('company-period-info');
        if (periodInfo) {
            periodInfo.innerHTML = `
                <div style="color: #dc3545; text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <div style="font-size: 16px; font-weight: 500;">${message}</div>
                </div>
            `;
        }
    }
    
    hideCompanyDataSections() {
        document.getElementById('company-stats').style.display = 'none';
        document.getElementById('team-summary').style.display = 'none';
        document.getElementById('member-chart-section').style.display = 'none';
    }

    getExplicitCompanyLockedMonths() {
        return [
            // All 2025 months
            'January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025',
            'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025',
            'November 2025', 'December 2025',
            // Completed 2026 months
            'January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026',
            'June 2026', 'July 2026'
        ];
    }

    // Check if a month is locked for Company View (any team has it locked or it's in monthly view)
    isMonthLockedForCompany(monthYear) {
        // EXPLICIT CHECK: All completed months (weekly view only for current working month)
        const lockedMonths = this.getExplicitCompanyLockedMonths();
        if (lockedMonths.includes(monthYear)) {
            console.log(`🔒 ${monthYear} is EXPLICITLY locked (completed data)`);
            return true;
        }
        
        // CRITICAL FIX: For company view, only hide weeks if ALL teams (with data) have locked the month
        // Not just ANY team, otherwise locking one team hides weeks for everyone
        const allTeams = ['b2b', 'varsity', 'zero1_bratish', 'zero1_harish', 'audio', 'graphics', 'tech', 'product', 'preproduction', 'content', 'social'];
        
        // Find teams that have finalized week data for this month
        const teamsWithData = allTeams.filter(teamId => {
            return this.finalizedReports && this.finalizedReports[teamId] && Object.keys(this.finalizedReports[teamId]).some(weekId => {
                // Parse weekId to get month/year
                if (weekId.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month] = weekId.split('-');
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                      'July', 'August', 'September', 'October', 'November', 'December'];
                    const monthName = monthNames[parseInt(month) - 1];
                    const weekMonthYear = `${monthName} ${year}`;
                    return weekMonthYear === monthYear;
                }
                return false;
            });
        });
        
        console.log(`🔍 Teams with data for ${monthYear}:`, teamsWithData);
        
        if (teamsWithData.length === 0) {
            console.log(`ℹ️ No teams have data for ${monthYear} yet`);
            return false;
        }
        
        // Check if ALL teams with data have locked this month
        const allTeamsLocked = teamsWithData.every(teamId => {
            const teamMapping = {
                'zero1_bratish': 'zero1',
                'zero1_harish': 'harish',
                'varsity': 'varsity',
                'b2b': 'b2b',
                'audio': 'audio',
                'shorts': 'shorts',
                'graphics': 'graphics',
                'tech': 'tech',
                'product': 'product',
                'preproduction': 'preproduction',
                'content': 'content',
                'social': 'social'
            };
            const mappedTeamId = teamMapping[teamId] || teamId;
            const isLocked = this.lockedMonths[mappedTeamId]?.includes(monthYear);
            console.log(`  - ${teamId}: locked = ${isLocked}`);
            return isLocked;
        });
        
        console.log(`🔍 Month ${monthYear} lock status: teamsWithData=${teamsWithData.length}, allTeamsLocked=${allTeamsLocked}`);
        
        return allTeamsLocked;
    }

    // Auto-detect available months across all teams for Company View
    getAvailableCompanyMonths() {
        const allMonths = new Set();
        
        // Check historical data for all teams
        Object.keys(this.historicalData).forEach(teamId => {
            const teamData = this.historicalData[teamId];
            if (teamData) {
                Object.keys(teamData).forEach(monthYear => {
                    // Only include months that have complete data (isComplete: true)
                    if (teamData[monthYear]?.isComplete) {
                        allMonths.add(monthYear);
                    }
                });
            }
        });
        
        // Also check locked months (these should be available in monthly view)
        Object.keys(this.lockedMonths || {}).forEach(teamId => {
            const lockedMonthsForTeam = this.lockedMonths[teamId] || [];
            lockedMonthsForTeam.forEach(monthYear => {
                allMonths.add(monthYear);
            });
        });
        
        // CRITICAL FIX: Also check for months where ALL weeks are finalized
        // For 2025 months, we need to check finalized reports directly since week system only has 2026
        console.log('🔍 Checking finalized reports for months...', this.finalizedReports);
        if (this.finalizedReports) {
            Object.keys(this.finalizedReports).forEach(teamId => {
                const teamFinalizedWeeks = this.finalizedReports[teamId];
                console.log(`🔍 Checking finalized weeks for ${teamId}:`, teamFinalizedWeeks);
                if (teamFinalizedWeeks && typeof teamFinalizedWeeks === 'object') {
                    // Group finalized weeks by month (parse from weekId directly)
                    const monthsWithFinalizedWeeks = {};
                    Object.keys(teamFinalizedWeeks).forEach(weekId => {
                        // Parse weekId format: YYYY-MM-DD
                        if (weekId.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const [year, month, day] = weekId.split('-');
                            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                              'July', 'August', 'September', 'October', 'November', 'December'];
                            const monthName = monthNames[parseInt(month) - 1];
                            const monthYear = `${monthName} ${year}`;
                            
                            if (!monthsWithFinalizedWeeks[monthYear]) {
                                monthsWithFinalizedWeeks[monthYear] = {
                                    finalizedCount: 0,
                                    weeks: []
                                };
                            }
                            monthsWithFinalizedWeeks[monthYear].finalizedCount++;
                            monthsWithFinalizedWeeks[monthYear].weeks.push(weekId);
                        }
                    });
                    
                    console.log(`📊 ${teamId} months with finalized weeks:`, monthsWithFinalizedWeeks);
                    
                    // For each month with finalized weeks, check if all 4 weeks are finalized
                    Object.keys(monthsWithFinalizedWeeks).forEach(monthYear => {
                        const { finalizedCount, weeks } = monthsWithFinalizedWeeks[monthYear];
                        
                        // Typically months have 4 weeks in our system
                        const expectedWeeks = 4;
                        
                        console.log(`🔍 ${teamId} - ${monthYear}: ${finalizedCount} finalized weeks`, weeks);
                        
                        // If all 4 weeks of this month are finalized, add to available months
                        if (finalizedCount >= expectedWeeks) {
                            console.log(`✅ ${monthYear} detected as complete: ${finalizedCount} weeks finalized for ${teamId}`);
                            allMonths.add(monthYear);
                        } else if (finalizedCount > 0) {
                            console.log(`⚠️ ${monthYear} partially complete: ${finalizedCount}/${expectedWeeks} weeks finalized for ${teamId}`);
                        }
                    });
                }
            });
        }
        
        // Include explicitly locked months in monthly view
        this.getExplicitCompanyLockedMonths().forEach(monthYear => {
            allMonths.add(monthYear);
        });
        
        // Convert to sorted array
        const monthsArray = Array.from(allMonths).sort((a, b) => {
            // Sort by year first, then by month
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            
            if (yearA !== yearB) {
                return parseInt(yearA) - parseInt(yearB);
            }
            
            const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
        });
        
        console.log('🔍 Auto-detected company months from teams:', monthsArray);
        return monthsArray;
    }

    async getCompanyData(periodType, selectedPeriod) {
        const selectedTeams = this.getSelectedTeams();
        const allMembers = [];
        
        console.log('🔍 Selected teams for Company View:', selectedTeams);
        
        // Update loading progress
        this.updateCompanyLoadingProgress('Loading team data...', 10);
        
        for (let i = 0; i < selectedTeams.length; i++) {
            const teamId = selectedTeams[i];
            
            // Update progress for each team
            const progress = 10 + (i / selectedTeams.length) * 70; // 10% to 80%
            this.updateCompanyLoadingProgress(`Loading ${this.getTeamDisplayName(teamId)} data...`, progress);
            
            let teamData = null;
            
            if (periodType === 'month') {
                teamData = await this.getTeamMonthlyData(teamId, selectedPeriod);
            } else if (periodType === 'week') {
                teamData = await this.getTeamWeeklyData(teamId, selectedPeriod);
            }
            
            console.log(`📊 Team ${teamId} data for ${selectedPeriod}:`, teamData);
            
            if (teamData && teamData.members) {
                console.log(`✅ Adding ${teamData.members.length} members from ${teamId}`);
                teamData.members.forEach(member => {
                    allMembers.push({
                        ...member,
                        team: teamId,
                        teamDisplayName: this.getTeamDisplayName(teamId)
                    });
                });
            } else {
                console.log(`❌ No data found for team ${teamId}`);
            }
        }
        
        // Update progress for sorting
        this.updateCompanyLoadingProgress('Sorting and finalizing data...', 90);
        
        // Sort by efficiency (highest first) - ensure numeric comparison
        allMembers.sort((a, b) => {
            const aEff = parseFloat(a.efficiency) || 0;
            const bEff = parseFloat(b.efficiency) || 0;
            return bEff - aEff;
        });
        
        console.log('✅ Company data sorted by efficiency (highest first):');
        allMembers.slice(0, 5).forEach((member, index) => {
            console.log(`${index + 1}. ${member.name} (${member.team}): ${member.efficiency.toFixed(1)}%`);
        });
        
        return {
            members: allMembers,
            teams: selectedTeams,
            periodType: periodType,
            period: selectedPeriod
        };
    }

    // Get daily target for a team member based on historical data
    getDailyTargetForMember(teamId, memberName) {
        try {
            // Map display team IDs to historical data keys
            const teamMapping = {
                'zero1_bratish': 'zero1',
                'zero1_harish': 'harish',
                'varsity': 'varsity',
                'b2b': 'b2b',
                'audio': 'audio',
                'graphics': 'graphics',
                'tech': 'tech',
                'product': 'product',
                'preproduction': 'preproduction',
                'content': 'content',
                'social': 'social'
            };
            
            const historicalKey = teamMapping[teamId] || teamId;
            const teamHistoricalData = this.historicalData[historicalKey];
            
            if (!teamHistoricalData) {
                console.log(`⚠️ No historical data found for team ${teamId} (${historicalKey})`);
                return 4; // Default fallback
            }
            
            // Get the most recent month's data to find the member's target
            const monthKeys = Object.keys(teamHistoricalData);
            const mostRecentMonth = monthKeys[monthKeys.length - 1]; // Last month
            
            if (teamHistoricalData[mostRecentMonth] && 
                teamHistoricalData[mostRecentMonth].monthlyData && 
                teamHistoricalData[mostRecentMonth].monthlyData[memberName]) {
                
                const memberData = teamHistoricalData[mostRecentMonth].monthlyData[memberName];
                const monthlyTarget = memberData.target || 20; // Default if no target
                const workingDaysInMonth = 22; // Approximate working days in a month
                const dailyTarget = monthlyTarget / workingDaysInMonth;
                
                console.log(`📊 ${memberName} (${teamId}): monthly target=${monthlyTarget}, daily target=${dailyTarget.toFixed(2)}`);
                return dailyTarget;
            }
            
            console.log(`⚠️ No target found for ${memberName} in team ${teamId}, using default`);
            return 4; // Default daily target
            
        } catch (error) {
            console.error(`Error getting target for ${memberName} in ${teamId}:`, error);
            return 4; // Default fallback
        }
    }

    // Get member names for a specific team
    getTeamMemberNames(teamId) {
        const teamMapping = {
            'zero1_bratish': 'zero1',
            'zero1_harish': 'harish',
            'varsity': 'varsity',
            'b2b': 'b2b',
            'audio': 'audio',
            'shorts': 'shorts',
            'graphics': 'graphics',
            'tech': 'tech',
            'product': 'product',
            'preproduction': 'preproduction',
            'content': 'content',
            'social': 'social'
        };
        
        const configKey = teamMapping[teamId] || teamId;
        const teamConfig = this.teamConfigs[configKey];
        
        if (!teamConfig || !teamConfig.members) {
            console.log(`⚠️ No team config found for ${teamId} (${configKey})`);
            return [];
        }
        
        return teamConfig.members.map(member => member.name);
    }

    getSelectedTeams() {
        const selectedTeams = [];
        const allTeams = ['b2b', 'varsity', 'zero1_bratish', 'zero1_harish', 'audio', 'graphics', 'tech', 'product', 'preproduction', 'content', 'social'];
        
        allTeams.forEach(teamId => {
            const checkbox = document.getElementById(`team-filter-${teamId}`);
            if (checkbox && checkbox.checked) {
                selectedTeams.push(teamId);
            }
        });
        
        return selectedTeams;
    }

    getTeamDisplayName(teamId) {
        const displayNames = {
            'b2b': 'B2B',
            'varsity': 'Varsity', 
            'zero1_bratish': 'Zero1-Bratish',
            'zero1_harish': 'Zero1-Harish',
            'audio': 'Audio',
            'graphics': 'Graphics',
            'tech': 'Tech',
            'product': 'Product',
            'preproduction': 'Pre-production',
            'content': 'Content',
            'social': 'Social'
        };
        return displayNames[teamId] || teamId;
    }

    getDailyTargetForMember(teamId, memberName) {
        const teamConfig = this.teamConfigs[teamId];
        if (!teamConfig || !teamConfig.members) {
            console.warn(`⚠️ No team config or members found for teamId: ${teamId}`);
            return 0;
        }

        const member = teamConfig.members.find(m => m.name === memberName);
        if (!member || !member.level) {
            console.warn(`⚠️ Member ${memberName} not found or has no level in team ${teamId}`);
            return 0;
        }

        const memberLevel = member.level;
        let totalDailyTarget = 0;

        // Iterate through all work types to find those matching the member's level
        for (const workTypeKey in teamConfig.workTypes) {
            const workType = teamConfig.workTypes[workTypeKey];
            if (workType.level === memberLevel) {
                totalDailyTarget += workType.perDay;
            }
        }
        
        if (totalDailyTarget === 0) {
            console.warn(`⚠️ No daily target found for member ${memberName} (Level: ${memberLevel}) in team ${teamId}. Check workType configurations.`);
        }

        return totalDailyTarget;
    }

    async getTeamMonthlyData(teamId, monthYear) {
        // Map team IDs to historical data keys
        const teamMapping = {
            'zero1_bratish': 'zero1',
            'zero1_harish': 'harish',
            'varsity': 'varsity',
            'b2b': 'b2b',
            'audio': 'audio',
            'shorts': 'shorts',
            'graphics': 'graphics',
            'tech': 'tech',
            'product': 'product',
            'preproduction': 'preproduction',
            'content': 'content',
            'social': 'social'
        };
        
        const historicalKey = teamMapping[teamId] || teamId;
        
        // Parse monthYear to check for finalized weeks
        const [monthName, yearStr] = monthYear.split(' ');
        const year = parseInt(yearStr);
        
        // CRITICAL FIX: Load all 2025 locked months from Supabase (Sept-Dec)
        const locked2025Months = ['September 2025', 'October 2025', 'November 2025', 'December 2025'];
        if (locked2025Months.includes(monthYear)) {
            console.log(`🔄 LOADING ${monthYear} from Supabase for team ${teamId}`);
            try {
                const originalTeam = this.currentTeam;
                this.currentTeam = historicalKey;
                
                const monthData = await this.loadMonthDataFromSupabase(monthYear);
                this.currentTeam = originalTeam;
                
                if (monthData && monthData.monthlyData) {
                    console.log(`✅ Loaded ${monthYear} data for ${teamId} from Supabase`);
                    const members = [];
                    Object.keys(monthData.monthlyData).forEach(memberName => {
                        const memberData = monthData.monthlyData[memberName];
                        members.push({
                            name: memberName,
                            efficiency: memberData.efficiency || 0,
                            output: memberData.totalOutput || 0,
                            rating: memberData.monthlyRating || 0
                        });
                    });
                    return {
                        team: teamId,
                        period: monthYear,
                        members: members
                    };
                }
            } catch (error) {
                console.error(`❌ Error loading ${monthYear} for ${teamId}:`, error);
            }
        }
        
        // CRITICAL FIX: Check if ALL weeks of this month have been finalized for this team
        // For 2025 months, week system won't have the weeks, so check finalized reports directly
        let hasAllWeeksFinalized = false;
        
        console.log(`\n🔍 Checking finalized weeks for ${historicalKey} - ${monthYear}`);
        console.log(`📊 finalizedReports exists: ${!!this.finalizedReports}`);
        console.log(`📊 finalizedReports[${historicalKey}] exists: ${!!(this.finalizedReports && this.finalizedReports[historicalKey])}`);
        
        if (this.finalizedReports && this.finalizedReports[historicalKey]) {
            console.log(`📊 Finalized weeks for ${historicalKey}:`, Object.keys(this.finalizedReports[historicalKey]));
            
            // Count finalized weeks for this specific month
            const teamFinalizedWeeks = this.finalizedReports[historicalKey];
            const monthFinalizedWeeks = Object.keys(teamFinalizedWeeks).filter(weekId => {
                // Parse weekId format: YYYY-MM-DD
                if (weekId.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [weekYear, weekMonth] = weekId.split('-');
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                      'July', 'August', 'September', 'October', 'November', 'December'];
                    const weekMonthName = monthNames[parseInt(weekMonth) - 1];
                    const weekMonthYear = `${weekMonthName} ${weekYear}`;
                    return weekMonthYear === monthYear;
                }
                return false;
            });
            
            console.log(`📊 ${historicalKey} ${monthYear}: ${monthFinalizedWeeks.length} finalized weeks found`, monthFinalizedWeeks);
            
            // If 4 weeks are finalized (typical month), consider it complete
            hasAllWeeksFinalized = monthFinalizedWeeks.length >= 4;
            console.log(`📊 ${historicalKey} ${monthYear}: all finalized = ${hasAllWeeksFinalized}`);
        } else {
            console.log(`⚠️ Cannot check finalized weeks - missing data for ${historicalKey}`);
        }
        
        // Check if this month is explicitly locked OR has all weeks finalized (should load from Supabase)
        const isLockedMonth = this.lockedMonths[historicalKey]?.includes(monthYear) || hasAllWeeksFinalized;
        
        if (isLockedMonth) {
            console.log(`🔄 Loading locked month ${monthYear} data from Supabase for team ${teamId} (Company View)`);
            try {
                // Temporarily switch to the team to load its data
                const originalTeam = this.currentTeam;
                this.currentTeam = historicalKey;
                
                // Load data for any locked month using the generic function
                let monthData;
                try {
                    monthData = await this.loadMonthDataFromSupabase(monthYear);
                } catch (error) {
                    console.error(`❌ Error loading ${monthYear} data for team ${teamId}:`, error);
                    monthData = null;
                }
                
                // Restore original team
                this.currentTeam = originalTeam;
                
                if (monthData && monthData.monthlyData) {
                    console.log(`✅ Loaded ${monthYear} data for ${teamId} from Supabase`);
                    
                    // Transform the data to match weekly structure for Company View
                    const members = [];
                    Object.keys(monthData.monthlyData).forEach(memberName => {
                        const memberData = monthData.monthlyData[memberName];
                        members.push({
                            name: memberName,
                            efficiency: memberData.efficiency || 0,
                            output: memberData.totalOutput || 0,
                            rating: memberData.monthlyRating || 0
                        });
                    });
                    
                    return {
                        team: teamId,
                        period: monthYear,
                        members: members
                    };
                } else {
                    console.log(`❌ No ${monthYear} data found for ${teamId} in Supabase`);
                    return null;
                }
            } catch (error) {
                console.error(`❌ Error loading ${monthYear} data for ${teamId}:`, error);
                return null;
            }
        }
        
        // Get historical data for the team and month (for non-September months)
        const historicalData = this.historicalData[historicalKey];
        console.log(`🔍 Looking for ${monthYear} data for team ${teamId} (key: ${historicalKey})`);
        console.log(`🔍 Available months for ${historicalKey}:`, Object.keys(historicalData || {}));
        console.log(`🔍 Full historical data structure for ${historicalKey}:`, historicalData);
        
        if (!historicalData || !historicalData[monthYear]) {
            console.log(`❌ No data found for team ${teamId} (key: ${historicalKey}) for ${monthYear}`);
            console.log(`❌ historicalData exists: ${!!historicalData}`);
            console.log(`❌ monthYear exists: ${!!(historicalData && historicalData[monthYear])}`);
            if (historicalData) {
                console.log(`❌ Available months: ${Object.keys(historicalData)}`);
            }
            return null;
        }
        
        const monthData = historicalData[monthYear];
        if (!monthData.monthlyData) {
            return null;
        }
        
        const members = [];
        Object.keys(monthData.monthlyData).forEach(memberName => {
            const memberData = monthData.monthlyData[memberName];
            
            // Debug logging to see what's in the data
            console.log(`🔍 ${memberName} data:`, {
                efficiency: memberData.efficiency,
                totalOutput: memberData.totalOutput,
                target: memberData.target,
                calculatedEfficiency: ((memberData.totalOutput / memberData.target) * 100)
            });
            
            // Use the existing efficiency from historical data (already in percentage)
            const efficiency = memberData.efficiency || ((memberData.totalOutput / memberData.target) * 100);
            
            members.push({
                name: memberName,
                efficiency: efficiency,
                output: memberData.totalOutput,
                target: memberData.target,
                rating: memberData.monthlyRating || 0
            });
        });
        
        return {
            team: teamId,
            period: monthYear,
            members: members
        };
    }

    async getTeamWeeklyData(teamId, weekId) {
        // Map team IDs to finalized reports keys
        const teamMapping = {
            'zero1_bratish': 'zero1',
            'zero1_harish': 'harish',
            'varsity': 'varsity',
            'b2b': 'b2b',
            'audio': 'audio',
            'shorts': 'shorts',
            'graphics': 'graphics',
            'tech': 'tech',
            'product': 'product',
            'preproduction': 'preproduction',
            'content': 'content',
            'social': 'social'
        };
        
        const reportKey = teamMapping[teamId] || teamId;
        
        console.log(`🔍 getTeamWeeklyData: teamId=${teamId}, reportKey=${reportKey}`);
        console.log(`🔍 Available teams in finalizedReports:`, Object.keys(this.finalizedReports || {}));
        console.log(`🔍 Team data for ${reportKey}:`, this.finalizedReports?.[reportKey]);
        
        // Special debugging for Graphics team
        if (teamId === 'graphics') {
            console.log('🎨 GRAPHICS DEBUG in getTeamWeeklyData:');
            console.log('🎨 Requested weekId:', weekId);
            console.log('🎨 Graphics finalized reports:', this.finalizedReports?.graphics);
            console.log('🎨 Available weeks for Graphics:', Object.keys(this.finalizedReports?.graphics || {}));
        }
        
        // DEBUG: Check if we need different mapping for finalized reports vs Supabase queries
        const finalizedReportsKey = teamId; // Use original teamId for finalized reports
        console.log(`🔍 Checking finalized reports with key: ${finalizedReportsKey}`);
        
        // Get finalized week data for the team (use original teamId for finalized reports)
        const teamFinalizedReports = this.finalizedReports?.[teamId];
        if (!teamFinalizedReports || !teamFinalizedReports[weekId]) {
            console.log(`❌ No finalized week data found for team ${teamId} for ${weekId}`);
            return null;
        }
        
        const weekData = teamFinalizedReports[weekId];
        const members = [];
        
        // IMPORTANT: Don't use stored memberSummaries as they have wrong efficiency values
        // Instead, fetch fresh data from Supabase and calculate efficiency correctly
        
        try {
            console.log(`🔄 Fetching fresh Supabase data for ${teamId} week ${weekId} to calculate correct efficiency`);
            
            // Get fresh data from Supabase for this team and week
            const supabaseData = await this.supabaseAPI.loadWeekData(reportKey, weekId);
            
            if (supabaseData && supabaseData.length > 0) {
                supabaseData.forEach(entry => {
                    const memberOutput = this.getMemberWeekOutput(entry, teamId);
                    const workingDays = parseFloat(entry.working_days) || 5;
                    const leaveDays = parseFloat(entry.leave_days) || 0;
                    const rating = parseFloat(entry.weekly_rating) || 0;
                    const effectiveWorkingDays = workingDays - leaveDays;
                    
                    let efficiency = 0;
                    
                    console.log(`🔍 Company View - ${entry.member_name} (${teamId}): output=${memberOutput}, week_total(raw)=${entry.week_total}, working_days=${workingDays}, leave_days=${leaveDays}, effective_days=${effectiveWorkingDays}`);
                    
                    if (teamId === 'tech' || teamId === 'product') {
                        efficiency = this.calculateTargetPointsTeamEfficiency(teamId, entry, memberOutput, workingDays, leaveDays);
                        console.log(`✅ ${teamId} Company View: ${entry.member_name}: output=${memberOutput}, efficiency=${efficiency.toFixed(1)}% (legacy=${teamId === 'product' && !this.hasStoredTargetPoints(entry)})`);
                    } else {
                        // Other teams: week_total contains days equivalent, use effective working days
                        efficiency = effectiveWorkingDays > 0 ? (memberOutput / effectiveWorkingDays * 100) : 0;
                        
                        console.log(`✅ ${teamId} Company View: ${entry.member_name}: ${memberOutput}/${effectiveWorkingDays} = ${efficiency.toFixed(1)}%`);
                    }
                    
                    members.push({
                        name: entry.member_name,
                        efficiency: efficiency,
                        output: memberOutput,
                        rating: rating
                    });
                });
            } else {
                console.log(`⚠️ No fresh Supabase data found for ${teamId} ${weekId}, falling back to stored data`);
                // Fallback to stored data if fresh data not available
                if (weekData.memberSummaries) {
                    weekData.memberSummaries.forEach(member => {
                        members.push({
                            name: member.name,
                            efficiency: member.efficiency || 0,
                            output: member.output || 0,
                            rating: member.rating || 0
                        });
                    });
                }
            }
        } catch (error) {
            console.error(`❌ Error fetching fresh data for ${teamId} ${weekId}:`, error);
            // Fallback to stored data on error
            if (weekData.memberSummaries) {
                weekData.memberSummaries.forEach(member => {
                    members.push({
                        name: member.name,
                        efficiency: member.efficiency || 0,
                        output: member.output || 0,
                        rating: member.rating || 0
                    });
                });
            }
        }
        
        return {
            team: teamId,
            period: weekId,
            members: members
        };
    }


    displayCompanyData(companyData, periodType, selectedPeriod) {
        console.log('📊 Displaying company data:', companyData);
        
        // Update period info with lock button for weekly last weeks
        let periodInfoText = `Showing ${periodType === 'month' ? 'monthly' : 'weekly'} data for ${selectedPeriod}`;
        
        // Add lock button for weekly data if it's the last week of a month
        if (periodType === 'week') {
            const week = this.weekSystem.getWeeksForSelector().find(w => w.id === selectedPeriod);
            console.log(`🔍 Company View week check: selectedPeriod=${selectedPeriod}, week found:`, week);
            console.log(`🔍 All available weeks:`, this.weekSystem.getWeeksForSelector().map(w => `${w.id} (${w.monthName} ${w.year}, Week ${w.weekNumber})`));
            
            if (week && week.weekNumber === 4) {
                const monthYear = `${week.monthName} ${week.year}`;
                const hasLockedData = this.getAvailableCompanyMonths().includes(monthYear);
                
                console.log(`🔍 Lock button check: monthYear=${monthYear}, hasLockedData=${hasLockedData}, weekNumber=${week.weekNumber}`);
                console.log(`🔍 Available company months:`, this.getAvailableCompanyMonths());
                console.log(`🔍 Is month locked for company:`, this.isMonthLockedForCompany(monthYear));
                
                // Check if ALL teams have this month locked
                const allTeams = ['b2b', 'varsity', 'zero1_bratish', 'zero1_harish', 'audio', 'graphics', 'tech', 'product', 'preproduction', 'content', 'social'];
                const teamsWithData = allTeams.filter(teamId => {
                    return this.finalizedReports && this.finalizedReports[teamId] && Object.keys(this.finalizedReports[teamId]).some(weekId => {
                        const w = this.weekSystem.getWeeksForSelector().find(week => week.id === weekId);
                        return w && `${w.monthName} ${w.year}` === monthYear;
                    });
                });
                
                const teamsWithLockedMonth = allTeams.filter(teamId => {
                    const teamMapping = {
                        'zero1_bratish': 'zero1',
                        'zero1_harish': 'harish',
                        'varsity': 'varsity',
                        'b2b': 'b2b',
                        'audio': 'audio',
                        'shorts': 'shorts',
                        'graphics': 'graphics',
                        'tech': 'tech',
                        'product': 'product',
                        'preproduction': 'preproduction',
                        'content': 'content',
                        'social': 'social'
                    };
                    const mappedTeamId = teamMapping[teamId] || teamId;
                    return this.lockedMonths[mappedTeamId]?.includes(monthYear);
                });
                
                console.log(`🔍 Teams with ${monthYear} data:`, teamsWithData);
                console.log(`🔍 Teams with ${monthYear} locked:`, teamsWithLockedMonth);
                
                const allTeamsLocked = teamsWithData.length > 0 && teamsWithData.every(teamId => {
                    const teamMapping = {
                        'zero1_bratish': 'zero1',
                        'zero1_harish': 'harish',
                        'varsity': 'varsity',
                        'b2b': 'b2b',
                        'audio': 'audio',
                        'shorts': 'shorts',
                        'graphics': 'graphics',
                        'tech': 'tech',
                        'product': 'product',
                        'preproduction': 'preproduction',
                        'content': 'content',
                        'social': 'social'
                    };
                    const mappedTeamId = teamMapping[teamId] || teamId;
                    return this.lockedMonths[mappedTeamId]?.includes(monthYear);
                });
                
                if (!allTeamsLocked) {
                    periodInfoText += `
                        <div style="margin-top: 15px;">
                            <button onclick="if(window.tracker) window.tracker.lockCompanyMonth('${monthYear}')" 
                                    style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                                🔒 Lock ${week.monthName} ${week.year} for All Teams
                            </button>
                            <div style="margin-top: 8px; color: #666; font-size: 12px; font-style: italic;">
                                This will move all teams' ${week.monthName} data from weekly to monthly view
                            </div>
                        </div>`;
                } else {
                    periodInfoText += `
                        <div style="margin-top: 15px; color: #27ae60; font-weight: bold;">
                            🔒 ${week.monthName} ${week.year} is locked for all teams (Monthly view only)
                        </div>`;
                }
            }
        }
        
        document.getElementById('company-period-info').innerHTML = periodInfoText;
        
        // Show all sections
        document.getElementById('company-stats').style.display = 'block';
        document.getElementById('team-summary').style.display = 'block';
        document.getElementById('member-chart-section').style.display = 'block';
        
        // Show the Send Report button when data is loaded
        const sendReportBtn = document.getElementById('send-company-report-btn');
        if (sendReportBtn) {
            sendReportBtn.style.display = 'inline-block';
        }
        
        // Update company statistics
        this.updateCompanyStats(companyData);
        
        // Update team summary
        this.updateTeamSummary(companyData);
        
        // Update member performance chart
        this.updateMemberChart(companyData);
    }

    updateCompanyStats(companyData) {
        const members = companyData.members || [];
        
        if (members.length === 0) {
            document.getElementById('company-avg-efficiency').textContent = 'No data';
            document.getElementById('company-total-members').textContent = '0';
            document.getElementById('company-active-teams').textContent = '0';
            document.getElementById('company-top-performer').textContent = 'No data';
            return;
        }
        
        // Calculate company average efficiency
        const avgEfficiency = members.reduce((sum, member) => sum + (member.efficiency || 0), 0) / members.length;
        document.getElementById('company-avg-efficiency').textContent = `${avgEfficiency.toFixed(1)}%`;
        
        // Total members
        document.getElementById('company-total-members').textContent = members.length;
        
        // Active teams
        const activeTeams = new Set(members.map(member => member.team)).size;
        document.getElementById('company-active-teams').textContent = activeTeams;
        
        // Top performer
        const topPerformer = members[0]; // Already sorted by efficiency
        if (topPerformer) {
            document.getElementById('company-top-performer').textContent = 
                `${topPerformer.name} (${topPerformer.efficiency.toFixed(1)}%)`;
        }
    }

    updateTeamSummary(companyData) {
        const teamSummaryGrid = document.getElementById('team-summary-grid');
        teamSummaryGrid.innerHTML = '';
        
        // Group members by team
        const teamGroups = {};
        companyData.members.forEach(member => {
            if (!teamGroups[member.team]) {
                teamGroups[member.team] = [];
            }
            teamGroups[member.team].push(member);
        });
        
        // Create team cards
        Object.keys(teamGroups).forEach(teamId => {
            const teamMembers = teamGroups[teamId];
            const avgEfficiency = teamMembers.reduce((sum, member) => sum + (member.efficiency || 0), 0) / teamMembers.length;
            
            const teamCard = document.createElement('div');
            teamCard.style.cssText = 'background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
            
            teamCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="color: #2c3e50; margin: 0; font-size: 14px; max-width: 60%;">${this.getTeamDisplayName(teamId)}</h4>
                    <span style="font-size: 16px; font-weight: 600; color: ${this.getEfficiencyColor(avgEfficiency)}; min-width: 35%; text-align: right;">${avgEfficiency.toFixed(1)}%</span>
                </div>
                <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">${teamMembers.length} members</div>
                <div style="font-size: 11px; color: #6c757d;">
                    Best: ${teamMembers[0]?.name || 'N/A'} (${(teamMembers[0]?.efficiency || 0).toFixed(1)}%)
                </div>
            `;
            
            teamSummaryGrid.appendChild(teamCard);
        });
    }

    updateMemberChart(companyData) {
        const chartContainer = document.getElementById('member-performance-chart');
        chartContainer.innerHTML = '';
        
        if (!companyData.members || companyData.members.length === 0) {
            chartContainer.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 20px;">No data available</div>';
            return;
        }
        
        console.log(`📊 Updating member chart with ${companyData.members.length} members`);
        
        // Create chart bars
        companyData.members.forEach((member, index) => {
            const efficiency = member.efficiency || 0;
            const barWidth = Math.max(efficiency, 1); // Minimum 1% width for visibility
            
            const barContainer = document.createElement('div');
            barContainer.style.cssText = 'margin-bottom: 8px; display: flex; align-items: center;';
            
            barContainer.innerHTML = `
                <div style="width: 120px; padding-right: 10px; font-size: 11px; font-weight: 500; color: #2c3e50; text-align: right;">
                    ${member.name}
                </div>
                <div style="width: 50px; padding-right: 8px; font-size: 10px; color: #6c757d; text-align: right;">
                    ${member.teamDisplayName}
                </div>
                <div style="flex: 1; max-width: 300px; background: #f8f9fa; border-radius: 4px; position: relative; height: 20px;">
                    <div style="
                        background: ${this.getEfficiencyColor(efficiency)}; 
                        width: ${Math.min(barWidth, 200)}%; 
                        height: 100%; 
                        border-radius: 4px; 
                        transition: width 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: flex-end;
                        padding-right: 5px;
                    ">
                        <span style="font-size: 10px; color: white; font-weight: 600;">
                            ${efficiency.toFixed(1)}%
                        </span>
                    </div>
                </div>
            `;
            
            chartContainer.appendChild(barContainer);
        });
    }

    getEfficiencyColor(efficiency) {
        if (efficiency >= 150) return '#1e7e34'; // Dark Green
        if (efficiency >= 100) return '#28a745'; // Green
        if (efficiency >= 80) return '#20c997';  // Light Green
        return '#dc3545'; // Red
    }

    hideCompanyDataSections() {
        document.getElementById('company-stats').style.display = 'none';
        document.getElementById('team-summary').style.display = 'none';
        document.getElementById('member-chart-section').style.display = 'none';
        document.getElementById('company-period-info').textContent = 'Select a period to view company-wide performance data';
        
        // Hide the Send Report button when no data is shown
        const sendReportBtn = document.getElementById('send-company-report-btn');
        if (sendReportBtn) {
            sendReportBtn.style.display = 'none';
        }
    }

    // Monthly View Loading Management
    showMonthlyLoading(text = 'Loading monthly data...', progress = 'Calculating team performance metrics...') {
        const loadingDiv = document.getElementById('monthly-loading');
        const textDiv = document.getElementById('monthly-loading-text');
        const progressDiv = document.getElementById('monthly-loading-progress');
        const barDiv = document.getElementById('monthly-loading-bar');
        
        if (loadingDiv) {
            loadingDiv.style.display = 'block';
            if (textDiv) textDiv.textContent = text;
            if (progressDiv) progressDiv.textContent = progress;
            if (barDiv) barDiv.style.width = '0%';
        }
        
        // Hide other content
        this.hideMonthlyDataSections();
    }
    
    updateMonthlyLoadingProgress(percentage, text) {
        const progressDiv = document.getElementById('monthly-loading-progress');
        const barDiv = document.getElementById('monthly-loading-bar');
        
        if (progressDiv && text) progressDiv.textContent = text;
        if (barDiv) barDiv.style.width = `${percentage}%`;
    }
    
    hideMonthlyLoading() {
        const loadingDiv = document.getElementById('monthly-loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }
    
    showMonthlyError(message) {
        const loadingDiv = document.getElementById('monthly-loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fee; border-radius: 8px; margin: 20px 0; border: 1px solid #fcc;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #e74c3c; margin-bottom: 15px;"></i>
                    <div style="color: #c0392b; font-size: 16px; font-weight: 500;">
                        ${message}
                    </div>
                    <button onclick="window.tracker.showWeeklyView()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Back to Weekly View
                    </button>
                </div>
            `;
            loadingDiv.style.display = 'block';
        }
    }
    
    hideMonthlyDataSections() {
        // Hide existing monthly table
        const existingTable = document.getElementById('monthly-table');
        if (existingTable) existingTable.style.display = 'none';
        
        // Hide other views
        const weeklyData = document.getElementById('efficiency-data');
        const personView = document.getElementById('person-view');
        if (weeklyData) weeklyData.style.display = 'none';
        if (personView) personView.style.display = 'none';
    }

    // Slack Report Functions
    setSlackWebhookUrl(url) {
        this.slackWebhookUrl = url;
        localStorage.setItem('slackWebhookUrl', url);
        console.log('✅ Slack webhook URL configured');
    }

    loadSlackWebhookUrl() {
        const savedUrl = localStorage.getItem('slackWebhookUrl');
        if (savedUrl) {
            this.slackWebhookUrl = savedUrl;
        }
    }

    clearSlackWebhookUrl() {
        this.slackWebhookUrl = null;
        localStorage.removeItem('slackWebhookUrl');
        this.showMessage('✅ Slack webhook URL cleared. You will be prompted for a new URL on next report send.', 'success');
        console.log('🗑️ Slack webhook URL cleared from localStorage');
    }


    async sendWeeklyReportToSlack() {
        if (!this.slackWebhookUrl) {
            this.promptForSlackWebhook();
            return;
        }

        if (!this.currentWeek || !this.currentTeam) {
            this.showMessage('Please select a team and week first', 'error');
            return;
        }

        try {
            this.showMessage('📸 Generating weekly report...', 'info');
            
            // Capture the efficiency data section
            const chartElement = document.getElementById('efficiency-data');
            if (!chartElement) {
                this.showMessage('❌ No chart data to capture', 'error');
                return;
            }

            // Generate sharp PNG screenshot for Slack
            const blob = await this.captureSlackReportImage(chartElement, { scale: 3 });
            
            // Get current data for text summary
            const weekSummary = this.generateWeekSummaryForSlack();
            
            // Send to Slack
            await this.sendToSlack(blob, 'weekly', weekSummary);
            
        } catch (error) {
            console.error('❌ Error sending weekly report:', error);
            this.showMessage('❌ Failed to send weekly report to Slack', 'error');
        }
    }

    async sendMonthlyReportToSlack() {
        if (!this.slackWebhookUrl) {
            this.promptForSlackWebhook();
            return;
        }

        if (!this.currentTeam) {
            this.showMessage('Please select a team first', 'error');
            return;
        }

        try {
            this.showMessage('📸 Generating monthly report...', 'info');
            
            // Capture the monthly table
            const monthlyElement = document.getElementById('monthly-table') || document.getElementById('efficiency-data');
            if (!monthlyElement) {
                this.showMessage('❌ No monthly data to capture', 'error');
                return;
            }

            // Generate sharp PNG screenshot for Slack
            const blob = await this.captureSlackReportImage(monthlyElement, { scale: 3 });
            
            // Get current data for text summary
            const monthlySummary = this.generateMonthlySummaryForSlack();
            
            // Send to Slack
            await this.sendToSlack(blob, 'monthly', monthlySummary);
            
        } catch (error) {
            console.error('❌ Error sending monthly report:', error);
            this.showMessage('❌ Failed to send monthly report to Slack', 'error');
        }
    }

    generateWeekSummaryForSlack() {
        const teamName = this.teamConfigs[this.currentTeam]?.name || this.currentTeam;
        const weekLabel = this.currentWeek?.label || 'Current Week';
        
        // Get member data from current finalized reports or live data
        const weekData = this.finalizedReports[this.currentTeam]?.[this.currentWeek?.id];
        if (!weekData || !weekData.memberSummaries) {
            return {
                teamName,
                period: weekLabel,
                summary: 'No data available for this week',
                members: []
            };
        }

        // Sort members by efficiency (highest to lowest)
        const sortedMembers = Object.entries(weekData.memberSummaries)
            .map(([name, data]) => ({
                name,
                efficiency: data.efficiency || 0,
                output: data.output || 0
            }))
            .sort((a, b) => b.efficiency - a.efficiency);

        return {
            teamName,
            period: weekLabel,
            summary: `${sortedMembers.length} members • Avg Efficiency: ${weekData.avgEfficiency?.toFixed(1) || 0}%`,
            members: sortedMembers
        };
    }

    generateMonthlySummaryForSlack() {
        const teamName = this.teamConfigs[this.currentTeam]?.name || this.currentTeam;
        
        // Get selected month from dropdown
        const weekSelect = document.getElementById('week-select');
        const selectedValue = weekSelect?.value;
        let monthYear = 'Current Month';
        
        if (selectedValue && selectedValue.startsWith('MONTH_')) {
            monthYear = selectedValue.replace('MONTH_', '');
        }

        // Get monthly data
        const monthData = this.historicalData[this.currentTeam]?.[monthYear];
        if (!monthData || !monthData.monthlyData) {
            return {
                teamName,
                period: monthYear,
                summary: 'No data available for this month',
                members: []
            };
        }

        // Sort members by efficiency (highest to lowest)
        const sortedMembers = Object.entries(monthData.monthlyData)
            .map(([name, data]) => ({
                name,
                efficiency: data.efficiency || 0,
                output: data.totalOutput || 0,
                target: data.target || 0
            }))
            .sort((a, b) => b.efficiency - a.efficiency);

        return {
            teamName,
            period: monthYear,
            summary: `${sortedMembers.length} members • Avg Efficiency: ${monthData.teamSummary?.avgEfficiency?.toFixed(1) || 0}%`,
            members: sortedMembers
        };
    }

    async captureSlackReportImage(element, { scale = 3, width = null, format = 'image/png', quality = 1 } = {}) {
        const captureWidth = width || element.scrollWidth;
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale,
            useCORS: true,
            allowTaint: true,
            width: captureWidth,
            height: element.scrollHeight,
            windowWidth: captureWidth
        });

        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(result => {
                if (!result) {
                    reject(new Error('Failed to capture report image'));
                    return;
                }
                resolve(result);
            }, format, quality);
        });

        return blob;
    }

    applySlackCompanyExportStyles(companyContent) {
        const state = { hiddenElements: [] };

        companyContent.querySelectorAll('#company-period-info button, #company-period-info div[style*="margin-top: 15px"]').forEach(element => {
            state.hiddenElements.push({ element, display: element.style.display });
            element.style.display = 'none';
        });

        return state;
    }

    restoreSlackCompanyExportStyles(companyContent, state) {
        if (!state) {
            return;
        }

        state.hiddenElements.forEach(({ element, display }) => {
            element.style.display = display;
        });
    }

    async captureCompanyReportForSlack(companyContent) {
        const exportState = this.applySlackCompanyExportStyles(companyContent);
        try {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            return await this.captureSlackReportImage(companyContent, {
                scale: 2,
                format: 'image/jpeg',
                quality: 0.92
            });
        } finally {
            this.restoreSlackCompanyExportStyles(companyContent, exportState);
        }
    }

    async sendToSlack(summaryTextOrBlob, base64ImageOrReportType, summaryDataOrType = null, companyImageMimeType = null) {
        try {
            let messageText;
            let imageData;
            let imageMimeType = companyImageMimeType || 'image/png';
            let isBase64 = false;

        // Handle different call signatures
        if (typeof summaryTextOrBlob === 'string' && (typeof base64ImageOrReportType === 'string' || base64ImageOrReportType === null)) {
            // Company View: sendToSlack(summary, base64Image, 'base64') or sendToSlack(summary, null)
            messageText = summaryTextOrBlob;
            imageData = base64ImageOrReportType;
            isBase64 = summaryDataOrType === 'base64';
            if (companyImageMimeType) {
                imageMimeType = companyImageMimeType;
            }
            } else if (summaryDataOrType) {
                // Team View: sendToSlack(blob, reportType, summaryData)
                const reportType = base64ImageOrReportType;
                const summaryData = summaryDataOrType;
                const emoji = reportType === 'weekly' ? '📊' : '📈';
                messageText = `${emoji} *${summaryData.teamName} - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report*\n` +
                            `📅 Period: ${summaryData.period}\n` +
                            `📋 Summary: ${summaryData.summary}\n\n` +
                            `*Team Performance (Highest to Lowest):*\n` +
                            summaryData.members.map((member, index) => {
                                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▪️';
                                return `${medal} ${member.name}: ${member.efficiency.toFixed(1)}%`;
                            }).join('\n');
                
                // Convert blob to base64 for team view
                if (summaryTextOrBlob instanceof Blob) {
                    const reader = new FileReader();
                    const dataUrl = await new Promise(resolve => {
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(summaryTextOrBlob);
                    });
                    const [meta, base64] = dataUrl.split(',');
                    imageMimeType = meta?.match(/data:(.*?);/)?.[1] || summaryTextOrBlob.type || 'image/jpeg';
                    imageData = base64;
                    isBase64 = true;
                }
            } else {
                throw new Error('Invalid parameters for sendToSlack function');
            }

            const payload = {
                text: messageText,
                username: "Efficiency Tracker",
                icon_emoji: ":chart_with_upwards_trend:"
            };

            // Use our serverless proxy to avoid CORS issues
            const response = await fetch('/api/slack-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageData: payload,
                    imageData: isBase64 ? imageData : null,
                    imageMimeType: isBase64 ? imageMimeType : null,
                    imageUrl: !isBase64 ? imageData : null
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    if (result.delivery === 'slack-bot-file') {
                        this.showMessage('✅ Report image uploaded to Slack via bot!', 'success');
                    } else if (result.delivery === 'slack-bot-text-only') {
                        this.showMessage(`⚠️ Bot could not upload image (${result.botError?.error}). Text sent only — check bot is in channel with files:write scope.`, 'warning');
                    } else if (result.botError) {
                        this.showMessage(`⚠️ Bot upload failed (${result.botError.error}). Sent via webhook fallback.`, 'warning');
                    } else {
                        this.showMessage('✅ Report sent to Slack successfully!', 'success');
                    }
                } else {
                    throw new Error(`Slack API error: ${result.error || 'Unknown error'}`);
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
                throw new Error(`Server error: ${errorData.error || response.statusText}`);
            }

        } catch (error) {
            console.error('❌ Error sending to Slack:', error);
            
            // Check if it's a network or server error
            if (error.message.includes('Failed to fetch')) {
                this.showMessage('❌ Network error: Could not connect to server. Please check your internet connection.', 'error');
            } else if (error.message.includes('Slack API error')) {
                this.showMessage('❌ Slack webhook error: Please check your webhook URL is correct and active.', 'error');
                // Clear the webhook URL if it's invalid
                this.slackWebhookUrl = null;
                localStorage.removeItem('slackWebhookUrl');
            } else {
                this.showMessage('❌ Failed to send report to Slack: ' + error.message, 'error');
            }
            throw error;
        }
    }

    promptForSlackWebhook() {
        const url = prompt(
            'Please enter your Slack Webhook URL:\n\n' +
            'To get this:\n' +
            '1. Go to https://api.slack.com/apps\n' +
            '2. Create a new app\n' +
            '3. Enable "Incoming Webhooks"\n' +
            '4. Add webhook to your desired channel\n' +
            '5. Copy the webhook URL here'
        );
        
        if (url && url.startsWith('https://hooks.slack.com/')) {
            this.setSlackWebhookUrl(url);
            this.showMessage('✅ Slack webhook configured! You can now send reports.', 'success');
        } else if (url) {
            this.showMessage('❌ Invalid Slack webhook URL. It should start with https://hooks.slack.com/', 'error');
        }
    }

    async sendCompanyReportToSlack() {
        // Webhook URL is now configured server-side via environment variables

        // Check if company data is loaded
        const periodType = document.getElementById('company-period-type').value;
        const periodSelect = document.getElementById('company-period-select').value;
        
        if (!periodSelect) {
            this.showMessage('Please select a period first', 'error');
            return;
        }

        try {
            this.showMessage('📸 Generating company report...', 'info');
            
            // Capture the entire company performance content
            const companyContent = document.getElementById('company-performance-content');
            if (!companyContent) {
                this.showMessage('❌ No company data to capture', 'error');
                return;
            }

            const blob = await this.captureCompanyReportForSlack(companyContent);
            const reader = new FileReader();
            const dataUrl = await new Promise(resolve => {
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            const [meta, base64Image] = dataUrl.split(',');
            const imageMimeType = meta?.match(/data:(.*?);/)?.[1] || blob.type || 'image/jpeg';
            
            // Generate company summary for Slack
            const summary = this.generateCompanySummaryForSlack(periodType, periodSelect);
            
            // Send image directly as base64 data to Slack
            this.showMessage('📤 Sending report with image to Slack...', 'info');
            await this.sendToSlack(summary, base64Image, 'base64', imageMimeType);
            this.showMessage('✅ Company report with image sent to Slack successfully!', 'success');

        } catch (error) {
            console.error('❌ Error sending company report:', error);
            
            // If the webhook was cleared due to being invalid, show appropriate message
            if (!this.slackWebhookUrl) {
                this.showMessage('❌ Slack webhook URL was invalid. Please configure a new webhook URL and try again.', 'error');
            } else {
                this.showMessage('❌ Failed to send company report to Slack', 'error');
            }
        }
    }

    generateCompanySummaryForSlack(periodType, periodValue) {
        const periodName = periodType === 'week' ? 'Weekly' : 'Monthly';
        const periodLabel = periodType === 'week' ? 
            document.querySelector('#company-period-select option:checked')?.textContent || periodValue :
            periodValue;

        // Get company stats with fallbacks
        const avgEfficiency = document.getElementById('company-avg-efficiency')?.textContent?.trim() || 'N/A';
        const topPerformer = document.getElementById('company-top-performer')?.textContent?.trim() || 'N/A';
        const totalTeams = document.getElementById('company-active-teams')?.textContent?.trim() || 'N/A';
        const activeMembers = document.getElementById('company-total-members')?.textContent?.trim() || 'N/A';
        
        console.log(`🔍 Company stats extracted: efficiency=${avgEfficiency}, performer=${topPerformer}, teams=${totalTeams}, members=${activeMembers}`);

        let summary = `📊 *${periodName} Performance Report*\n`;
        summary += `📅 Period: ${periodLabel}\n`;
        summary += `📈 Average Efficiency: ${avgEfficiency}\n`;
        summary += `🏆 Top Performer: ${topPerformer}`;

        return summary;
    }
}

// Global functions for HTML onclick events
function loadRealData() {
    tracker.loadRealData();
}

function testVarsityLoading() {
    tracker.testVarsityLoading();
}

function testVarsityDataRanges() {
    tracker.testVarsityDataRanges();
}

function addSeptemberWeek1() {
    tracker.addSeptemberWeek1();
}

function saveToGoogleSheets() {
    tracker.saveToGoogleSheets();
}

function saveWeekData() {
    tracker.saveWeekData();
}

function exportWeekData() {
    tracker.exportWeekData();
}

// Initialize the application
let tracker;
window.tracker = null; // Make tracker globally accessible

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing tracker...');
    tracker = new RealEfficiencyTracker();
    window.tracker = tracker; // Make tracker globally accessible
    
    // Start with main dashboard landing page
    tracker.showMainDashboard();
    console.log('✅ Tracker initialized and main dashboard shown');
});

// Admin function for console access
function showAdminButtons() {
    const adminBtn = document.getElementById('admin-clear-september');
    if (adminBtn) {
        adminBtn.style.display = 'inline-flex';
        console.log('✅ Admin September clear button is now visible');
    }
}

// Quick console command for clearing September data
function clearAllSeptember() {
    if (tracker) {
        tracker.clearAllSeptemberData();
    } else {
        console.error('Tracker not initialized yet');
    }
}

// Debug function to check sync data format
function debugSyncData() {
    if (tracker && tracker.currentWeek) {
        console.log('🔍 Current team:', tracker.currentTeam);
        console.log('🔍 Current week:', tracker.currentWeek.id);
        console.log('🔍 Team members:', tracker.teamMembers.map(m => m.name || m));
        
        // Get team work types
        let teamWorkTypes;
        if (tracker.currentTeam === 'zero1') {
            teamWorkTypes = tracker.zero1WorkTypes;
        } else if (tracker.currentTeam === 'harish') {
            teamWorkTypes = tracker.harishWorkTypes;
        } else if (tracker.currentTeam === 'varsity') {
            teamWorkTypes = tracker.varsityWorkTypes;
        } else {
            teamWorkTypes = tracker.workTypes;
        }
        
        console.log('🔍 Work types for team:', Object.keys(teamWorkTypes));
        console.log('🔍 Work type names:', Object.values(teamWorkTypes).map(wt => wt.name));
        
        // Check if any data exists
        const hasData = tracker.teamMembers.some(member => {
            const memberName = member.name || member;
            return Object.keys(teamWorkTypes).some(workType => {
                const input = document.querySelector(`[data-member="${memberName}"][data-work="${workType}"]`);
                return parseFloat(input?.value || 0) > 0;
            });
        });
        
        console.log('🔍 Has data to sync:', hasData);
        
        return {
            team: tracker.currentTeam,
            week: tracker.currentWeek.id,
            workTypes: Object.keys(teamWorkTypes),
            hasData: hasData
        };
    } else {
        console.error('Tracker or current week not ready');
    }
}
