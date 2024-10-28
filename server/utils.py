"""utils.py"""

import jwt

from settings import settings
from models.user import User


class VerifyToken:
    """Does all the token verification using PyJWT

    See: https://auth0.com/blog/build-and-secure-fastapi-server-with-auth0/
    """

    def __init__(self, token):
        self.token = token

        # This gets the JWKS from a given URL and does processing so you can
        # use any of the keys available
        jwks_url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
        self.jwks_client = jwt.PyJWKClient(jwks_url)

    def verify(self):
        # This gets the 'kid' from the passed token
        try:
            self.signing_key = self.jwks_client.get_signing_key_from_jwt(self.token).key
        except jwt.exceptions.PyJWKClientError as error:
            return {"status": "error", "msg": error.__str__()}
        except jwt.exceptions.DecodeError as error:
            return {"status": "error", "msg": error.__str__()}

        try:
            payload = jwt.decode(
                self.token,
                self.signing_key,
                algorithms=settings.AUTH0_ALGORITHMS,
                audience=settings.AUTH0_API_AUDIENCE,
                issuer=settings.AUTH0_ISSUER,
            )
        except Exception as e:
            return {"status": "error", "message": str(e)}

        return payload


def mock_authenticate_user() -> User:
    return User(username=settings.EXAMPLE_USERNAME, sub="1337")
