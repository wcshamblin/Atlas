from typing import List

from fastapi import Depends, FastAPI, Response, Request, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from database.classes import Point
from database.database import add_pte_point, get_pte_point, get_pte_points_json, update_pte_point, delete_pte_point, get_home, set_home
from datetime import datetime
from database.timeconversion import from_str_to_datetime, from_datetime_to_str
import psycopg2
from math import sqrt

from api.utils import VerifyToken

import logging

# db initialization
connection = psycopg2.connect(user="postgres", password="postgres_2034", dbname="fccdata", host="localhost", port="5432")
fcccursor = connection.cursor()

# declarations
tower_declaration = "st_x    |       st_y        | record_type | content_indicator | file_number | registration_number | unique_system_identifier | coordinate_type | latitude_degrees | latitude_minutes | latitude_seconds | latitude_direction | latitude_total_seconds | longitude_degrees | longitude_minutes | longitude_seconds | longitude_direction | longitude_total_seconds | array_tower_position | array_total_tower | record_type2 | content_indicator2 | file_number2 | registration_number2 | unique_system_identifier2 | application_purpose | previous_purpose | input_source_code | status_code | date_entered | date_received | date_issued | date_constructed | date_dismantled | date_action | archive_flag_code | version | signature_first_name | signature_middle_initial | signature_last_name | signature_suffix |       signature_title       | invalid_signature |      structure_street_address       | structure_city | structure_state_code | county_code | zip_code | height_of_structure | ground_elevation | overall_height_above_ground | overall_height_amsl | structure_type | date_faa_determination_issued | faa_study_number | faa_circular_number | specification_option | painting_and_lighting | mark_light_code | mark_light_other | faa_emi_flag | nepa_flag | date_signed | signature_last_or | signature_first_or | signature_mi_or | signature_suffix_or | title_signed_or | date_signed_or |                   location_point"
tower_declaration = tower_declaration.replace(" ", "").split("|")
tower_indicies = {"overall_height": tower_declaration.index("overall_height_above_ground"), "height_support": tower_declaration.index("height_of_structure"), "lat": tower_declaration.index("st_y"), "lng": tower_declaration.index("st_x"), "registration_number": tower_declaration.index("registration_number"), "structure_type": tower_declaration.index("structure_type")}

tv_declaration = "st_x        |        st_y        | ant_input_pwr | ant_max_pwr_gain | ant_polarization | antenna_id | antenna_type | application_id | asrn_na_ind |  asrn   | aural_freq | avg_horiz_pwr_gain | biased_lat | biased_long | border_code | carrier_freq | docket_num | effective_erp | electrical_deg |  elev_amsl  | elev_bldg_ag | eng_record_type | fac_zone | facility_id | freq_offset | gain_area | haat_rc_mtr | hag_overall_mtr | hag_rc_mtr | horiz_bt_erp | lat_deg | lat_dir | lat_min |  lat_sec  | lon_deg | lon_dir | lon_min |  lon_sec  | loss_area | max_ant_pwr_gain | max_erp_dbk | max_erp_kw  |  max_haat  | mechanical_deg | multiplexor_loss | power_output_vis_dbk | power_output_vis_kw | predict_coverage_area | predict_pop | terrain_data_src_other | terrain_data_src | tilt_towards_azimuth |  true_deg  | tv_dom_status | upperband_freq | vert_bt_erp| visual_freq | vsd_service | rcamsl_horiz_mtr | ant_rotation | input_trans_line | max_erp_to_hor | trans_line_loss | lottery_group | analog_channel | lat_whole_secs | lon_whole_secs | max_erp_any_angle | station_channel | lic_ant_make | lic_ant_model_num  | dt_emission_mask | whatisthiscol1 | whatisthiscol2 | last_change_date |location_point                   "
tv_declaration = tv_declaration.replace(" ", "").split("|")
tv_indicies = {"lat": tv_declaration.index("st_y"), "lng": tv_declaration.index("st_x"), "facility_id": tv_declaration.index("facility_id"), "station_channel": tv_declaration.index("station_channel"), "effective_erp": tv_declaration.index("effective_erp")}
tv_frequencies = {2:60, 3:66, 4:72, 5:82, 6:88, 7:180, 8:186, 9:192, 10:198, 11:204, 12:210, 13:216, 14:476, 15:482, 16:488, 17:494, 18:500, 19:506, 20:512, 21:518, 22:524, 23:530, 24:536, 25:542, 26:548, 27:554, 28:560, 29:566, 30:572, 31:578, 32:584, 33:590, 34:596, 35:602, 36:608, 37:614, 38:620, 39:626, 40:632, 41:638, 42:644, 43:650, 44:656, 45:662, 46:668, 47:674, 48:680, 49:686, 50:692, 51:698, 52:704, 53:710, 54:716, 55:722, 56:728, 57:734, 58:740, 59:746, 60:752, 61:758, 62:764, 63:770, 64:776, 65:782, 66:788, 67:794, 68:800, 69:806}

def retrieve_fcc_towers(lat: float, lng: float, radius: float):
    # radius should be in feet
    querystring = f"SELECT ST_X(ST_Transform(location_point, 4326)), ST_Y(ST_Transform(location_point, 4326)), * FROM asr_locations WHERE status_code = 'C' AND ST_Dwithin(ST_Transform(ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 2877), location_point, {radius});"
    fcccursor.execute(querystring)
    return fcccursor.fetchall()


def retrieve_fcc_antennas(lat: float, lng: float, radius: float, table: str):
    # radius should be in feet
    querystring = f"SELECT ST_X(ST_Transform(location_point, 4326)), ST_Y(ST_Transform(location_point, 4326)), * FROM {table} WHERE eng_record_type = 'C' AND ST_Dwithin(ST_Transform(ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 2877), location_point, {radius});"
    fcccursor.execute(querystring)
    return fcccursor.fetchall()

def calculate_safe_zone(kilowatts: float, gain: float, freq: float, ground_reflections: bool):
    # frequency should be in MHz
    if ground_reflections:
        gf = .64
    else:
        gf = .25
    power = 1000 * 1000 * kilowatts
    eirp = power * pow(10, (gain/10))
    if freq < 1.34:
        # Below 1.34 MHz
        std1 = 100.0
        std2 = 100.0
    elif freq < 3.0:
        # Below 3.0 MHz
        std1 = 100.0
        std2 = 180.0 / (pow(freq,2))
    elif freq < 30.0:
        # Below 30 MHz
        std1 = 900.0 / pow(freq,2)
        std2 = 180.0 / (pow(freq,2))
    elif freq < 300.0:
        # Below 300 MHz
        std1 = 1.0
        std2 = 0.2
    elif freq < 1500.0:
        # Below 1500 MHz
        std1 = freq / 300.0
        std2 = freq / 1500.0
    elif freq < 100000.0:
        # Below 100 GHz
        std1 = 5.0
        std2 = 1.0
    else:
        # Frequency too high
        return None
    dx1 = sqrt((gf * eirp)/(std1 * 3.14159))
    dx1 = dx1/30.48
    dx1 = ((dx1 * 10) + 0.5) / 10
    dx2 = sqrt((gf * eirp)/(std2 * 3.14159))
    dx2 = dx2/30.48
    dx2 = ((dx2 * 10) + 0.5) / 10
    return {
        "safe-distance-controlled-feet": round(dx1, 4),
        "safe-distance-uncontrolled-feet": round(dx2, 4)
    }


def retrieve_fcc_tv_antennas(lat: float, lng: float, radius: float):
    # radius should be in feet
    antennas = retrieve_fcc_antennas(lat, lng, radius, "tv_locations")

    by_facility_id = {} # contains a list of antennas for each facility id
    stations = [] # to return, contains facilities and summarized data

    for antenna in antennas:
        if antenna[tv_indicies["facility_id"]] not in by_facility_id:
            by_facility_id[antenna[tv_indicies["facility_id"]]] = {"antennas": []}
            by_facility_id[antenna[tv_indicies["facility_id"]]]["antennas"].append(antenna)
        by_facility_id[antenna[tv_indicies["facility_id"]]]["antennas"].append(antenna)

    # if there aren't any antennas, return None
    if len(by_facility_id) == 0:
        return []

    # Take the highest power antenna for each facility and calculate the safe zone
    for facility_id, antennas in by_facility_id.items():

        # find the antenna with the highest erp
        antenna_with_max_erp = antennas[0]
        for antenna in antennas:
            if antenna[tv_indicies["effective_erp"]] > antenna_with_max_erp[tv_indicies["effective_erp"]]:
                antenna_with_max_erp = antenna

        max_erp = antenna_with_max_erp[tv_indicies["effective_erp"]]
        channel = int(antenna_with_max_erp[tv_indicies["station_channel"]])
        freq = tv_frequencies[channel]
        # We're assuming no ground reflections for TV antennas
        safe_distances = calculate_safe_zone(max_erp, 0.0, freq, False)

        stations.append({
            "lat": antenna_with_max_erp[tv_indicies["lat"]],
            "lng": antenna_with_max_erp[tv_indicies["lng"]],
            "facility_id": antenna_with_max_erp[tv_indicies["facility_id"]],
            "max_erp": max_erp,
            "channel": channel,
            "safe-distance-controlled-feet": safe_distances["safe-distance-controlled-feet"],
            "safe-distance-uncontrolled-feet": safe_distances["safe-distance-uncontrolled-feet"],
            "RabbitEars:": "https://www.rabbitears.info/market.php?request=station_search&callsign=" + antenna_with_max_erp[tv_indicies["station_callsign"]]
        })

    return stations

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


@app.get("/fcc/towers/nearby/{lat}/{lng}/{radius}")
async def get_towers_nearby(response: Response, lat: float, lng: float, radius: float, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials, scopes="read").verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    # find towers
    results = retrieve_fcc_towers(lat, lng, radius) #feet

    # parse results
    towers_triangles = {"type": "FeatureCollection",
                      "features": []
                     }

    towers_points = {"type": "FeatureCollection",
                        "features": []
                        }

    # loop through towers and make geojson triangles
    for tower in results:
        print(tower)
        # centered around coordinates
        triangle_coordinates = [[tower[tower_indicies["lng"]], tower[tower_indicies["lat"]] + 0.0001],
                                [tower[tower_indicies["lng"]] - 0.0001, tower[tower_indicies["lat"]] - 0.0001],
                                [tower[tower_indicies["lng"]] + 0.0001, tower[tower_indicies["lat"]] - 0.0001],
                                ]

        towers_triangles["features"].append({"type": "Feature", "properties": {
            "name": tower[tower_indicies["registration_number"]],
            "description": "",
            "overall_height": float(tower[tower_indicies["overall_height"]]),
            "height_support": float(tower[tower_indicies["height_support"]]),
            "structure_type": tower[tower_indicies["structure_type"]],
            "color": "#BD1313"},
                                "geometry": {"type": "Polygon", "coordinates":
                                    [triangle_coordinates]
                    }})

        towers_points["features"].append({"type": "Feature", "properties": {
            "name": tower[tower_indicies["registration_number"]],
            "description": "",
            "overall_height": float(tower[tower_indicies["overall_height"]]),
            "height_support": float(tower[tower_indicies["height_support"]]),
            "structure_type": tower[tower_indicies["structure_type"]],
            "color": "#BD1313"},
                                "geometry": {"type": "Point", "coordinates":
                                    [tower[tower_indicies["lng"]], tower[tower_indicies["lat"]]]
                    }})

    return {"status": "success", "message": "Towers retrieved", "towers_triangles": towers_triangles, "towers_points": towers_points}


@app.get("/fcc/antennas/nearby/{lat}/{lng}/{radius}")
async def get_antennas_nearby(response: Response, lat: float, lng: float, radius: float, token: str = Depends(token_auth_scheme)):
    result = VerifyToken(token.credentials, scopes="read").verify()

    if result.get("status"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return result

    # geojson
    antennas = {"type": "FeatureCollection",
                        "features": []
                        }

    # find antennas
    tv_antennas = retrieve_fcc_tv_antennas(lat, lng, radius) #feet

    # loop through antennas and add to geojson
    for antenna in tv_antennas:
        antennas["features"].append({"type": "Feature", "properties": {
            "name": antenna["facility-id"],
            "description": "",
            "transmitter-type": "tv",
            "erp": float(antenna["erp"]),
            "facility_id": antenna["facility-id"],
            "channel": antenna["channel"],
            "safe-distance-controlled-feet": antenna["safe-distance-controlled-feet"],
            "safe-distance-uncontrolled-feet": antenna["safe-distance-uncontrolled-feet"],
            "color": "#BD1313"},
            "geometry": {"type": "Point", "coordinates":
                                    [antenna["longitude"], antenna["latitude"]]
                    }})

    return {"status": "success", "message": "Antennas retrieved", "antennas": antennas}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=5000)