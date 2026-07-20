-- Add aggregation columns to the skills table
ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to recalculate the average rating and update the skills table
CREATE OR REPLACE FUNCTION public.update_skill_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the skills table with the new average and count
    UPDATE public.skills
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM public.reviews
            WHERE skill_id = COALESCE(NEW.skill_id, OLD.skill_id)
        ),
        review_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE skill_id = COALESCE(NEW.skill_id, OLD.skill_id)
        )
    WHERE id = COALESCE(NEW.skill_id, OLD.skill_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on insert, update, or delete in the reviews table
DROP TRIGGER IF EXISTS on_review_changed ON public.reviews;
CREATE TRIGGER on_review_changed
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE public.update_skill_rating();
