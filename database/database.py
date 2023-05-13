from typing import List

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime

from json import dumps, load

def init(path="database/atlas-50a45-firebase-adminsdk-wvx8v-06724e2f8c.json"):
    cred = credentials.Certificate(path)
    firebase_admin.initialize_app(cred)
    return firestore.client()

db = init()


def get_map_by_id(id) -> dict:
    # the id is within the document
    return db.collection(u'maps').where(u'id', u'==', id).get()[0].to_dict()

def get_maps_by_user(usersub) -> List[dict]:
    return [doc.to_dict() for doc in db.collection(u'maps').where(u'owner', u'==', usersub).get()]

def get_maps_for_user(usersub) -> List[dict]:
    return [doc.to_dict() for doc in db.collection(u'maps').where(u'users', u'array_contains', usersub).get()]


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

# def get_points_for_map(map_id) -> List[dict]:
#     return [doc.to_dict() for doc in db.collection(u'maps').document(map_id).collection(u'points').get()]

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
