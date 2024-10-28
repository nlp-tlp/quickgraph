import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from ...main import app  # Import your FastAPI app instance
from auth0_token import get_auth0_access_token

access_token = get_auth0_access_token()


@pytest.mark.asyncio
async def test_protected_route():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Replace the URL and headers with your actual route and authentication
        response = await ac.get(
            "/protected", headers={"Authorization": f"Bearer {access_token}"}
        )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_unauthorized_route():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Replace the URL with your actual route
        response = await ac.get("/protected")
    assert response.status_code == 401
