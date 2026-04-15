import math
from typing import List

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

def _distance_penalty(distance_km: float, max_km: float = 20.0) -> float:
    if distance_km >= max_km: return 0.0
    return 1.0 - (distance_km / max_km)

def _compute_match_score(
    requester: dict,
    candidate: dict,
    requester_skill_ids_needed: set,
    requester_skill_ids_offered: set,
    candidate_skill_ids_needed: set,
    candidate_skill_ids_offered: set,
) -> float:
    score = 0.0

    offered_by_candidate_and_needed_by_requester = candidate_skill_ids_offered & requester_skill_ids_needed
    offered_by_requester_and_needed_by_candidate = requester_skill_ids_offered & candidate_skill_ids_needed

    if offered_by_candidate_and_needed_by_requester and offered_by_requester_and_needed_by_candidate:
        score += 40.0
    elif offered_by_candidate_and_needed_by_requester:
        score += 25.0

    overlap_count = len(offered_by_candidate_and_needed_by_requester)
    if overlap_count > 1:
        score += min(overlap_count - 1, 3) * 3

    if (
        requester.get("latitude") and requester.get("longitude")
        and candidate.get("latitude") and candidate.get("longitude")
    ):
        dist_km = _haversine_km(
            requester["latitude"], requester["longitude"],
            candidate["latitude"], candidate["longitude"],
        )
        score += _distance_penalty(dist_km) * 20.0
    else:
        score += 10.0

    avg_rating = candidate.get("avg_rating")
    if avg_rating is not None:
        score += (avg_rating / 5.0) * 15.0
    else:
        score += 7.5

    return round(score, 2)

async def get_recommendations(
    db,
    current_user: dict,
    limit: int = 10,
    max_distance_km: float = 20.0,
) -> List[dict]:
    
    # 1. current user skills
    my_skills = []
    async for s in db.user_skills.find({"user_id": current_user["id"]}):
        my_skills.append(s)
        
    my_needed_ids = {s["skill_id"] for s in my_skills if s["type"] == "NEEDED"}
    my_offered_ids = {s["skill_id"] for s in my_skills if s["type"] == "OFFERED"}

    if not my_needed_ids: return []

    # 2. Get all other user skills efficiently
    other_skills = {}
    async for s in db.user_skills.find({"user_id": {"$ne": current_user["id"]}}):
        uid = s["user_id"]
        if uid not in other_skills:
            other_skills[uid] = {"OFFERED": set(), "NEEDED": set()}
        other_skills[uid][s["type"]].add(s["skill_id"])

    # 3. Score and Filter
    scored = []
    
    # Only fetch users who have overlapping skills to save resources
    candidate_user_ids = []
    for uid, u_skills in other_skills.items():
        if u_skills["OFFERED"] & my_needed_ids:
            candidate_user_ids.append(uid)

    if not candidate_user_ids: return []
    
    async for candidate in db.users.find({"id": {"$in": candidate_user_ids}}):
        cand_offered_ids = other_skills[candidate["id"]]["OFFERED"]
        cand_needed_ids = other_skills[candidate["id"]]["NEEDED"]

        distance_km = None
        if (
            current_user.get("latitude") and current_user.get("longitude")
            and candidate.get("latitude") and candidate.get("longitude")
        ):
            distance_km = _haversine_km(
                current_user["latitude"], current_user["longitude"],
                candidate["latitude"], candidate["longitude"],
            )
            if distance_km > max_distance_km:
                continue

        score = _compute_match_score(
            requester=current_user,
            candidate=candidate,
            requester_skill_ids_needed=my_needed_ids,
            requester_skill_ids_offered=my_offered_ids,
            candidate_skill_ids_needed=cand_needed_ids,
            candidate_skill_ids_offered=cand_offered_ids,
        )

        matched_skill_ids = list(cand_offered_ids & my_needed_ids)
        is_mutual_swap = bool(cand_offered_ids & my_needed_ids and my_offered_ids & cand_needed_ids)

        scored.append({
            "user_id": candidate["id"],
            "username": candidate["username"],
            "credit_balance": candidate["credit_balance"],
            "latitude": candidate.get("latitude"),
            "longitude": candidate.get("longitude"),
            "match_score": score,
            "distance_km": round(distance_km, 2) if distance_km is not None else None,
            "matched_skill_ids": matched_skill_ids,
            "is_mutual_swap": is_mutual_swap,
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:limit]
