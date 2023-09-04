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


def convert_point_to_geojson(point):
    # convert point to geojson using all the fields listed above 
    output = {
        "type": "Feature",
        "properties": {
            "description": point["description"],
            "creator": point["creator"],
            "editor": point["editor"],
            "color": point["color"],
            "name": point["name"],
            "id": point["id"],
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
    # maps has a field called owner, which is the usersub
    return [doc.to_dict() for doc in db.collection(u'maps').where(u'owner', u'==', usersub).get()]


def get_maps_for_user(usersub) -> List[dict]:
    # return maps that the user owns and maps that the user has access to
    my_maps = get_maps_by_user(usersub)

    # get maps that the user has access to
    # maps has a user dict which is {usersub: {permissions: []}, so find maps where the usersub is in the users dict
    shared_maps = []
    for map in [doc.to_dict() for doc in db.collection(u'maps').get()]:
        if usersub in map["users"]:
            shared_maps.append(map)

    # increase view counts 
    # for map in my_maps:
    #     [doc.reference.update({u'views': map['views'] + 1}) for doc in db.collection(u'maps').where(u'id', u'==', map['id']).get()]
    
    # remove points from maps, we don't need them here
    for map in my_maps:
        # append my permissions
        map["my_permissions"] = ["owner"]
    for map in shared_maps:
        # append my permissions
        map["my_permissions"] = map["users"][usersub]["permissions"]

    return my_maps + shared_maps

def add_user_to_map(map_id, user) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', map_id).get()[0]
    map_dict = map_obj.to_dict()

    # add user to map
    if user not in map_dict["users"]:
        map_dict["users"][user] = {"permissions": []}
    else:
        return "User already in map"

    # update map
    return map_obj.reference.update(map_dict)

def remove_user_from_map(map_id, user) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', map_id).get()[0]
    map_dict = map_obj.to_dict()

    # remove user from map
    if user in map_dict["users"]:
        map_dict["users"].pop(user)
    else:
        return "User not in map"
    
    # update map
    return map_obj.reference.update(map_dict)


def edit_user_permissions(map_id, user, permissions) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', map_id).get()[0]
    map_dict = map_obj.to_dict()

    # edit user permissions
    if user in map_dict["users"]:
        map_dict["users"][user]["permissions"] = permissions
    else:
        return "User not in map"

    # update map
    return map_obj.reference.update(map_dict)

# verify_map_permissions(map_id, result["sub"], "view")
def verify_user_permissions(map_id, user, permission) -> bool:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', map_id).get()[0]
    map_dict = map_obj.to_dict()

    if user == map_dict["owner"]:
        return True
     

    # check if user has permission
    if user in map_dict["users"]:
        # if checking for view permissions, we can return true
        if permission == "view":
            return True
        
        if permission in map_dict["users"][user]["permissions"]:
            return True
        
        else:
            return False
    else:
        return False
    

def add_map(map) -> str:
    return db.collection(u'maps').add(map)


def update_map_name(id, name, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # update map
    map_dict["name"] = name

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    return map_obj.reference.update(map_dict)


def update_map_description(id, description, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # update map
    map_dict["description"] = description

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    return map_obj.reference.update(map_dict)


def update_map_legend(id, legend, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # update map
    map_dict["legend"] = legend

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    return map_obj.reference.update(map_dict)


def update_map_categories(id, categories, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # update map
    map_dict["categories"] = categories

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    return map_obj.reference.update(map_dict)


def add_map_categories(id, categories, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # add category
    for category in categories:
        # generate category dict
        category_dict = {str(uuid4()): category}
        # add category to map
        map_dict["categories"].append(category_dict)

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    map_obj.reference.update(map_dict)

    return map_dict["categories"]


def remove_map_categories(id, category_ids, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # remove category
    for category_id in category_ids:
        # find category
        for category in map_dict["categories"]:
            if category_id in category:
                # remove category
                map_dict["categories"].remove(category)

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    map_obj.reference.update(map_dict)

    return map_dict["categories"]


def update_map_colors(id, colors, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # update map
    map_dict["colors"] = colors

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    return map_obj.reference.update(map_dict)


def add_map_colors(id, colors, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # add color
    for color in colors:
        # generate color dict
        color_dict = {str(uuid4()): color}
        # add color to map
        map_dict["colors"].append(color_dict)

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    map_obj.reference.update(map_dict)

    return map_dict["colors"]

def remove_map_colors(id, color_ids, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # remove color
    for color_id in color_ids:
        # find color
        for color in map_dict["colors"]:
            if color_id in color:
                # remove color
                map_dict["colors"].remove(color)

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    map_obj.reference.update(map_dict)

    return map_dict["colors"]

def add_map_icons(id, icons, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # add icon
    for icon in icons:
        # generate icon dict
        icon_dict = {str(uuid4()): icon}
        # add icon to map
        map_dict["icons"].append(icon_dict)

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    map_obj.reference.update(map_dict)

    return map_dict["icons"]

def update_map_icons(id, icons, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # update map
    map_dict["icons"] = icons

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    return map_obj.reference.update(map_dict)

def remove_map_icons(id, icon_ids, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # remove icon
    for icon_id in icon_ids:
        # find icon
        for icon in map_dict["icons"]:
            if icon_id in icon:
                # remove icon
                map_dict["icons"].remove(icon)

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    map_obj.reference.update(map_dict)

    return map_dict["icons"]


def update_map_info(id, info, editor) -> str:
    # find map
    map_obj = db.collection(u'maps').where(u'id', u'==', id).get()[0]
    map_dict = map_obj.to_dict()

    # update map
    for key, value in info.items():
            map_dict[key] = value

    # set editor and edit_date
    map_dict["editor"] = editor
    map_dict["edit_date"] = datetime.now()

    # update map
    return map_obj.reference.update(map_dict)


def delete_map(id) -> str:
    return db.collection(u'maps').where(u'id', u'==', id).delete()
    

def get_points_geojson_for_map(map_id) -> List[dict]:
    geojson = {"type": "FeatureCollection", "features": []}

    # get points
    points = db.collection(u'maps').where(u'id', u'==', map_id).get()[0].to_dict()['points']

    # add points to geojson
    for point in points:
        geojson["features"].append(convert_point_to_geojson(point))

    return geojson

def get_point_by_id(map_id, point_id) -> dict:
    # get point
    points = db.collection(u'maps').where(u'id', u'==', map_id).get()[0].to_dict()['points']

    for point in points:
        if point['id'] == point_id:
            return point

    return None


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
    db.collection(u'maps').where(u'id', u'==', map_id).get()[0].reference.update({u'points': firestore.ArrayRemove([get_point_from_map(map_id, point_id)])})
    return db.collection(u'maps').where(u'id', u'==', map_id).get()[0].reference.update({u'points': firestore.ArrayUnion([point])})


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