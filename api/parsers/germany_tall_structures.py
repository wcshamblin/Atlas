from json import dump
import re

outfile = "assets/germany_tall_structures/germany_tall_structures.geojson"

structures = open("assets/germany_tall_structures/germany_tall_structures.txt", "r").readlines()

geojson = {
    "type": "FeatureCollection",
    "features": []
}

for line in structures:
    line = line.strip().split("	")

    # if line length is < 8 we are missing coordinates
    if len(line) < 8:
        continue

    name = line[0].strip()
    height_feet = line[1].strip().split(" ")[0]
    if height_feet == "":
        height_feet = float(line[2].strip().split(" ")[0]) * 3.28084
    year = line[3].strip()
    type = line[4].strip()

    regards = ""
    if len(line) == 9:
        regards = line[8].strip()
    

    coordinates = line[7].strip().replace(",", ";").split(";")
    # print(coordinates)
    
    # there might be multiple sets of coordinates
    for coordinateset in coordinates:
        # 49°18′56.05″N 11°32′42.08″E -> 49.315569, 11.545022

        coordinateset = coordinateset.strip()
        # this is all in germany so we can just assume that the first one is north and the second is east
        coordinateset = coordinateset.split("N")
        if len(coordinateset) < 2:
            continue

        north = coordinateset[0].strip()
        east = coordinateset[1].strip()
    
        # regex match for degrees, minutes, seconds (seconds can have a decimal point)
        # 49°18′56.05″N 11°32′42.08″E
        for match in re.finditer(r"(\d+)°(\d+)′(\d+\.?\d*)″", north):
            north_degrees = match.group(1)
            north_minutes = match.group(2)
            north_seconds = match.group(3)
        
        for match in re.finditer(r"(\d+)°(\d+)′(\d+\.?\d*)″", east):
            east_degrees = match.group(1)
            east_minutes = match.group(2)
            east_seconds = match.group(3)

        # convert to decimal
        north_decimal = float(north_degrees) + float(north_minutes)/60 + float(north_seconds)/3600
        east_decimal = float(east_degrees) + float(east_minutes)/60 + float(east_seconds)/3600

        print(name, " | ", height_feet, " | ", year, " | ", type, " | ", regards, " | ", north_decimal, " | ", east_decimal)

        # add to geojson
        geojson["features"].append({
            "type": "Feature",
            "properties": {
                "name": name,
                "height_feet": height_feet,
                "height_meters": str(float(height_feet) * 0.3048),
                "year": year,
                "type": type,
                "regards": regards
            },
            "geometry": {
                "type": "Point",
                "coordinates": [east_decimal, north_decimal]
            }
        })

dump(geojson, open(outfile, "w"))