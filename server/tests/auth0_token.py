import httpx

from settings import settings


def get_auth0_access_token():
    token_url = f"https://{settings.AUTH0_DOMAIN}/oauth/token"
    headers = {"content-type": "application/x-www-form-urlencoded"}

    payload = {
        "client_id": settings.AUTH0_CLIENT_ID,
        "client_secret": settings.AUTH0_CLIENT_SECRET,
        "audience": settings.AUTH0_AUDIENCE,
        "grant_type": "client_credentials",
    }

    response = httpx.post(token_url, headers=headers, data=payload)
    access_token = response.json().get("access_token")
    return access_token
