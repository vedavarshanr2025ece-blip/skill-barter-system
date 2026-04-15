from uuid import uuid4
from datetime import datetime, timezone
import math
from typing import List, Optional

from app.core import security
from app.schemas.schemas import (
    UserCreate, UserSkillCreate, BarterRequestCreate, SessionCreate, ReviewCreate,
    RequestStatusEnum, SessionStatusEnum
)

async def create_user(db, user_in: UserCreate) -> dict:
    user_dict = user_in.model_dump()
    password = user_dict.pop("password")
    user_dict["password_hash"] = security.get_password_hash(password)
    user_dict["id"] = uuid4().hex
    user_dict["credit_balance"] = 3
    user_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.users.insert_one(user_dict.copy())
    return user_dict

async def get_user_by_email(db, email: str) -> Optional[dict]:
    return await db.users.find_one({"email": email})

async def get_user_by_username(db, username: str) -> Optional[dict]:
    return await db.users.find_one({"username": username})

async def get_user_by_id(db, user_id: str) -> Optional[dict]:
    return await db.users.find_one({"id": user_id})

async def get_user_skills(db, user_id: str) -> List[dict]:
    cursor = db.user_skills.aggregate([
        {"$match": {"user_id": user_id}},
        {
            "$lookup": {
                "from": "skills",
                "localField": "skill_id",
                "foreignField": "id",
                "as": "skill_details"
            }
        },
        {"$unwind": "$skill_details"}
    ])
    results = []
    async for doc in cursor:
        doc["skill_name"] = doc["skill_details"]["name"]
        doc["skill_category"] = doc["skill_details"]["category"]
        results.append(doc)
    return results

async def add_user_skill(db, user_id: str, skill_in: UserSkillCreate) -> dict:
    skill_dict = skill_in.model_dump()
    skill_dict["id"] = uuid4().hex
    skill_dict["user_id"] = user_id
    
    await db.user_skills.insert_one(skill_dict.copy())
    
    # lookup name/cat for response
    skill_meta = await db.skills.find_one({"id": skill_in.skill_id})
    skill_dict["skill_name"] = skill_meta["name"] if skill_meta else skill_in.skill_id
    skill_dict["skill_category"] = skill_meta["category"] if skill_meta else ""
    return skill_dict

async def delete_user_skill(db, user_id: str, skill_id: str) -> bool:
    res = await db.user_skills.delete_one({"id": skill_id, "user_id": user_id})
    return res.deleted_count > 0

async def search_skills(db, query: Optional[str] = None) -> List[dict]:
    q = {}
    if query:
        q["name"] = {"$regex": query, "$options": "i"}
    cursor = db.skills.find(q)
    return [doc async for doc in cursor]

def _haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

async def search_users_by_skill(db, skill_query: str, lat: Optional[float] = None, lng: Optional[float] = None, radius_km: float = 20.0) -> List[dict]:
    # 1. find skills matching query
    skills_cursor = db.skills.find({"name": {"$regex": skill_query, "$options": "i"}})
    skill_ids = [s["id"] async for s in skills_cursor]
    
    if not skill_ids: return []
    
    # 2. find user_skills OFFERED for these skills
    us_cursor = db.user_skills.find({"skill_id": {"$in": skill_ids}, "type": "OFFERED"})
    user_ids = list(set([us["user_id"] async for us in us_cursor]))
    
    # 3. fetch users
    users_cursor = db.users.find({"id": {"$in": user_ids}})
    filtered_users = []
    async for u in users_cursor:
        if lat is not None and lng is not None and u.get("latitude") and u.get("longitude"):
            dist = _haversine(lat, lng, u["latitude"], u["longitude"])
            if dist <= radius_km:
                filtered_users.append(u)
        else:
            filtered_users.append(u)
            
    return filtered_users

async def create_barter_request(db, sender_id: str, request_in: BarterRequestCreate) -> dict:
    req_dict = request_in.model_dump()
    req_dict["id"] = uuid4().hex
    req_dict["sender_id"] = sender_id
    req_dict["status"] = RequestStatusEnum.PENDING.value
    req_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.requests.insert_one(req_dict.copy())
    return req_dict

async def get_requests_for_user(db, user_id: str) -> List[dict]:
    cursor = db.requests.find({"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]})
    return [doc async for doc in cursor]

async def get_request_by_id(db, request_id: str) -> Optional[dict]:
    return await db.requests.find_one({"id": request_id})

async def update_request_status(db, request_id: str, status: RequestStatusEnum) -> Optional[dict]:
    await db.requests.update_one({"id": request_id}, {"$set": {"status": status.value}})
    return await get_request_by_id(db, request_id)

async def create_session(db, session_in: SessionCreate) -> dict:
    sess_dict = session_in.model_dump()
    sess_dict["id"] = uuid4().hex
    sess_dict["status"] = SessionStatusEnum.SCHEDULED.value
    
    # Attach session_id to the request
    await db.requests.update_one({"id": session_in.request_id}, {"$set": {"session_id": sess_dict["id"]}})
    await db.sessions.insert_one(sess_dict.copy())
    return sess_dict

async def get_session_by_id(db, session_id: str) -> Optional[dict]:
    return await db.sessions.find_one({"id": session_id})

async def complete_session(db, session_id: str, current_user_id: str) -> dict:
    # MVP: Assume when one person calls complete, it completes instantly and transfers credit.
    # In production, both parties must confirm.
    sess = await get_session_by_id(db, session_id)
    if not sess: return None

    req = await get_request_by_id(db, sess["request_id"])
    
    await db.sessions.update_one({"id": session_id}, {"$set": {"status": SessionStatusEnum.COMPLETED.value}})
    
    # Transfer 1 credit from receiver of skill (sender of request) to the provider
    user_from = req["sender_id"]
    user_to = req["receiver_id"]
    
    await db.users.update_one({"id": user_from}, {"$inc": {"credit_balance": -1}})
    await db.users.update_one({"id": user_to}, {"$inc": {"credit_balance": +1}})
    
    # Ledger record
    ledger_entry = {
        "id": uuid4().hex,
        "from_user": user_from,
        "to_user": user_to,
        "amount": 1,
        "session_id": session_id,
        "created_at": datetime.now(timezone.utc)
    }
    await db.ledger.insert_one(ledger_entry)
    
    sess["status"] = SessionStatusEnum.COMPLETED.value
    return sess

async def create_review(db, session_id: str, reviewer_id: str, review_in: ReviewCreate) -> dict:
    sess = await get_session_by_id(db, session_id)
    req = await get_request_by_id(db, sess["request_id"])
    
    reviewee_id = req["receiver_id"] if reviewer_id == req["sender_id"] else req["sender_id"]
    
    rev_dict = review_in.model_dump()
    rev_dict["id"] = uuid4().hex
    rev_dict["session_id"] = session_id
    rev_dict["reviewer_id"] = reviewer_id
    rev_dict["reviewee_id"] = reviewee_id
    
    await db.reviews.insert_one(rev_dict.copy())
    return rev_dict
