from json import dumps
from datetime import datetime
from uuid import uuid4
# from database.timeconversion import from_str_to_datetime, from_datetime_to_str


class Point:
    def __init__(self, owner: str, name: str, description: str, color: str, special: bool, category: str, lat: float, lng: float):
        self.id = str(uuid4())
        self.deleted = False
        self.creation_date = datetime.now()
        self.owner = owner
        self.edit_date = datetime.now()
        self.editor = None
        self.name = name
        self.description = description
        self.color = color
        self.special = special
        self.category = category
        self.lat = lat
        self.lng = lng

    def set_id(self, id: str):
        self.id = id

    def set_deleted(self, deleted: bool):
        self.deleted = deleted

    def set_edit_date(self, edit_date: datetime):
        self.edit_date = edit_date

    def set_editor(self, editor: str):
        self.editor = editor

    def set_name(self, name: str):
        self.name = name

    def set_description(self, description: str):
        self.description = description

    def set_color(self, color: str):
        self.color = color

    def set_special(self, special: bool):
        self.special = special

    def set_category(self, category: str):
        self.category = category

    def set_lat(self, lat: float):
        self.lat = lat

    def set_lng(self, lng: float):
        self.lng = lng

    def get_id(self) -> str:
        return self.id
    def get_deleted(self) -> bool:
        return self.deleted

    def get_creation_date(self) -> datetime:
        return self.creation_date

    def get_owner(self) -> str:
        return self.owner

    def get_edit_date(self) -> datetime:
        return self.edit_date

    def get_editor(self) -> str:
        return self.editor

    def get_name(self) -> str:
        return self.name

    def get_description(self) -> str:
        return self.description

    def get_color(self) -> str:
        return self.color

    def get_special(self) -> bool:
        return self.special

    def get_category(self) -> str:
        return self.category

    def get_lat(self) -> float:
        return self.lat

    def get_lng(self) -> float:
        return self.lng

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "deleted": self.deleted,
            "creation_date": self.creation_date,
            "owner": self.owner,
            "edit_date": self.edit_date,
            "editor": self.editor,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "special": self.special,
            "category": self.category,
            "lat": self.lat,
            "lng": self.lng
        }

    def to_json(self) -> str:
        return dumps(self.to_dict())
