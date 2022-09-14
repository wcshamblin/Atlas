from fastapi import FastAPI, status, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import geojson

app = FastAPI()

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

placestoexplore = geojson.load(open("assets/Places_To_Explore_-_WCS/Larger_abandonments.geojson"))
for feature in placestoexplore.features:
    print(feature)

class MapPost(BaseModel):
    lat: float
    lng: float
    color: str
    special: bool


@app.post('/add/', status_code=status.HTTP_201_CREATED)
async def add_point(query: MapPost):
    # query.lat, query.lng, query.color, query.special

    return JSONResponse({"success": "Point added"})

@app.get('/map/', status_code=status.HTTP_200_OK)
async def return_data():
    return JSONResponse({"success": data})