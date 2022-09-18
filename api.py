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

categories = {
    "Bridges": "Bridges",
    "Drains": "Drains",
    "Everything Else": "Everything_else",
    "Larger Abandonments": "Larger_abandonments",
    "Mines and Tunnels": "Mines_and_Tunnels",
    "Places of Interest": "Places_of_interest",
    "Possibly Active": "Possibly_active",
    "Small Abandonments": "Small_abandonments"
}

placestoexplore = "assets/placestoexplore/Places_to_Explore.geojson"


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

    with open(placestoexplore, 'r') as f:
        data = load(f)
        data.append({
            "type": "Feature",
            "properties": {
                "Name": query.name,
                "description": query.description,
                "color": query.description,
                "special": query.special,
                "category": categories[query.category]
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

    os.remove(placestoexplore)
    with open(placestoexplore, 'w') as f:
        dump(data, f, indent=4)

    return JSONResponse({"success": "Point added"})


@app.put('/edit/', status_code=status.HTTP_200_OK)
async def edit_point(query: MapPut):
    # Edit data

    return JSONResponse({"success": "Point edited"})


@app.get('/map/', status_code=status.HTTP_200_OK)
async def return_data():
    data = load(open(placestoexplore))

    return JSONResponse({"success": data})
