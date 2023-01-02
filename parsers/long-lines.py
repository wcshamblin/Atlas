from requests import get
from json import loads, dump

states = ["California", "Texas", "Florida", "New York", "Pennsylvania", "Illinois", "Ohio", "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia", "Washington", "Massachusetts", "Arizona", "Indiana", "Tennessee", "Missouri", "Maryland", "Wisconsin", "Minnesota", "Colorado", "Alabama", "South Carolina", "Louisiana", "Kentucky", "Oregon", "Oklahoma", "Connecticut", "Iowa", "Mississippi", "Arkansas", "Utah", "Kansas", "Nevada", "New Mexico", "Nebraska", "West Virginia", "Idaho", "Hawaii", "New Hampshire", "Maine", "Montana", "Rhode Island", "Delaware", "South Dakota", "North Dakota", "Alaska", "Vermont", "Wyoming"]

geojson = {
    "type": "FeatureCollection",
    "features": []
}

for state in states:
    print(state)
    response = get("https://long-lines.com/map/gensitelistmainmap?state="+state)
    data = loads(response.text)
    for site in data:
        geojson["features"].append({"type":"Feature","geometry":{"type":"Point","coordinates":[site["lon1"], site["lat1"],0]},"properties":{"name": site["sitename1"], "description":""}})

out = open("assets/long-lines/long-lines.geojson", "w")
dump(geojson, out, indent=4)
out.close()