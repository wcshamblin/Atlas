from typing import List, Dict
from uuid import uuid4

from fastapi import Depends, FastAPI, Response, Request, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from database.classes import MapPermissions, MapUser, Point, Map, Category, Color, Icon
from fcc_functions import retrieve_fcc_tower_objects, retrieve_fcc_antenna_objects
from database.database import delete_map_by_id, get_home, get_point_by_id, \
    get_points_geojson_for_map, set_home, get_maps_by_user, get_maps_for_user, get_map_by_id, \
    add_map, add_point_to_map, update_map_users, update_point_in_map, remove_point_from_map, get_eula_acceptance, \
    set_eula_acceptance, verify_user_permissions, update_map_name, update_map_description, update_map_legend, \
    update_map_categories, update_map_colors, update_map_icons
from datetime import datetime
from database.timeconversion import from_str_to_datetime, from_datetime_to_str
import re
from math import sqrt, sin, cos
from typing import Optional


from utils import VerifyToken

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


class PointPut(BaseModel):
    name: Optional[str]
    description: Optional[str]
    color: Optional[str]
    icon: Optional[str]
    category: Optional[str]
    lat: Optional[float]
    lng: Optional[float]


class MapPost(BaseModel):
    name: str
    description: str
    legend: str
    colors: List[Dict]
    categories: List[str]
    icons: List[Dict]


class PutMapName(BaseModel):
    name: str


class PutMapDescription(BaseModel):
    description: str


class PutMapLegend(BaseModel):
    legend: str


class PostMapColors(BaseModel):
    colors: List[Dict] # of color objects


class PutMapColors(BaseModel):
    colors: List[Dict] # of color objects


class DeleteMapColors(BaseModel):
    colors: List[str] # of color ids


class PostMapCategories(BaseModel):
    categories: List[str] # of category names


class PutMapCategories(BaseModel):
    categories: List[Dict] # of category objects


class DeleteMapCategories(BaseModel):
    categories: List[str] # of category ids


class PostMapIcons(BaseModel):
    icons: List[Dict] # of icon objects


class PutMapIcons(BaseModel):
    icons: List[Dict] # of icon objects


class DeleteMapIcons(BaseModel):
    icons: List[str] # of icon ids


class UserPut(BaseModel):
    usersub: str


class UserPermissions(BaseModel):
    edit: bool
    add: bool
    admin: bool


@app.get("/")
async def root():
    return {"message": "Atlas V2 API is running"}


@app.get("/eula")
async def eula(response: Response, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    # returns false if not accepted or older than a week
    return {"status": "success", "message": "EULA status", "accepted": get_eula_acceptance(result["sub"])}


@app.post("/eula")
async def eula(response: Response, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    set_eula_acceptance(usersub=result["sub"], acceptance=True)

    return {"status": "success", "message": "EULA accepted"}


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


@app.get("/maps")
async def get_maps(response: Response, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    maps = get_maps_for_user(result["sub"])

    return {"status": "success", "message": "Maps retrieved", "maps": maps}

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


# @app.get("/maps/{map_id}")
# async def get_map(response: Response, map_id: str, token: str = Depends(token_auth_scheme)):
#     result = VerifyToken(token.credentials).verify()

#     if result.get("status"):
#         response.status_code = status.HTTP_400_BAD_REQUEST
#         return result

#     map = get_map_by_id(map_id)

#     if map is None:
#         response.status_code = status.HTTP_404_NOT_FOUND
#         return {"status": "error", "message": "Map not found"}

#     return {"status": "success", "message": "Map retrieved", "map": map}

# create a new map
@app.post("/maps")
async def post_map(response: Response, map: MapPost, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    print("Result from VerifyToken:", result)
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    # owner: str, name: str, description: str, legend: str, colors: list, categories: list, icons: dict
    print(map)

    # make categories into category objects
    categories = []
    for category in map.categories:
        categories.append(Category(category).to_dict())
    
    # make colors into color objects
    colors = []
    for color in map.colors:
        colors.append(Color(name=color["name"], hex=color["color"]).to_dict())

    # make icons into icon objects
    icons = []
    for icon in map.icons:
        icons.append(Icon(name=icon["name"], url=icon["icon"]).to_dict())

    
    new_map = Map(owner=result["sub"],
                    name=map.name,
                    description=map.description,
                    legend=map.legend,
                    colors=colors,
                    categories=categories,
                    icons=icons)

    add_map(new_map.to_dict())

    return {"status": "success", "message": "Map created", "map": new_map}


# edit map name
@app.put("/maps/{map_id}/name")
async def put_map_name(response: Response, map_id: str, name: PutMapName, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    # update map name
    update_map_name(map_id, name.name, result["sub"])

    return {"status": "success", "message": "Map name updated"}

# edit map description
@app.put("/maps/{map_id}/description")
async def put_map_description(response: Response, map_id: str, description: PutMapDescription, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    # update map description
    update_map_description(map_id, description.description, result["sub"])

    return {"status": "success", "message": "Map description updated"}

# edit map legend
@app.put("/maps/{map_id}/legend")
async def put_map_legend(response: Response, map_id: str, legend: PutMapLegend, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    # update map legend
    update_map_legend(map_id, legend.legend, result["sub"])

    return {"status": "success", "message": "Map legend updated"}


# post a new map category
@app.post("/maps/{map_id}/categories")
async def post_map_categories(response: Response, map_id: str, categories: PostMapCategories, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for category in categories.categories:
        current_map["categories"].append(Category(category).to_dict())

    update_map_categories(map_id, current_map["categories"], result["sub"])

    return {"status": "success", "message": "Map category added"}


# edit map categories
@app.put("/maps/{map_id}/categories")
async def put_map_categories(response: Response, map_id: str, categories: PutMapCategories, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for to_edit in categories.categories:
        for current_category in current_map["categories"]:
            if to_edit["id"] == current_category["id"]:
                current_map["categories"] = [category for category in current_map["categories"] if category["id"] != to_edit["id"]]
                changed_category = Category(to_edit["name"])
                changed_category.set_id(to_edit["id"])
                current_map["categories"].append(changed_category.to_dict())

    update_map_categories(map_id, current_map["categories"], result["sub"])

    return {"status": "success", "message": "Map category edited", "categories": current_map["categories"]}


# delete map categories
@app.delete("/maps/{map_id}/categories")
async def delete_map_categories(response: Response, map_id: str, categories: DeleteMapCategories, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for category_id in categories.categories:
        for current in current_map["categories"]:
            if category_id == current["id"]:
                current_map["categories"].pop(current_map["categories"].index(current))

    update_map_categories(map_id, current_map["categories"], result["sub"])

    return {"status": "success", "message": "Map category deleted", "categories": current_map["categories"]}

@app.get("/maps/{map_id}/categories")
async def get_map_categories(response: Response, map_id: str, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    return {"status": "success", "message": "Map categories retrieved", "categories": current_map["categories"]}


# post a new map color
@app.post("/maps/{map_id}/colors")
async def post_map_color(response: Response, map_id: str, colors: PostMapColors, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for color in colors.colors:
        current_map["colors"].append(Color(name=color["name"], hex=color["hex"]).to_dict())

    update_map_colors(map_id, current_map["colors"], result["sub"])

    return {"status": "success", "message": "Map color added", "colors": current_map["colors"]}


@app.delete("/maps/{map_id}/colors")
async def delete_map_colors(response: Response, map_id: str, colors: DeleteMapColors, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for color_id in colors.colors:
        for current in current_map["colors"]:
            if color_id == current["id"]:
                current_map["colors"].pop(current_map["colors"].index(current))

    update_map_colors(map_id, current_map["colors"], result["sub"])

    return {"status": "success", "message": "Map color deleted", "colors": current_map["colors"]}


@app.get("/maps/{map_id}/colors")
async def get_map_colors(response: Response, map_id: str, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    return {"status": "success", "message": "Map colors retrieved", "colors": current_map["colors"]}


@app.put("/maps/{map_id}/colors")
async def put_map_colors(response: Response, map_id: str, colors: PutMapColors, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for to_edit in colors.colors:
        for current_color in current_map["colors"]:
            if to_edit["id"] == current_color["id"]:
                current_map["colors"] = [color for color in current_map["colors"] if color["id"] != to_edit["id"]]
                changed_color = Color(name=to_edit["name"], hex=to_edit["hex"])
                changed_color.set_id(to_edit["id"])
                current_map["colors"].append(changed_color.to_dict())

    update_map_colors(map_id, current_map["colors"], result["sub"])

    return {"status": "success", "message": "Map color edited", "colors": current_map["colors"]}


@app.post("/maps/{map_id}/icons")
async def post_map_icons(response: Response, map_id: str, icons: PostMapIcons, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for icon in icons.icons:
        current_map["icons"].append(Icon(name=icon["name"], url=icon["url"]).to_dict())

    update_map_icons(map_id, current_map["icons"], result["sub"])

    return {"status": "success", "message": "Map icon added", "icons": current_map["icons"]}

@app.put("/maps/{map_id}/icons")
async def put_map_icons(response: Response, map_id: str, icons: PutMapIcons, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for to_edit in icons.icons:
        for current_icon in current_map["icons"]:
            if to_edit["id"] == current_icon["id"]:
                current_map["icons"] = [icon for icon in current_map["icons"] if icon["id"] != to_edit["id"]]
                changed_icon = Icon(name=to_edit["name"], url=to_edit["url"])
                changed_icon.set_id(to_edit["id"])
                current_map["icons"].append(changed_icon.to_dict())

    update_map_icons(map_id, current_map["icons"], result["sub"])

    return {"status": "success", "message": "Map icon edited", "icons": current_map["icons"]}


@app.delete("/maps/{map_id}/icons")
async def delete_map_icons(response: Response, map_id: str, icons: DeleteMapIcons, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for icon_id in icons.icons:
        for current in current_map["icons"]:
            if icon_id == current["id"]:
                current_map["icons"].pop(current_map["icons"].index(current))

    update_map_icons(map_id, current_map["icons"], result["sub"])

    return {"status": "success", "message": "Map icon deleted", "icons": current_map["icons"]}

@app.get("/maps/{map_id}/icons")
async def get_map_icons(response: Response, map_id: str, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()
    
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    current_map = get_map_by_id(map_id)
    
    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}
    
    return {"status": "success", "message": "Map icons retrieved", "icons": current_map["icons"]}


# delete a map
@app.delete("/maps/{map_id}")
async def delete_map(response: Response, map_id: str, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    # delete map
    delete_map_by_id(map_id)

    return {"status": "success", "message": "Map deleted"}

# add a user to the map
@app.post("/maps/{map_id}/users")
async def put_map_user(response: Response, map_id: str, user: UserPut, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    user = MapUser(usersub=user.user, permissions=MapPermissions(edit=False, add=False, admin=False).to_dict())

    current_map["users"].append(user.to_dict())

    update_map_users(map_id, current_map["users"], result["sub"])
     
    return {"status": "success", "message": "User added to map"}

# remove a user from the map
@app.delete("/maps/{map_id}/users")
async def delete_map_user(response: Response, map_id: str, user: UserPut, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for current in current_map["users"]:
        if current["usersub"] == user.user:
            current_map["users"].pop(current_map["users"].index(current))
        
    update_map_users(map_id, current_map["users"], result["sub"])

    return {"status": "success", "message": "User removed from map"}

# edit user permissions
@app.put("/maps/{map_id}/users/{user_id}")
async def put_map_user_permissions(response: Response, map_id: str, user_id: str, permissions: UserPermissions, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    current_map = get_map_by_id(map_id)

    if current_map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}

    # verify owner permissions
    if current_map["owner"] != result["sub"]:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit this map"}

    for current in current_map["users"]:
        if current["usersub"] == user_id:
            current["permissions"] = MapPermissions(edit=permissions.edit, add=permissions.add, admin=permissions.admin).to_dict()

    update_map_users(map_id, current_map["users"], result["sub"])

    return {"status": "success", "message": "User permissions updated"}
    

# get points geojson
@app.get("/maps/{map_id}/points")
async def get_map_points(response: Response, map_id: str, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()
    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result
    
    # verify permissions
    if not verify_user_permissions(map_id, result["sub"], "view"):
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to view this map"}
    
    # get points
    return {"status": "success", "message": "Points retrieved", "points": get_points_geojson_for_map(map_id)}

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


    # check if we have permissions to add a point to this map
    # if we're not the owner and we don't have add permissions, return 403
    if not verify_user_permissions(map_id, result["sub"], "add"):
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to add a point to this map"}
    

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
    print(map["categories"], map["colors"], map["icons"])
    if new_point.get_category() not in map["categories"].keys():
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"status": "error", "message": "Category not allowed for this map"}
    
    # we're expecting a hex color code
    if new_point.get_color() not in map["colors"].keys():
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"status": "error", "message": "Color not allowed for this map"}
    
    if new_point.get_icon() not in map["icons"].keys():
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
    map = get_map_by_id(map_id)

    if map is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Map not found"}
    
    # check if we have permissions to delete a point from this map
    # if we're not the owner and we don't have delete permissions, return 403
    if not verify_user_permissions(map_id, result["sub"], "edit"):
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to delete a point from this map"}

    
    remove_point_from_map(map_id, point_id)

    return {"status": "success", "message": "Point removed from map"}


# edit map point
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
    
    # check if we have permissions to edit a point on this map
    # if we're not the owner and we don't have edit permissions, return 403
    if not verify_user_permissions(map_id, result["sub"], "edit"):
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"status": "error", "message": "You do not have permission to edit a point on this map"}

    # get point
    currentPoint = get_point_by_id(map_id, point_id)

    if currentPoint is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"status": "error", "message": "Point not found"}


    # name: Optional[str]
    # description: Optional[str]
    # color: Optional[str]
    # icon: Optional[str]
    # category: Optional[str]
    # lat: Optional[float]
    # lng: Optional[float]

    if point.name is not None:
        currentPoint["name"] = point.name
    
    if point.description is not None:
        currentPoint["description"] = point.description

    if point.color is not None:
        currentPoint["color"] = point.color

    if point.icon is not None:
        currentPoint["icon"] = point.icon

    if point.category is not None:
        currentPoint["category"] = point.category

    if point.lat is not None:
        currentPoint["lat"] = point.lat

    if point.lng is not None:
        currentPoint["lng"] = point.lng
        
    # verify Point data makes sense for the map
    if currentPoint["category"] not in map["categories"]:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"status": "error", "message": "Category not allowed for this map"}
    
    if currentPoint["color"] not in map["colors"].keys():
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"status": "error", "message": "Color not allowed for this map"}
    
    if currentPoint["icon"] not in map["icons"].keys():
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"status": "error", "message": "Icon not allowed for this map"}
    
    # update point in map
    update_point_in_map(map_id, point_id, currentPoint)

    return {"status": "success", "message": "Point updated", "point": currentPoint}



@app.get("/fcc/towers/nearby/{lat}/{lng}/{radius}")
async def get_towers_nearby(response: Response, lat: float, lng: float, radius: float, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    # find towers
    towers_polygons, towers_points = retrieve_fcc_tower_objects(lat, lng, radius) #feet

    return {"status": "success", "message": "Towers retrieved", "towers_polygons": towers_polygons, "towers_points": towers_points}


@app.get("/fcc/antennas/nearby/{lat}/{lng}/{radius}/{uls}")
async def get_antennas_nearby(response: Response, lat: float, lng: float, radius: float, uls: bool, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials).verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    antennas = retrieve_fcc_antenna_objects(lat, lng, radius, uls) #feet

    return {"status": "success", "message": "Antennas retrieved", "antennas": antennas}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=5000)