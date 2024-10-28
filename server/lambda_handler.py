from mangum import Mangum
from main import app

# AWS Lambda handler
handler = Mangum(app, lifespan="off")
