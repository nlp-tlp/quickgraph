"""db_manager.py"""

import asyncio
import datetime
import os
import shutil
import subprocess
import tarfile

import motor.motor_asyncio
import typer

from server.src.quickgraph.dataset.services import create_system_datasets
from server.src.quickgraph.resources.services import create_system_resources
from server.src.quickgraph.settings import settings

app = typer.Typer()


# @app.command()
# async def backup_database(backup_path: str = "./backup"):
#     # """
#     # Backup a MongoDB database.

#     # Args:
#     #     backup_path: Path to save the backup file.
#     # """
#     # # Build the mongodump command
#     # command = [
#     #     "mongodump",
#     #     "--uri",
#     #     settings.MONGO_URI,
#     #     "--out",
#     #     backup_path,
#     #     "--db",
#     #     settings.MONGO_DB_NAME,
#     # ]

#     # # Execute the mongodump command
#     # subprocess.run(command)

#     # # Print confirmation message
#     # typer.echo(f"Backup of {settings.MONGO_DB_NAME} database complete.")

#     """Backup MongoDB to a compressed archive"""
#     client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
#     db = client[settings.MONGO_DB_NAME]
#     timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
#     backup_filename = f"mongodb_backup_{timestamp}.tar.gz"
#     backup_path = os.path.join(backup_path, backup_filename)

#     with tarfile.open(backup_path, "w:gz") as tar:
#         for collection_name in await db.list_collection_names():
#             collection = db[collection_name]
#             async for document in collection.find():
#                 tarinfo = tarfile.TarInfo(
#                     name=f"{collection_name}/{document['_id']}.json"
#                 )
#                 tarinfo.size = len(str(document).encode("utf-8"))
#                 tar.addfile(tarinfo, fileobj=str(document).encode("utf-8"))
#     print(f"MongoDB backup created at {backup_path}")


# @app.command()
# async def backup():
#     await backup_database()
#     print("MongoDB backup complete")


# @app.command()
# def restore_database(backup_path: str = "./backup"):
#     """
#     Restore a MongoDB database from a backup file.

#     Args:
#         backup_path: Path to the backup file.
#     """
#     # Build the mongorestore command
#     command = [
#         "mongorestore",
#         "--uri",
#         settings.MONGO_URI,
#         "--drop",
#         "--nsInclude",
#         f"{settings.MONGO_DB_NAME}.*",
#         backup_path,
#     ]

#     # Execute the mongorestore command
#     subprocess.run(command)

#     # Print confirmation message
#     typer.echo(f"Restore of {settings.MONGO_DB_NAME} database complete.")


async def add_system_resources_to_db():
    """Prepopulates MongoDB with "system" resources"""
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    await create_system_resources(db=db)
    typer.echo("Added resources to database")


async def add_system_datasets_to_db():
    """Prepopulates MongoDB with "system" datasets"""
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    await create_system_datasets(db=db)
    typer.echo("Added datasets to database")


async def drop_all_collections():
    """Drops all collections in the MongoDB database."""
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    for collection_name in await db.list_collection_names():
        await db[collection_name].drop()
    typer.echo(
        f"All collections in database {settings.MONGO_DB_NAME} dropped successfully!"
    )


@app.command()
def add_system_resources():
    asyncio.run(add_system_resources_to_db())


@app.command()
def add_system_datasets():
    asyncio.run(add_system_datasets_to_db())


@app.command()
def drop_database():
    asyncio.run(drop_all_collections())


@app.command()
def run(drop_db: bool = False, add_resources: bool = False, add_datasets: bool = False):
    if drop_db:
        print("Dropping database...")
        drop_database()
    if add_datasets:
        print("Adding datasets...")
        add_system_datasets()
    if add_resources:
        print("Adding resources...")
        add_system_resources()


if __name__ == "__main__":
    """python utils.py add-system-resources-to-db"""
    app()
