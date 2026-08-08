# ====================================================================
# Standalone PostgreSQL Backend Server Launcher for auth.py
# Database Target: postgresql://db_team:intern@100.112.49.39:5432/aepttas_xdr
# Port: 8002
# ====================================================================

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, select
from passlib.context import CryptContext
import uvicorn

# 1. Database Connection URL
DATABASE_URL = "postgresql+asyncpg://db_team:intern@100.112.49.39:5432/aepttas_xdr"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Table Definition for apt_users_b
class AptUserB(Base):
    __tablename__ = "apt_users_b"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="PARENT")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# 3. FastAPI App Setup
app = FastAPI(title="Aepttas Security Authentication API - PostgreSQL Sync")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db():
    print("[PostgreSQL] Connecting to database aepttas_xdr @ 100.112.49.39:5432...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[PostgreSQL] Table 'apt_users_b' verified! Auth Server listening on http://0.0.0.0:8002")

@app.post("/api/auth/register", status_code=201)
async def register(payload: dict):
    async with AsyncSessionLocal() as db:
        email = payload.get("email", "").lower().strip()
        name = payload.get("name", "").strip()
        password = payload.get("password", "")

        query = select(AptUserB).where(AptUserB.email == email)
        result = await db.execute(query)
        if result.scalar_one_or_none():
            return {"status": "error", "detail": "Email is already registered."}

        hashed = pwd_context.hash(password)
        new_user = AptUserB(
            username=email.split("@")[0],
            name=name,
            email=email,
            password_hash=hashed,
            role="PARENT"
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        print(f"[PostgreSQL SUCCESS] Stored user ID {new_user.id} ({email}) in apt_users_b table!")
        return {
            "status": "success",
            "message": "Account successfully inserted into PostgreSQL table apt_users_b!",
            "user_id": new_user.id
        }

@app.post("/api/auth/login", status_code=200)
async def login(payload: dict):
    async with AsyncSessionLocal() as db:
        email = payload.get("email", "").lower().strip()
        password = payload.get("password", "")

        query = select(AptUserB).where(AptUserB.email == email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user or not pwd_context.verify(password, user.password_hash):
            return {"status": "error", "detail": "Invalid email or password."}

        user.updated_at = func.now()
        await db.commit()

        print(f"[PostgreSQL SUCCESS] Updated login timestamp for user ID {user.id} ({email}) in apt_users_b!")
        return {
            "status": "success",
            "message": "Login successful. Recorded session in PostgreSQL apt_users_b!",
            "user_id": user.id,
            "parent_name": user.name or user.username,
            "token_type": "bearer",
            "access_token": f"token_for_user_{user.id}"
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
