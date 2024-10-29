"""Dependencies."""

import http.client
import json
from typing import Optional

import motor.motor_asyncio
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient

from .settings import settings
from .user.schemas import User
from .utils.auth import VerifyToken

# Scheme for the Authorization header
token_auth_scheme = HTTPBearer()


async def get_db() -> AsyncIOMotorClient:
    """Returns a database client.

    Raises:
        HTTPException: If there is an error connecting to the database.

    Yields:
        AsyncIOMotorClient: A database client.
    """

    # Create a database client
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)

    # Get the database from the client
    db = client[settings.MONGO_DB_NAME]

    try:
        # Yield the database client to the dependent function
        yield db
    except:
        # Log the error and raise an exception
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service unavailable",
        )
    finally:
        # Close the database client
        client.close()


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
    token_data = VerifyToken(token.credentials).verify()

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
    conn = http.client.HTTPSConnection(settings.AUTH0_DOMAIN)

    # Define the data to be sent in the request body as a dictionary
    payload = {
        "client_id": settings.AUTH0_MGMT_CLIENT_ID,
        "client_secret": settings.AUTH0_MGMT_SECRET,
        "audience": f"https://{settings.AUTH0_DOMAIN}/api/v2/",
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
