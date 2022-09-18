from json import load, dump

placestoexplore = []

for filename in ["Bridges", "Drains", "Everything_else", "Larger_abandonments", "Mines_and_Tunnels", "Places_of_interest", "Possibly_active", "Small_abandonments"]:
    geojson = load(open("assets/placestoexplore/"+filename+".geojson"))
    for place in geojson:
        place["properties"]["category"] = filename
        placestoexplore.append(place)


out = open("assets/placestoexplore/Places_to_Explore.geojson", "w")
dump(placestoexplore, out, indent=4)
out.close()