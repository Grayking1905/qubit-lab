import asyncio
import os
import sys
from app.config import settings
from prisma import Prisma

async def main():
    print("Database URL:", settings.database_url)
    print("os.environ DATABASE_URL:", os.environ.get("DATABASE_URL"))
    db = Prisma()
    try:
        await db.connect()
        print("Connected! is_connected:", db.is_connected())
        problems = await db.problem.find_many()
        print(f"Problems in DB: {len(problems)}")
        for p in problems:
            print(f"- {p.title} (difficulty: {p.difficulty}, topic: {p.topic})")
        await db.disconnect()
    except Exception as e:
        print("Error connecting or querying:", e, file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(main())
