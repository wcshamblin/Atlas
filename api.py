import json
from fastapi import FastAPI, Depends, status, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from starlette.config import Config
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import HTMLResponse, RedirectResponse, JSONResponse, HTMLResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
from datetime import datetime, timedelta
from jose import JWTError, jwt
from json import load, dump
from subprocess import check_output, STDOUT
import logging
import os
from parsers import longlines

# Google drive backups
def send_backup():
    # Call backup and keep output
    logging.info("Backing up to Google Drive")
    output = check_output("./backup.sh", stderr=STDOUT, shell=True, universal_newlines=True)
    logging.info(output)

# Logging
logging.basicConfig(filename='access.log', level=logging.INFO, format='%(asctime)s %(message)s', datefmt="%m/%d/%Y|%H:%M:%S")

# Startup
logging.info("Starting API")

# Authenticated users
# Scopes are: edit, view, add
users = {"112057537397008960552":{"scope": ["edit", "add", "view"]},
 "109701721255072747502":{"scope": ["edit", "add", "view"]},
 "103079011459605179145":{"scope": ["edit", "add", "view"]},
 "112799760127187625788": {"scope": ["edit", "add", "view"]},
 "111023702251746291970": {"scope": ["view"]},
 "118176797204485272737": {"scope": ["view"]},
 "100821748140927916507": {"scope": ["view"]},
 "107745383827411410442": {"scope": ["view", "add"]},
 "111705004713568818098": {"scope": ["view"]},
 "113388504247807728977": {"scope": ["view"]}
 }


# JWT
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7" #openssl rand -hex 32
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="!secret")

origins = [
    "https://localhost",
    "https://localhost:3000",
    "http://localhost:63342",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = Config('.env')
oauth = OAuth(config)

CONF_URL = 'https://accounts.google.com/.well-known/openid-configuration'
oauth.register(
    name='google',
    server_metadata_url=CONF_URL,
    client_kwargs={
        'scope': 'openid email profile'
    }
)

def get_google_provider_cfg():
    return requests.get(GOOGLE_DISCOVERY_URL).json()

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user: str = payload.get("sub")
        if user is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    if user not in users:
        raise credentials_exception
    return user

categories = ["Bridges", "Drains", "Everything_else", "Larger_abandonments", "Mines_and_Tunnels", "Places_of_interest", "Possibly_active", "Small_abandonments"]

colors = ["#558B2F", "#E65100", "#0288D1", "#673AB7", "#880E4F", "#A52714", "#FFD600", "#000000"]

placestoexplore = "assets/placestoexplore/Places_to_Explore.geojson"

unauthorized = "".join(open("unauthorized.html", "r").readlines())

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
    lat: float
    lng: float
    newlat: Optional[float] = None
    newlng: Optional[float] = None
    color: Optional[str] = None
    special: Optional[bool] = None
    delete: Optional[str] = None

@app.get('/login')
async def login(request: Request):
    redirect_uri = request.url_for('auth')
    redirect_uri = 'https://octet.llc/atlas/api/login/callback'
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get('/login/callback')
async def login_callback(request: Request):
    # Get auth code from URI
    code = request.query_params.get('code')
    # Get token from auth code
    token = await oauth.google.authorize_access_token(request)

    # Check if token is owned by a user that has access to our API
    logging.info("User logging in: " + token["userinfo"]["sub"] + " - " + token["userinfo"]["email"] + " - " + token["userinfo"]["name"])

    userid = token["userinfo"]["sub"]

    if userid not in users:
        # If they don't
        logging.info("User not authorized: " + token["userinfo"]["sub"] + " - " + token["userinfo"]["email"] + " - " + token["userinfo"]["name"])
        return HTMLResponse(content=unauthorized, status_code=401)

    else:
        logging.info("User authorized: " + token["userinfo"]["sub"] + " - " + token["userinfo"]["email"] + " - " + token["userinfo"]["name"])
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": userid}, expires_delta=access_token_expires
        )

        # Set the JWT as a cookie in the response
        request.session["access_token"] = access_token

        response = RedirectResponse(url="/atlas/")

        return response

@app.get('/auth')
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as error:
        return HTMLResponse(f'<h1>{error.error}</h1>')
    user = token.get('userinfo')
    if user:
        request.session['user'] = dict(user)
    return RedirectResponse(url='/')

@app.get('/logout')
async def logout(request: Request):
    request.session.pop('access_token', None)
    return RedirectResponse(url='/atlas/')

@app.post('/add', status_code=status.HTTP_201_CREATED)
async def add_point(query: PointPost, request: Request):
    # Verify user
    user = await get_current_user(request.session["access_token"])
    logging.info("User adding point: " + user)

    # Check if scoped for this action
    if "edit" not in users[user]["scope"] and "add" not in users[user]["scope"]:
        logging.info("User not authorized for this action: " + user, "Action: add")
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Bearer"})

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
                "color": query.color,
                "special": query.special,
                "category": query.category
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

    logging.info("User added point: " + user + "\n    " + str(query))
    send_backup()

    return JSONResponse({"success": "Point added"})

@app.put('/put', status_code=status.HTTP_200_OK)
async def edit_point(query: PointPut, request: Request):
    # Verify user
    user = await get_current_user(request.session["access_token"])
    logging.info("User requesting to edit point: " + user)

    # Check if scoped for this action
    if "edit" not in users[user]["scope"]:
        logging.info("User not authorized for this action: " + user)
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Bearer"})

    found = False
    index = None
    oldpoint = None
    with open(placestoexplore, 'r') as f:
        data = load(f)

    for i in range(0, len(data)):
        index = i
        if data[i]["geometry"]["coordinates"] == [query.lng, query.lat]:
            found = True
            oldpoint = data[i]
            if query.newlat is not None and query.newlng is not None:
                data[i]["geometry"]["coordinates"] = [query.newlng, query.newlat]
            if query.name != "":
                data[i]["properties"]["Name"] = query.name
            data[i]["properties"]["description"] = query.description

            data[i]["properties"]["color"] = query.color
            data[i]["properties"]["special"] = query.special
            data[i]["properties"]["category"] = query.category

            break

    if found:
        if query.delete == "delete":
            logging.info("User deleted point: " + user + "\n    " + str(data[index]))
            del data[index]
        else:
            logging.info("User edited point: " + user + "\n    Old point: " + str(oldpoint) + "\n    New point: " + str(data[index]))

        os.remove(placestoexplore)
        with open(placestoexplore, 'w') as f:
            dump(data, f, indent=4)
        
        send_backup()
        return JSONResponse({"success": "Point edited"})

    return JSONResponse({"failure": "Could not find point"})


@app.get('/map', status_code=status.HTTP_200_OK)
async def return_data(request: Request):
    token = request.session.get("access_token", None)
    # Verify user
    user = await get_current_user(token)

    data = load(open(placestoexplore))
    logging.info("Served map to: " + user)

    return JSONResponse({"success": data})






if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=5000)