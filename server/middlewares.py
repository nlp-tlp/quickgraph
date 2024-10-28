# middlewares.py
from datetime import datetime

from fastapi import Request, Response

from dependencies import get_db

# class EventTrackingMiddleware:
#     async def __call__(self, request: Request, call_next):
#         async with get_db() as db:
#             events_collection = db["events"]

#             event_data = {
#                 "eventType": "API_CALL",
#                 "timestamp": datetime.now().isoformat(),
#                 "eventData": {
#                     "path": request.url.path,
#                     "method": request.method,
#                     "client": request.client.host,
#                 },
#             }
#             await events_collection.insert_one(event_data)

#         response: Response = await call_next(request)
#         return response
