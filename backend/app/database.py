from prisma import Prisma

db = Prisma()


async def connect_db() -> None:
    try:
        if not db.is_connected():
            await db.connect()
    except Exception as exc:
        print(f"[Database] Notice: Prisma database connection skipped or failed: {exc}")


async def disconnect_db() -> None:
    try:
        if db.is_connected():
            await db.disconnect()
    except Exception:
        pass

