from typing import List, Dict

from fastapi import Depends, FastAPI, Response, Request, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from database.classes import Point, Map
from api.tower_functions import retrieve_fcc_tower_objects, retrieve_fcc_antenna_objects
from database.database import get_home, set_home, get_maps_by_user, get_maps_for_user, get_map_by_id, add_map, add_point_to_map, update_point_in_map, update_map_info
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
    icon: str
    category: str
    lat: float
    lng: float


class MapPost(BaseModel):
    name: str
    description: str
    legend: str
    colors: Dict
    categories: List[str]
    icons: List[str]


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
    result = VerifyToken(token.credentials).verify()

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
async def post_map(response: Response, map: MapPost, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    print("Result from VerifyToken:", result)
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    # owner: str, name: str, description: str, legend: str, colors: list, categories: list, icons: list
    print(map)

    new_map = Map(owner=result["sub"],
                    name=map.name,
                    description=map.description,
                    legend=map.legend,
                    colors=map.colors,
                    categories=map.categories,
                    icons=map.icons)
    

    add_map(new_map.to_dict())

    return {"status": "success", "message": "Map created", "map": new_map}


@app.put("/maps/{map_id}/info")
async def put_map_info(response: Response, map_id: str, info: dict, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    current_map = get_map_by_id(map_id)


    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}
    
    # update map info
    update_map_info(map_id, info, result["sub"])

    return {"status": "success", "message": "Map updated"}

# edit map point - covers edit and delete
@app.put("/maps/{map_id}/points/{point_id}")
async def put_map_point(response: Response, map_id: str, point_id: str, point: PointPost, token: str = Depends(token_auth_scheme)):
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

# add new point to the map
@app.post("/maps/{map_id}/points")
async def post_map_point(response: Response, map_id: str, point: PointPost, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    # get map
    map = get_map_by_id(map_id)

    if map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # create Point object
    new_point = Point(owner=result["sub"],
                        name=point.name,
                        description=point.description,
                        color=point.color,
                        icon=point.icon,
                        category=point.category,
                        lat=point.lat,
                        lng=point.lng)

    # verify Point data makes sense for the map
    if new_point.get_category() not in map["categories"]:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"status": "error", "message": "Category not allowed for this map"}
    
    if new_point.get_color() not in map["colors"].values():
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"status": "error", "message": "Color not allowed for this map"}
    
    if new_point.get_icon() not in map["icons"]:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"status": "error", "message": "Icon not allowed for this map"}
  
    
    # add point to map in db
    add_point_to_map(map_id, new_point.to_dict())

    return {"status": "success", "message": "Point added to map", "point": new_point}

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