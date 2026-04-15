from motor.motor_asyncio import AsyncIOMotorClient

class DBState:
    client: AsyncIOMotorClient = None
    db = None

db_state = DBState()

def get_database():
    """Returns the MongoDB database instance."""
    return db_state.db
