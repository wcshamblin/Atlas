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
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fileprefix = "assets/placestoexplore/"
categories = {
    "Bridges": fileprefix+"Bridges.geojson",
    "Drains": fileprefix+"Drains.geojson",
    "Everything Else": fileprefix+"Everything_else.geojson",
    "Larger Abandonments": fileprefix+"Larger_abandonments.geojson",
    "Mines and Tunnels": fileprefix+"Mines_and_Tunnels.geojson",
    "Places of Interest": fileprefix+"Places_of_interest.geojson",
    "Possibly Active": fileprefix+"Possibly_active.geojson",
    "Small Abandonments": fileprefix+"Small_abandonments.geojson"
}

bridges = load(open(fileprefix+"Bridges.geojson"))
drains = load(open(fileprefix+"Drains.geojson"))
everything_else = load(open(fileprefix+"Everything_else.geojson"))
larger_abandonments = load(open("assets/placestoexplore/Larger_abandonments.geojson"))
mines_and_tunnels = load(open("assets/placestoexplore/Mines_and_Tunnels.geojson"))
places_of_interest = load(open("assets/placestoexplore/Places_of_interest.geojson"))
possibly_active = load(open("assets/placestoexplore/Possibly_active.geojson"))
small_abandonments = load(open("assets/placestoexplore/Small_abandonments.geojson"))



class MapPost(BaseModel):
    name: str
    category: str
    description: str
    lat: float
    lng: float
    color: str
    special: bool

class MapPut(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    color: Optional[str] = None
    special: Optional[bool] = None


@app.post('/add/', status_code=status.HTTP_201_CREATED)
async def add_point(query: MapPost):
    if query.category not in categories:
        raise HTTPException(status_code=400, detail=f"category {query.category} not found")

    with open(categories[query.category], 'r') as f:
        data = load(f)
        data.append({
            "type": "Feature",
            "properties": {
                "Name": query.name,
                "description": query.description,
                "color": query.description,
                "special": query.special
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    query.lat,
                    query.lng
                ]
            }
        },
        )

    os.remove(categories[query.category])
    with open(categories[query.category], 'w') as f:
        dump(data, f, indent=4)

    return JSONResponse({"success": "Point added"})


@app.put('/edit/', status_code=status.HTTP_200_OK)
async def edit_point(query: MapPut):
    # Edit data
    return JSONResponse({"success": "Point edited"})


@app.get('/map/', status_code=status.HTTP_200_OK)
async def return_data():
    data = {}
    for category, filepath in categories.items():
        data[category] = load(open(filepath))

    return JSONResponse({"success": data})
