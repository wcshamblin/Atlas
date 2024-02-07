from requests import get

def get_parcels(z: int, x: int, y: int):
    url = f"https://tiles.regrid.com/api/v1/parcels/{z}/{x}/{y}.mvt"
    response = get(url)
    return response.content
