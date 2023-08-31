from requests import get
from json import loads, dump

outfile = "assets/long-lines/long-lines.geojson"

def retrieve():
    states = ["California", "Texas", "Florida", "New York", "Pennsylvania", "Illinois", "Ohio", "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia", "Washington", "Massachusetts", "Arizona", "Indiana", "Tennessee", "Missouri", "Maryland", "Wisconsin", "Minnesota", "Colorado", "Alabama", "South Carolina", "Louisiana", "Kentucky", "Oregon", "Oklahoma", "Connecticut", "Iowa", "Mississippi", "Arkansas", "Utah", "Kansas", "Nevada", "New Mexico", "Nebraska", "West Virginia", "Idaho", "Hawaii", "New Hampshire", "Maine", "Montana", "Rhode Island", "Delaware", "South Dakota", "North Dakota", "Alaska", "Vermont", "Wyoming"]

    geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    for state in states:
        print("Parsing " + state)
        response = get("https://long-lines.com/map/gensitelistmainmap?state="+state)
        data = loads(response.text)
        for site in data:
            geojson["features"].append({"type":"Feature","geometry":{"type":"Point","coordinates":[site["lon1"], site["lat1"],0]},"properties":{"name": site["sitename1"], "description":""}})
        
        print("    Found " + str(len(data)) + " sites\n")

    out = open(outfile, "w")
    print("Dumping to " + outfile)
    dump(geojson, out, indent=4)
    out.close()
    print("Done")

if __name__ == "__main__":
    retrieve()