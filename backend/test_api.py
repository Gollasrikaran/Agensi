import asyncio
from fastapi import Request
from main import upvote_skill
from auth import get_current_user

# Mocking the current_user
class MockUser:
    def __init__(self, uid):
        self.id = uid

async def run_test():
    skill_id = "89f33884-4008-410d-8cf6-fcbc3c8d451e"
    user = MockUser("162833bb-d965-4123-9bc2-77b4b22b55c1")
    
    # Run once
    res1 = upvote_skill(skill_id, current_user=user)
    print("First click:", res1)
    
    # Run twice
    res2 = upvote_skill(skill_id, current_user=user)
    print("Second click:", res2)

asyncio.run(run_test())
