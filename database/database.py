import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

def init(path="database/atlas-50a45-firebase-adminsdk-wvx8v-06724e2f8c.json"):
    cred = credentials.Certificate(path)
    firebase_admin.initialize_app(cred)
    return firestore.client()

db = init()


# GET, POST, PUT (delete)
def get_pte_points():
    return db.collection(u'places_to_explore').get()


def get_pte_point(id):
    return db.collection(u'places_to_explore').where(u'id', u'==', id).get()


def add_pte_point(point):
    return db.collection(u'places_to_explore').add(point)


def update_pte_point(id, point):
    return db.collection(u'places_to_explore').where(u'id', u'==', id).update(point)


def delete_pte_point(id):
    return db.collection(u'places_to_explore').where(u'id', u'==', id).delete()