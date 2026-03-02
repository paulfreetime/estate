from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "postgresql+asyncpg://postgres:Tun12345@localhost:5432/estates"

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
