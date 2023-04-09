from typing import List

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

from json import dumps, load

def init(path="database/atlas-50a45-firebase-adminsdk-wvx8v-06724e2f8c.json"):
    cred = credentials.Certificate(path)
    firebase_admin.initialize_app(cred)
    return firestore.client()

db = init()


# GET, POST, PUT (delete)
def get_pte_points() -> str:
    return [doc.to_dict() for doc in db.collection(u'places_to_explore').get()]

def get_pte_points_json() -> str:
    # convert all timestamps to strings
    # test geojson return
    # points = [
    #         {
    #                 "type": "Feature",
    #                 "properties": {
    #                     "Name": "Cape Fear Trestle",
    #                     "description": None,
    #                     "gx_media_links": None,
    #                     "color": "#673AB7",
    #                     "special": False,
    #                     "category": "Bridges"
    #                 },
    #                 "geometry": {
    #                     "type": "Point",
    #                     "coordinates": [
    #                         -79.045938,
    #                         35.568646
    #                     ]
    #                 }
    #             },
    #         {
    #                 "type": "Feature",
    #                 "properties": {
    #                     "Name": "Cape Fear Trestle",
    #                     "description": None,
    #                     "gx_media_links": None,
    #                     "color": "#673AB7",
    #                     "special": False,
    #                     "category": "Bridges"
    #                 },
    #                 "geometry": {
    #                     "type": "Point",
    #                     "coordinates": [
    #                         -79.045938,
    #                         35.568646
    #                     ]
    #                 }
    #             }
    #         ]
    # return dumps(points)

    points = [doc.to_dict() for doc in db.collection(u'places_to_explore').get()]
    geojson_points = []

    for point in points:
        point["creation_date"] = point["creation_date"].strftime("%Y-%m-%dT%H:%M:%S:%fZ")

        if point["edit_date"] is not None:
            point["edit_date"] = point["edit_date"].strftime("%Y-%m-%dT%H:%M:%S:%fZ")

        geojson_points.append({
            "type": "Feature",
            "properties": {
                "name": point["name"],
                "description": point["description"],
                "color": point["color"],
                "special": point["special"],
                "category": point["category"],
                "id": point["id"],
                "owner": point["owner"],
                "creation_date": point["creation_date"],
                "edit_date": point["edit_date"],
                "editor": point["editor"],
                "deleted": point["deleted"]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [point["lng"], point["lat"]]
            }
        })

    return dumps(geojson_points)
def get_pte_point(id):
    return db.collection(u'places_to_explore').where(u'id', u'==', id).get().to_dict()


def add_pte_point(point):
    return db.collection(u'places_to_explore').add(point)


def update_pte_point(id, point):
    return db.collection(u'places_to_explore').where(u'id', u'==', id).update(point)


def delete_pte_point(id):
    return db.collection(u'places_to_explore').where(u'id', u'==', id).delete()