from json import dumps
from datetime import datetime
from uuid import uuid4
# from database.timeconversion import from_str_to_datetime, from_datetime_to_str


class Point:
    def __init__(self, owner, name, description, color, icon, category, lat, lng):
        self.id = str(uuid4())
        self.owner = owner
        self.name = name
        self.description = description
        self.color = color
        self.icon = icon
        self.category = category
        self.lat = lat
        self.lng = lng
        self.creator = owner
        self.creation_date = datetime.now()
        self.editor = owner
        self.edit_date = datetime.now()
        self.deleted = False

    def set_owner(self, owner):
        self.owner = owner

    def set_name(self, name):
        self.name = name

    def set_description(self, description):
        self.description = description

    def set_color(self, color):
        self.color = color

    def set_icon(self, icon):
        self.icon = icon

    def set_category(self, category):
        self.category = category

    def set_lat(self, lat):
        self.lat = lat

    def set_lng(self, lng):
        self.lng = lng

    def set_creator(self, creator):
        self.creator = creator

    def set_creation_date(self, creation_date):
        self.creation_date = creation_date

    def set_editor(self, editor):
        self.editor = editor

    def set_edit_date(self, edit_date):
        self.edit_date = edit_date

    def set_deleted(self, deleted):
        self.deleted = deleted

    def get_owner(self):
        return self.owner
    
    def get_name(self):
        return self.name
    
    def get_description(self):
        return self.description
    
    def get_color(self):
        return self.color
    
    def get_icon(self):
        return self.icon
    
    def get_category(self):
        return self.category
    
    def get_lat(self):
        return self.lat
    
    def get_lng(self):
        return self.lng
    
    def get_creator(self):
        return self.creator
    
    def get_creation_date(self):
        return self.creation_date
    
    def get_editor(self):
        return self.editor
    
    def get_edit_date(self):
        return self.edit_date
    
    def get_deleted(self):
        return self.deleted

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "owner": self.owner,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "icon": self.icon,
            "category": self.category,
            "lat": self.lat,
            "lng": self.lng,
            "creator": self.creator,
            "creation_date": self.creation_date,
            "editor": self.editor,
            "edit_date": self.edit_date,
            "deleted": self.deleted
        }
    
    def to_json(self) -> str:
        return dumps(self.to_dict())
    

class Map:
    def __init__(self, owner: str, name: str, description: str, legend: str, colors: dict, categories: list, icons: list):
        self.id = str(uuid4())
        self.owner = owner
        self.name = name
        self.description = description
        self.legend = legend
        self.colors = colors
        self.categories = categories
        self.icons = icons
        
        self.points = []
        self.users = {}
        self.creation_date = datetime.now()
        self.editor = owner
        self.edit_date = datetime.now()
        self.deleted = False
        self.view_count = 0

    def set_owner(self, owner):
        self.owner = owner

    def set_name(self, name):
        self.name = name

    def set_description(self, description):
        self.description = description

    def set_legend(self, legend):
        self.legend = legend

    def add_point(self, point):
        self.points.append(point)

    def remove_point(self, point):
        self.points.remove(point)

    def set_points(self, points):
        self.points = points

    def edit_point(self, point, new_point):
        self.points[self.points.index(point)] = new_point

    def set_creation_date(self, creation_date):
        self.creation_date = creation_date

    def set_editor(self, editor):
        self.editor = editor

    def set_edit_date(self, edit_date):
        self.edit_date = edit_date

    def set_deleted(self, deleted):
        self.deleted = deleted

    def increment_view_count(self):
        self.view_count += 1

    def add_user(self, user):
        self.users.append(user)

    def remove_user(self, user):
        self.users.remove(user)

    def add_user_permission(self, user, permission):
        if user not in self.user_permissions.keys():
            self.user_permissions[user] = [permission]
        else:
            self.user_permissions[user].append(permission)

    def remove_user_permission(self, user, permission):
        if user in self.user_permissions.keys():
            self.user_permissions[user].remove(permission)

    def get_owner(self):
        return self.owner
    
    def get_name(self):
        return self.name
    
    def get_description(self):
        return self.description
    
    def get_legend(self):
        return self.legend
    
    def get_points(self):
        return self.points

    def get_users(self):
        return self.users
    
    def get_creation_date(self):
        return self.creation_date

    def get_editor(self):
        return self.editor
    
    def get_edit_date(self):
        return self.edit_date
    
    def get_deleted(self):
        return self.deleted
    
    def get_view_count(self):
        return self.view_count
    
    def get_id(self):
        return self.id
        
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "owner": self.owner,
            "name": self.name,
            "description": self.description,
            "legend": self.legend,
            "colors": self.colors,
            "categories": self.categories,
            "icons": self.icons,
            "points": [point.to_dict() for point in self.points],
            "users": self.users,
            "creation_date": self.creation_date,
            "editor": self.editor,
            "edit_date": self.edit_date,
            "deleted": self.deleted,
            "view_count": self.view_count
        }
    
    def to_json(self) -> str:
        return dumps(self.to_dict())    



class Icon:
    def __init__(self, name: str, url: str):
        self.id = str(uuid4())
        self.name = name
        self.url = url

    def set_id(self, id):
        self.id = id

    def set_name(self, name):
        self.name = name

    def set_url(self, url):
        self.url = url

    def get_id(self):
        return self.id

    def get_name(self):
        return self.name

    def get_url(self):
        return self.url

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "url": self.url
        }

    def to_json(self) -> str:
        return dumps(self.to_dict())

class Color:
    def __init__(self, name: str, hex: str):
        self.id = str(uuid4())
        self.name = name
        self.hex = hex

    def set_id(self, id):
        self.id = id

    def set_name(self, name):
        self.name = name

    def set_hex(self, color):
        self.hex = hex

    def get_id(self):
        return self.id

    def get_name(self):
        return self.name

    def get_hex(self):
        return self.hex

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "hex": self.hex
        }

    def to_json(self) -> str:
        return dumps(self.to_dict())


class Category:
    def __init__(self, name: str):
        self.id = str(uuid4())
        self.name = name

    def set_id(self, id):
        self.id = id

    def get_id(self):
        return self.id

    def set_name(self, name):
        self.name = name

    def get_name(self):
        return self.name

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name
        }

    def to_json(self) -> str:
        return dumps(self.to_dict())