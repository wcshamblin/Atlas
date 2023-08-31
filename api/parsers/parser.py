from pykml import parser
from pykml.factory import nsmap
import os, glob
from json import load, dumps

namespace = {"ns": nsmap[None]}

placemarks = {}

with open("assets/placestoexplore/PlacesToExploreWCS.kml") as f:
    root = parser.parse(f).getroot()
    pms = root.findall(".//ns:Placemark", namespaces=namespace)

    i=0
    for pm in pms:
        i+=1
        styleurl = str(pm.styleUrl).split("-")
        color = "#"+styleurl[2]
        coordinates = str(pm.Point.coordinates).strip().split(",")
        special = True if styleurl[1] == "1502" else False
        try:
            description = pm.description
        except AttributeError:
            description = ""

        print(coordinates[0] + ", " + coordinates[1])

        print("    " + str(pm.name).strip(), color, special, "\n")

        placemarks[coordinates[0], coordinates[1]] = {"color": color, "special": special}

    print("Total:", i, "\n")

for file in glob.glob('assets/geojson/*.geojson'):
    print("Found geojson:", file)
    geojson = load(open(os.path.join(os.getcwd(), file)))
    items = []
    for item in geojson["features"]:
        properties = placemarks[str(item["geometry"]["coordinates"][0]), str(item["geometry"]["coordinates"][1])] # Select from placemarks with same coordinates
        item["properties"]["color"] = properties["color"]
        item["properties"]["special"] = properties["special"]

        items.append(item)

    outfile = open("assets/placestoexplore/"+file.split("/")[-1].split(".")[0]+".geojson", "w")
    json_output = dumps(items, indent=4)
    outfile.write(json_output)
    outfile.close()
