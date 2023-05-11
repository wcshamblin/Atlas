from typing import List

from fastapi import Depends, FastAPI, Response, Request, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from database.classes import Point, Map
from api.tower_functions import retrieve_fcc_tower_objects, retrieve_fcc_antenna_objects
from database.database import get_home, set_home, get_maps_by_user, get_maps_for_user, get_map_by_id, add_map, add_point_to_map, update_point_in_map, update_user_in_map
from datetime import datetime
from database.timeconversion import from_str_to_datetime, from_datetime_to_str
import re
from math import sqrt, sin, cos

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


class PointPost(BaseModel):
    name: str
    description: str
    color: str
    special: bool
    category: str
    lat: float
    lng: float


class MapPost(BaseModel):
    owner: str
    name: str
    description: str
    legend: str
    colors: List[str]
    categories: List[str]
    icons: List[str]
    points: List[PointPost]


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


@app.get("/api/messages/private-scoped")
async def private_scoped(response: Response, token: str = Depends(token_auth_scheme)):
    """A valid access token with 'read:messages' scope required to access this route"""

    result = VerifyToken(token.credentials, scopes="read").verify()
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    return {"status": "success", "msg": ("Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.")}

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/set_home")
async def sethome(response: Response, home: dict, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    print("Result from VerifyToken:", result)
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    user = result["sub"]

    # set home
    set_home(user, {"lat": home["lat"], "lng": home["lng"]})

    return {"status": "success", "message": "Home set"}

@app.get("/home")
async def retrieve_home(response: Response, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

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


@app.get("/maps/user")
async def get_my_maps(response: Response, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    maps = get_maps_by_user(result["sub"])


    return {"status": "success", "message": "Maps retrieved", "maps": maps}

@app.get("/maps/contributor")
async def get_contributor_maps(response: Response, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials, scopes="maps:contributor").verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    maps = get_maps_for_user(result["sub"])

    return {"status": "success", "message": "Maps retrieved", "maps": maps}


@app.get("/maps/{map_id}")
async def get_map(response: Response, map_id: str, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    map = get_map_by_id(map_id)

    if map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    return {"status": "success", "message": "Map retrieved", "map": map}

@app.post("/maps")
async def post_map(response: Response, map: dict, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    # self, owner, name, description, legend, points

    new_map = Map(owner=result["sub"],
                    name=map["name"],
                    description=map["description"],
                    legend=map["legend"],
                    points=map["points"])
    

    add_map(new_map)

    return {"status": "success", "message": "Map added", "map": new_map}

# @app.put("/maps/{map_id}")
# async def put_map_info(response: Response, map_id: str, map: dict, token: str = Depends(token_auth_scheme)):
#     result = VerifyToken(token.credentials).verify()

#     if result.get("status"):
#         response.status_code = status.HTTP_400_BAD_REQUEST
#         return result
    
#     # self, owner, name, description, legend, points

#     old_map = get_map_by_id(map_id)

#     if old_map is None:
#         response.status_code = status.HTTP_404_NOT_FOUND
#         return {"status": "error", "message": "Map not found"}

#     new_map = Map(owner=old_map.get_owner(),
#                     name=map["name"] if map["name"] != "" else old_map.get_name(),
#                     description=map["description"] if map["description"] != "" else old_map.get_description(),
#                     legend=map["legend"] if map["legend"] != "" else old_map.get_legend(),
#                     points=map["points"] if map["points"] != "" else old_map.get_points())
    
#     new_map.set_id(old_map.get_id())
#     new_map.set_edit_date(datetime.now())
#     new_map.set_editor(result["sub"])

#     update_map(map_id, new_map)

#     return {"status": "success", "message": "Map updated", "map": new_map}


@app.get("/maps/{map_id}/points")
async def get_map_points(response: Response, map_id: str, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    map = get_map_by_id(map_id)

    if map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    return {"status": "success", "message": "Map points retrieved", "points": map.get_points()}


# edit map point - covers edit and delete
@app.put("/maps/{map_id}/points/{point_id}")
async def put_map_point(response: Response, map_id: str, point_id: str, point: PointPut, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    # get map
    map = get_map_by_id(map_id)

    if map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}
    
    # get point
    old_point = get_map_point_by_id(map_id, point_id)

    if old_point is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Point not found"}
    
    # edit point

    # update point in map and push

    # return

@app.post("/maps/{map_id}/points")
async def post_map_point(response: Response, map_id: str, point: PointPost, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    # get map

    # add point
    # self, owner, name, description, color, icon, category, lat, lng

    # add point to map and push

    # return

@app.delete("/maps/{map_id}/points/{point_id}")
async def delete_map_point(response: Response, map_id: str, point_id: str, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    # get map
    
    # delete point

    # delete point from map and push

    # return





@app.get("/fcc/towers/nearby/{lat}/{lng}/{radius}")
async def get_towers_nearby(response: Response, lat: float, lng: float, radius: float, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    # find towers
    towers_polygons, towers_points = retrieve_fcc_tower_objects(lat, lng, radius) #feet

    return {"status": "success", "message": "Towers retrieved", "towers_polygons": towers_polygons, "towers_points": towers_points}


@app.get("/fcc/antennas/nearby/{lat}/{lng}/{radius}")
async def get_antennas_nearby(response: Response, lat: float, lng: float, radius: float, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    antennas = retrieve_fcc_antenna_objects(lat, lng, radius) #feet

    return {"status": "success", "message": "Antennas retrieved", "antennas": antennas}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=5000)