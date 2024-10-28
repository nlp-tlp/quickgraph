from pymongo import MongoClient
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import re


async def soft_delete_document(
    db: AsyncIOMotorDatabase, collection_name: str, doc_id: str, username: str
) -> bool:
    """
    Soft deletes a MongoDB document with the given ID in the specified database and collection.

    :param mongo_client: The MongoDB client instance.
    :param db_name: The name of the database containing the collection.
    :param collection_name: The name of the collection containing the document.
    :param doc_id: The ID of the document to soft delete.
    :param username: The username of the user requesting the soft delete operation.
    :return: True if the document was soft deleted successfully, False otherwise.
    """
    try:
        result = await db[collection_name].update_one(
            {"_id": ObjectId(doc_id), "created_by": username},
            {"$set": {"is_deleted": True}},
        )
        return result.modified_count == 1
    except:
        return False


def create_search_regex(search_terms: str) -> re.Pattern:
    """
    Create a regular expression pattern that matches all of the given search terms.

    Args:
        search_terms (str): A comma-separated string of search terms to match.

    Returns:
        re.Pattern: A compiled regular expression pattern that matches all of the search terms, or a
        regex pattern that matches anything if the input string is empty.

    Example:
        >>> create_search_regex("apple, banana, cherry")
        re.compile('(?=.*\\bapple\\b)(?=.*\\bbanana\\b)(?=.*\\bcherry\\b)', re.IGNORECASE)
    """

    if search_terms == None:
        # Defaults to match anything regular expression
        return re.compile(".*")

    search_terms_list = search_terms.split(",")
    search_term_regex_list = []
    for term in search_terms_list:
        search_term_regex_list.append(rf"(?=.*\b{re.escape(term.strip())}\b)")
    search_term_regex = "".join(search_term_regex_list)
    return (
        re.compile(search_term_regex, re.IGNORECASE)
        if search_terms
        else re.compile(".*")
    )
