"""Dependencies."""

import http.client
import json
import logging
from typing import AsyncGenerator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from .database import get_client
from .settings import Settings, get_settings, settings
from .user.schemas import User
from .utils.auth import VerifyToken

logger = logging.getLogger(__name__)

# Scheme for the Authorization header
token_auth_scheme = HTTPBearer()


async def get_db(
    settings: Settings = Depends(get_settings),
) -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Yield a MongoDB database instance."""
    client = get_client()
    if client is None:
        logger.info("Failed to connect to MongoDB client.")
        raise ConnectionError("Failed to retrieve MongoDB client.")

    db = client[settings.mongodb.database_name]
    # logger.info(f"Connected to database: {db.name}")
    try:
        yield db
    finally:
        if db is not None:
            # logger.info(f"Releasing connection to database: {db.name}")
            pass


async def get_current_user(token: str = Depends(token_auth_scheme)) -> User:
    """Returns the authenticated user.

    Args:
        token (str): The authentication token.

    Raises:
        HTTPException: If the token is invalid or expired.

    Returns:
        User: The authenticated user.
    """

    # Define an exception to raise if the credentials are invalid
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Verify the token and get the user data
    token_data = VerifyToken(token).verify()

    # Check if the token is valid
    if token_data.get("status"):
        # Log the error and raise an exception
        print("Token expired")
        raise credentials_exception

    # Create a User object from the token data
    return User(**token_data)


async def get_user_management_access_token() -> Optional[str]:
    """Returns an access token for the Auth0 Management API.

    Returns:
        str: The access token, or None if an error occurred.
    """

    # Create an HTTPS connection to the Auth0 server
    conn = http.client.HTTPSConnection(settings.auth0.domain)

    # Define the data to be sent in the request body as a dictionary
    payload = {
        "client_id": settings.auth0.mgmt_client_id,
        "client_secret": settings.auth0.mgmt_secret,
        "audience": f"https://{settings.auth0.domain}/api/v2/",
        "grant_type": "client_credentials",
    }

    # Encode the payload as JSON and define the headers
    json_payload = json.dumps(payload)
    headers = {"content-type": "application/json"}

    # Send the POST request to the Auth0 server
    conn.request("POST", "/oauth/token", json_payload, headers)

    # Get the response from the server
    response = conn.getresponse()

    # Read the response data and decode it from bytes to a string
    response_data = response.read().decode("utf-8")

    # Check if the response was successful (status code 200)
    if response.status != 200:
        # Log the error and return None
        print(f"Error: {response_data}")
        return None

    # Parse the response data as a JSON object
    response_json = json.loads(response_data)

    # Extract the access token from the response
    access_token = response_json.get("access_token")

    return access_token


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    # TODO: add disable user

    return current_user


# async def get_x():
# TODO: Write a dependency that tests whether a user is on a project... this will enable them to perform project operations like markup, socials, etc.
