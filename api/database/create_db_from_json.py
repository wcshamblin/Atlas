from json import load
from classes import Point
# from database import add_pte_point


from typing import List

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime, timezone
from uuid import uuid4

from json import dumps, load

def init(path="database/atlas-50a45-firebase-adminsdk-wvx8v-06724e2f8c.json"):
    cred = credentials.Certificate(path)
    firebase_admin.initialize_app(cred)
    return firestore.client()

db = init()

map_id="19619577-ac0e-4f50-88f8-d29329e17f66"

category_id_dict = {
    "Bridges": "f96ab349-7786-4a64-bc05-35bce684b20e",
    "Drains": "2eb3590d-4f1f-41c3-af78-c244befd8d0c",
    "Everything_else": "6beb8f89-0b25-4507-8f8e-5a7562ca9b1b",
    "Larger_abandonments": "4cbe000f-35cb-4099-b8fb-05933c08435e",
    "Mines_and_Tunnels": "c218d616-2d9f-42ac-a102-7be9c6e832fe",
    "Places_of_interest": "a607b5c6-0301-449c-9fac-7a43666e5089",
    "Possibly_active": "bc0f801f-b110-4251-8140-5a231b8fff31",
    "Small_abandonments": "15f592ea-215e-44b0-ad4f-afa47fab09a4",
    "Towers": "33fe729c-42f5-4c97-aece-ea782dd0c3c2"
}

color_id_dict = {
    "#558B2F": "097443e7-e72b-4ef7-acdc-1077d2cebbc0",
    "#E65100": "b6b89d5c-5b24-4a65-85f8-102703c9ec5e",
    "#0288D1": "03360c28-ebd8-4a54-8fd5-7e1a97bdad8b",
    "#673AB7": "7a245b65-333f-42cc-8737-5ce367e7ebf5",
    "#880E4F": "a3b74067-b3ed-4a70-90a1-196f1a978f45",
    "#A52714": "96efbd92-cd37-4223-9752-e9fb62a5c7eb",
    "#FFD600": "a688ca56-ae5c-4f81-a576-e3534f3a4880",
    "#000000": "a22514b3-8356-4418-964d-81ba6f555244"
}

#     {
#         "type": "Feature",
#         "properties": {
#             "Name": "Cape Fear Trestle",
#             "description": null,
#             "gx_media_links": null,
#             "color": "#673AB7",
#             "special": false,
#             "category": "Bridges"
#         },
#         "geometry": {
#             "type": "Point",
#             "coordinates": [
#                 -79.045938,
#                 35.568646
#             ]
#         }
#     },


with open("../../atlas-legacy/assets/placestoexplore/Places_to_Explore.geojson", "r") as f:
    # Load the JSON file
    data = load(f)
    # Loop through the JSON file
    points = []
    for point in data:
        # Create a new Point object
        icon = "c6a794b1-0d83-4cb5-b990-c9bf75ccba74"
        if point["properties"]["special"]:
            icon = "2e9023c4-3508-4cc2-bb10-6b5ec10ac2e5"

        # try:
        #     category = category_id_dict[point["properties"]["category"]]
        # except KeyError:
        #     category = category_id_dict["Everything_else"]

        try:
            color = color_id_dict[point["properties"]["color"]]
        except KeyError:
            color = color_id_dict["#558B2F"]

        # def __init__(self, owner, name, description, color, icon, category, lat, lng):
        new_point = Point(owner="Places to Explore legacy",
                          name=point["properties"]["Name"],
                          description=point["properties"]["description"],
                          color=color,
                          icon=icon,
                          category=category_id_dict[point["properties"]["category"]],
                          lat=point["geometry"]["coordinates"][1],
                          lng=point["geometry"]["coordinates"][0])

        # Add the point to the database
        points.append(new_point.to_dict())
        
    

    print(points)

    db.collection(u'maps').where(u'id', u'==', map_id).get()[0].reference.update({u'points': points})


    # Close the file
    f.close()
