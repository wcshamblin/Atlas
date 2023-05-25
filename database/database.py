from typing import List

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime, timezone

from json import dumps, load

def init(path="database/atlas-50a45-firebase-adminsdk-wvx8v-06724e2f8c.json"):
    cred = credentials.Certificate(path)
    firebase_admin.initialize_app(cred)
    return firestore.client()

db = init()


def convert_point_to_geojson(point):
    # example point:
    # {
    #     "description": "test",
    #     "creator": "google-oauth2|112057537397008960552",
    #     "id": "40bcf170-0a11-45ff-b68f-079fba34428d",
    #     "editor": "google-oauth2|112057537397008960552",
    #     "color": "#558B2F",
    #     "name": "test",
    #     "category": "Everything else",
    #     "creation_date": "2023-05-24T16:53:52.903949+00:00",
    #     "lat": 0.0,
    #     "icon": "https://i.imgur.com/f6WpXTw.png",
    #     "lng": 0.0,
    #     "owner": "google-oauth2|112057537397008960552",
    #     "edit_date": "2023-05-24T16:53:52.903954+00:00",
    #     "deleted": false
    # }

    # convert point to geojson using all the fields listed above 
    output = {
        "type": "Feature",
        "properties": {
            "description": point["description"],
            "creator": point["creator"],
            "id": point["id"],
            "editor": point["editor"],
            "color": point["color"],
            "name": point["name"],
            "category": point["category"],
            "creation_date": point["creation_date"],
            "icon": point["icon"],
            "owner": point["owner"],
            "edit_date": point["edit_date"],
            "deleted": point["deleted"]
        },
        "geometry": {
            "type": "Point",
            "coordinates": [point["lng"], point["lat"]]
        }
    }

    return output

def get_eula_acceptance(usersub):
    eula_object = db.collection(u'eula_acceptance').where(u'user', u'==', usersub).get()
    if not eula_object:
        return False
    
    eula_object = eula_object[0].to_dict()

    # if the acceptance is older than a week
    if (datetime.now(timezone.utc) - eula_object['acceptance_date']).days > 7:
        return False

    if eula_object['accepted']:
        return True

    return False


def set_eula_acceptance(usersub, acceptance):
    # if the user has already accepted the eula, update the acceptance
    user_eula = db.collection(u'eula_acceptance').where(u'user', u'==', usersub).get()
    if user_eula:
        return user_eula[0].reference.update({u'accepted': acceptance, u'acceptance_date': datetime.now(), u'user': usersub})

    # if the user has not accepted the eula, create a new acceptance
    return db.collection(u'eula_acceptance').add({u'accepted': acceptance, u'acceptance_date': datetime.now(), u'user': usersub})


def get_map_by_id(id) -> dict:
    # the id is within the document
    return db.collection(u'maps').where(u'id', u'==', id).get()[0].to_dict()


def get_maps_by_user(usersub) -> List[dict]:
    return [doc.to_dict() for doc in db.collection(u'maps').where(u'owner', u'==', usersub).get()]


def get_maps_for_user(usersub) -> List[dict]:
    # return maps that the user owns and maps that the user has access to
    my_maps = get_maps_by_user(usersub)
    shared_maps = [doc.to_dict() for doc in db.collection(u'maps').where(u'users', u'array_contains', usersub).get()]

    # remove points from maps, we don't need them here
    for map in my_maps:
        map.pop("points", None)
    for map in shared_maps:
        map.pop("points", None)

    return my_maps + shared_maps
    


def add_map(map) -> str:
    return db.collection(u'maps').add(map)


def update_map_info(id, info, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # update map
    for key, value in info.items():
            # if key is not in map_dict, skip it
            if key not in map_dict.keys():
                continue
            if key in ["id", "points", "view_count", "edit_date", "creation_date"]:
                continue
            map_dict[key] = value

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    return map_obj.reference.update(map_dict)


def delete_map(id) -> str:
    return db.collection(u'maps').where(u'id', u'==', id).delete()

# def get_geojson_for_map(map_id) -> List[dict]:
#     geojson = {"type": "FeatureCollection", "features": []}

#     # get points
#     points = [doc.to_dict() for doc in db.collection(u'maps').document(map_id).collection(u'points').get()]

#     # add points to geojson
#     for point in points:
#         geojson["features"].append({
#             "type": "Feature",
#             "properties": {
#                 "name": point["name"],
#                 "description": point["description"],
#                 "id": point["id"],
#                 "type": point["type"],
#                 "icon": point["icon"],
#                 "color": point["color"]
#             },
#             "geometry": {
#                 "type": "Point",
#                 "coordinates": [point["longitude"], point["latitude"]]
#             }
#         })

#     return geojson
    

def get_points_geojson_for_map(map_id) -> List[dict]:
    geojson = {"type": "FeatureCollection", "features": []}

    # get points
    points = db.collection(u'maps').where(u'id', u'==', map_id).get()[0].to_dict()['points']

    # add points to geojson
    for point in points:
        geojson["features"].append(convert_point_to_geojson(point))

    return geojson


def add_point_to_map(map_id, point) -> str:
    return db.collection(u'maps').where(u'id', u'==', map_id).get()[0].reference.update({u'points': firestore.ArrayUnion([point])})


def remove_point_from_map(map_id, point_id) -> str:
    return db.collection(u'maps').where(u'id', u'==', map_id).get()[0].reference.update({u'points': firestore.ArrayRemove([get_point_from_map(map_id, point_id)])})


def get_point_from_map(map_id, point_id) -> dict:
    points = db.collection(u'maps').where(u'id', u'==', map_id).get()[0].to_dict()['points']

    # find point with id
    for point in points:
        if point['id'] == point_id:
            return point

    return None


def update_point_in_map(map_id, point_id, point) -> str:
    return db.collection(u'maps').where(u'id', u'==', map_id).collection(u'points').where(u'id', u'==', point_id).update(point)


def delete_point_from_map(map_id, point_id) -> str:
    return db.collection(u'maps').where(u'id', u'==', map_id).collection(u'points').where(u'id', u'==', point_id).delete()


def get_users_for_map(map_id) -> List[dict]:
    return [doc.to_dict() for doc in db.collection(u'maps').where(u'id', u'==', map_id).collection(u'users').get()]


def set_home(usersub, home):
    # try to find an existing home and update it
    if db.collection(u'homes').where(u'owner', u'==', usersub).get():
        # get ONE home and update it
        home_id = db.collection(u'homes').where(u'owner', u'==', usersub).get()[0].id
        return db.collection(u'homes').document(home_id).update(home)
    # if no home exists, create a new one with owner as the user's sub
    home = {**home, **{"owner": usersub}}
    return db.collection(u'homes').add(home)


def get_home(usersub):
    if db.collection(u'homes').where(u'owner', u'==', usersub).get():
        return [home.to_dict() for home in db.collection(u'homes').where(u'owner', u'==', usersub).get()]
    return None
