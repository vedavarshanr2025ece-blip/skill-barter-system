import asyncio
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

SKILLS_DATA = [
    # Education
    ("Python Programming", "Education"), ("JavaScript / React", "Education"),
    ("Data Science & ML", "Education"), ("Mathematics Tutoring", "Education"),
    ("Physics Tutoring", "Education"), ("English Writing & Grammar", "Education"),
    ("Public Speaking", "Education"), ("IELTS / TOEFL Coaching", "Education"),
    # Technology
    ("Web Development (Full-Stack)", "Technology"), ("Mobile App Development", "Technology"),
    ("UI/UX Design", "Technology"), ("Linux & DevOps", "Technology"),
    ("Cybersecurity Basics", "Technology"), ("3D Modelling (Blender)", "Technology"),
    # Creative Arts
    ("Graphic Design (Adobe/Figma)", "Creative Arts"), ("Photography", "Creative Arts"),
    ("Video Editing", "Creative Arts"), ("Music Production", "Creative Arts"),
    ("Guitar Lessons", "Creative Arts"), ("Singing / Vocal Coaching", "Creative Arts"),
    ("Drawing & Illustration", "Creative Arts"), ("Pottery / Ceramics", "Creative Arts"),
]

async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]

    sk_count = await db.skills.count_documents({})
    if sk_count > 0:
        print(f"✅ DB already seeded with {sk_count} skills. Skipping.")
        client.close()
        return

    docs = []
    for name, category in SKILLS_DATA:
        docs.append({"id": uuid4().hex, "name": name, "category": category})
        
    await db.skills.insert_many(docs)
    print(f"✅ Master seed complete: {len(docs)} skills inserted into MongoDB.")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
