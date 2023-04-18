from typing import List

from fastapi import Depends, FastAPI, Response, Request, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from database.classes import Point
from database.database import add_pte_point, get_pte_point, get_pte_points_json, update_pte_point, delete_pte_point, get_home, set_home
from datetime import datetime
from database.timeconversion import from_str_to_datetime, from_datetime_to_str


from api.utils import VerifyToken

import logging

# Scheme for the Authorization header
token_auth_scheme = HTTPBearer()

# Creates app instance
app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Logging
logging.basicConfig(filename='access.log', level=logging.INFO, format='%(asctime)s %(message)s', datefmt="%m/%d/%Y|%H:%M:%S")

# Startup
logging.info("Starting API")

categories = ["Bridges", "Drains", "Everything_else", "Larger_abandonments", "Mines_and_Tunnels", "Places_of_interest", "Possibly_active", "Small_abandonments", "Towers"]

colors = ["#558B2F", "#E65100", "#0288D1", "#673AB7", "#880E4F", "#A52714", "#FFD600", "#000000"]


class PointPost(BaseModel):
    name: str
    description: str
    color: str
    special: bool
    category: str
    lat: float
    lng: float


class PointPut(BaseModel):
    delete: bool
    name: str
    description: str
    color: str
    special: bool
    category: str
    lat: float
    lng: float

# class SetHome(BaseModel):
#     lat: float
#     lng: float

@app.get("/api/messages/public")
def public():
    """No access token required to access this route"""

    result = {
        "status": "success",
        "msg": ("Hello from a public endpoint! You don't need to be authenticated to see this.")
    }
    result = "Hello from a public endpoint! You don't need to be authenticated to see this."
    return Response(content=result, status_code=status.HTTP_200_OK, media_type="text/plain")


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/points")
async def get_points(response: Response, token: str = Depends(token_auth_scheme)):
    """A valid access token is required to access this route"""

    result = VerifyToken(token.credentials).verify()
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    return {"status": "success", "msg": "points retrieved", "points": get_pte_points_json()}


@app.get("/points/{point_id}")
async def get_point(response: Response, point_id: str, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials, scopes="read").verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    point = get_pte_point(point_id)

    if point is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "msg": "point not found"}

    point["creation"] = from_datetime_to_str(point["creation"])
    point["last_update"] = from_datetime_to_str(point["last_update"])

    return {"status": "success", "msg": "point retrieved", "point": get_pte_point(point_id)}


@app.post("/points")
async def post_point(response: Response, point: PointPost, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials, scopes="add").verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    new_point = Point(owner=result["sub"],
                      name=point.name,
                      description=point.description,
                      color=point.color,
                      special=point.special,
                      category=point.category,
                      lat=point.lat,
                      lng=point.lng)

    add_pte_point(new_point)

    return {"status": "success", "message": "Point added", "point": new_point}


@app.put("/points/{point_id}")
async def put_point(response: Response, point_id: str, point: PointPut, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials, scopes="edit").verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    old_point = get_pte_point(point_id)

    if old_point is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Point not found"}

    # if old_point.get_owner() != result.get("user_id"):
    #     response.status_code = status.HTTP_401_UNAUTHORIZED
    #     return {"status": "error", "message": "You are not the owner of this point"}

    if point.delete:
        # check roles
        result = VerifyToken(token.credentials, scopes="delete").verify()
        if result.get("status"):
            response.status_code = status.HTTP_400_BAD_REQUEST
            return result

        delete_pte_point(point_id)
        return {"status": "success", "message": "Point deleted"}

    new_point = Point(owner=old_point.get_owner(),
                      name=point.name if point.name != "" else old_point.get_name(),
                      description=point.description if point.description != "" else old_point.get_description(),
                      color=point.color if point.color != "" else old_point.get_color(),
                      special=point.special if point.special != "" else old_point.get_special(),
                      category=point.category if point.category != "" else old_point.get_category(),
                      lat=point.lat if point.lat != "" else old_point.get_lat(),
                      lng=point.lng if point.lng != "" else old_point.get_lng())

    new_point.set_id(old_point.get_id())
    new_point.set_edit_date(datetime.now())
    new_point.set_editor(result["sub"])

    update_pte_point(point_id, new_point)

    return {"status": "success", "message": "Point updated", "point": new_point}


@app.post("/set_home")
async def sethome(response: Response, home: dict, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials, scopes="edit").verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    user = result["sub"]

    # set home
    set_home(user, {"lat": home["lat"], "lng": home["lng"]})

    return {"status": "success", "message": "Home set"}

@app.get("/home")
async def retrieve_home(response: Response, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials, scopes="read").verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    user = result["sub"]

    # get home
    home = get_home(user)

    # if no home is found
    if home is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Home not found"}

    print(home[0])
    return {"status": "success", "message": "Home retrieved", "home": home[0]}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=5000)