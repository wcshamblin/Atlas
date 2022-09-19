from fastapi import FastAPI, status, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import geojson
from typing import Optional
from json import load, dump
import os

app = FastAPI()

origins = [
    "https://localhost",
    "https://localhost:3000",
    "http://localhost:63342",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

categories = {
    "bridges": "Bridges",
    "drains": "Drains",
    "everything": "Everything_else",
    "large": "Larger_abandonments",
    "mines": "Mines_and_Tunnels",
    "places": "Places_of_interest",
    "active": "Possibly_active",
    "small": "Small_abandonments"
}

colors = {
    "green": "#558B2F",
    "orange": "#E65100",
    "blue": "#0288D1",
    "purple": "#673AB7",
    "magenta": "#880E4F",
    "red": "#A52714",
    "yellow": "#FFD600",
    "black": "#000000"
}

placestoexplore = "assets/placestoexplore/Places_to_Explore.geojson"


class PointPost(BaseModel):
    name: str
    category: str
    description: str
    lat: float
    lng: float
    color: str
    special: bool

class PointPut(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    color: Optional[str] = None
    special: Optional[bool] = None

class PointDel(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    color: Optional[str] = None
    special: Optional[bool] = None


@app.post('/add/', status_code=status.HTTP_201_CREATED)
async def add_point(query: PointPost):
    for item in query:
        print(item)

    if query.name is None:
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    if query.category not in categories:
        raise HTTPException(status_code=400, detail=f"category {query.category} not found")

    if query.color not in colors:
        raise HTTPException(status_code=400, detail=f"color {query.color} not found")

    with open(placestoexplore, 'r') as f:
        data = load(f)
        data.append({
            "type": "Feature",
            "properties": {
                "Name": query.name,
                "description": query.description,
                "gx_media_links": None,
                "color": colors[query.color],
                "special": query.special,
                "category": categories[query.category]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    query.lng,
                    query.lat
                ]
            }
        },
        )

    os.remove(placestoexplore)
    with open(placestoexplore, 'w') as f:
        dump(data, f, indent=4)

    return JSONResponse({"success": "Point added"})

@app.delete('/del/', status_code=status.HTTP_200_OK)
async def delete_point(query: PointDel):
    deleted = False
    with open(placestoexplore, 'r') as f:
        data = load(f)

    for i in range(0, len(data)):
        if data[i]["geometry"]["coordinates"] == [query.lng, query.lat]:
            del data[i]
            deleted = True

    if deleted:
        os.remove(placestoexplore)
        with open(placestoexplore, 'w') as f:
            dump(data, f, indent=4)


    return JSONResponse({"success": "Point deleted"})

@app.put('/edit/', status_code=status.HTTP_200_OK)
async def edit_point(query: PointPut):
    # Edit data

    return JSONResponse({"success": "Point edited"})


@app.get('/map/', status_code=status.HTTP_200_OK)
async def return_data():
    data = load(open(placestoexplore))

    return JSONResponse({"success": data})
