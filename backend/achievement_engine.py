from auth import supabase

def check_and_award_achievements(user_id: str):
    """
    Checks user activity and awards any unlocked achievements.
    This should be called after major actions (upload, sale, upvote, bounty).
    """
    try:
        # Fetch user's current unlocked achievements to avoid re-awarding
        unlocked_res = supabase.table("user_achievements").select("achievement_id").eq("user_id", user_id).execute()
        unlocked_ids = {row["achievement_id"] for row in unlocked_res.data}

        # Determine which achievements we need to evaluate
        all_milestones = {
            'first_upload', 'first_sale', 'community_favorite', 
            'top_creator', 'on_fire', 'bounty_hunter', 
            'prolific_publisher', 'diamond_seller'
        }
        
        # If user has unlocked everything, no need to run queries
        if all_milestones.issubset(unlocked_ids):
            return

        # Fetch activity counts
        # (A real app might group these in SQL, but supabase python client makes it easier to just fetch or use a function)
        # For small scale, we can fetch the user's activity and count in python
        activity_res = supabase.table("user_activity").select("activity_type").eq("user_id", user_id).execute()
        
        counts = {
            'upload': 0,
            'sale': 0,
            'purchase': 0,
            'upvote': 0,
            'bounty': 0
        }
        for act in activity_res.data:
            atype = act.get("activity_type")
            if atype in counts:
                counts[atype] += 1
                
        # Fetch streak
        streak_res = supabase.table("user_streaks").select("current_streak").eq("user_id", user_id).execute()
        current_streak = streak_res.data[0]["current_streak"] if streak_res.data else 0

        # Evaluate logic
        new_unlocks = []
        
        def award(ach_id):
            if ach_id not in unlocked_ids:
                new_unlocks.append({"user_id": user_id, "achievement_id": ach_id})
                unlocked_ids.add(ach_id)
        
        if counts['upload'] >= 1:
            award('first_upload')
        if counts['upload'] >= 10:
            award('prolific_publisher')
            
        if counts['sale'] >= 1:
            award('first_sale')
        if counts['sale'] >= 50:
            award('top_creator')
        if counts['sale'] >= 100:
            award('diamond_seller')
            
        if counts['upvote'] >= 10:
            award('community_favorite')
            
        if counts['bounty'] >= 1:
            award('bounty_hunter')
            
        if current_streak >= 7:
            award('on_fire')
            
        # Insert new unlocks
        if new_unlocks:
            # Upsert is safer in case of concurrent requests
            supabase.table("user_achievements").upsert(new_unlocks, on_conflict="user_id,achievement_id").execute()
            print(f"[ACHIEVEMENT] Awarded {len(new_unlocks)} new achievements to user {user_id}")
            
    except Exception as e:
        print(f"[ERROR] Failed to check achievements for {user_id}: {e}")
