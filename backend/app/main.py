from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from app.api.v1.router import api_router
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    """MongoDB lifecycle connection."""
    from app.db.session import db_state
    
    print(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    db_state.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_state.db = db_state.client[settings.MONGODB_DB_NAME]
    
    # Create required indexes
    await db_state.db.users.create_index("email", unique=True)
    await db_state.db.users.create_index("username", unique=True)
    await db_state.db.users.create_index("id", unique=True)
    await db_state.db.skills.create_index("id", unique=True)
    await db_state.db.user_skills.create_index("id", unique=True)
    await db_state.db.requests.create_index("id", unique=True)
    await db_state.db.sessions.create_index("id", unique=True)
    await db_state.db.reviews.create_index("id", unique=True)
    print("Database indexes ensured!")
    
    yield
    
    print("Disconnecting MongoDB...")
    db_state.client.close()

app = FastAPI(
    title="SkillBarter API (MongoDB)",
    description="A hyperlocal platform for cashless skill and service exchange rebuilt on MongoDB.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (temporary)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "SkillBarter API", "database": "mongodb"}

@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}
