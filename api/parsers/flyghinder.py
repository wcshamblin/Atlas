from json import dump
import re

outfile = "assets/flyghinder/flyghinder.geojson"

flyghinder = open("assets/flyghinder/flyghinder.txt", "r").readlines()

geojson = {
    "type": "FeatureCollection",
    "features": []
}

for line in flyghinder:
    if re.search(r"\d{6}[NS]\s\d{7}[EW]", line) or re.search(r"\d{6}\.\d{1,3}[NS]\s\d{7}\.\d{1,3}[EW]", line):
        # now we want to get the number "NO"
        # this can some times have an "area" in front of it
        # so we need to search for the first number (can be any length) that has a space after it
        # then the "Designation" is in between the end of the number and the coordinates
        
        # first get the first number that has a space after it
        number = re.search(r"\d+\s", line).group(0)
        
        # now get the coordinates
        # 673748N 0200935E
        # 67°37'48"N 20°09'35"E
        #635025.3N 0194921.5E
        # 63°50'25.3"N 19°49'21.5"E
        # coordinates can have a decimal point and one to 3 decimal places

        
        coordinates = re.search(r"\d{6}[NS]\s\d{7}[EW]", line)

        # if we didn't find any coordinates, then try to search for the other format
        if not coordinates:
            coordinates = re.search(r"\d{6}\.\d{1,3}[NS]\s\d{7}\.\d{1,3}[EW]", line)
        coordinates = coordinates.group(0)
        
        
        # also let's make these usable
        coordinates = coordinates.split(" ")
        lat = coordinates[0]
        lon = coordinates[1]
        # strip any leading 0s
        lat = lat.lstrip("0")
        lon = lon.lstrip("0")
        # find and eat directions
        # they should always be at the end
        l_d = lat[-1]
        lat = lat[:-1]
        lo_d = lon[-1]
        lon = lon[:-1]

        # get degrees
        deg = lat[:2]
        lat = lat[2:]
        # get minutes
        minutes = lat[:2]
        lat = lat[2:]
        # get seconds
        seconds = lat[:2]

        lat = (float(deg) + float(minutes)/60 + float(seconds)/(60*60)) * (-1 if l_d in ['W', 'S'] else 1)
        
        # get degrees
        deg = lon[:2]
        lon = lon[2:]
        # get minutes
        minutes = lon[:2]
        lon = lon[2:]
        # get seconds
        seconds = lon[:2]
    
        lon = (float(deg) + float(minutes)/60 + float(seconds)/(60*60)) * (-1 if lo_d in ['W', 'S'] else 1)

        # now we need to get the designation
        # this is the text between the number and the coordinates
        
        # first get the index of the number
        number_index = line.find(number)
        # then get the index of the coordinates
        coordinates_index = line.find(" ".join(coordinates))
        # now get the designation
        designation = line[number_index+len(number):coordinates_index]
        # strip any leading or trailing whitespace
        designation = designation.strip()

        # now we need to get the height and elevation
        # they are the 2 numbers with a space seperating them directly after the coordinates
        height_elevation = re.search(r"\d+\s\d+", line[coordinates_index:]).group(0)
        # split them
        height_elevation = height_elevation.split(" ")
        # get the height
        height_feet = int(height_elevation[0])
        # get the elevation
        elevation_feet = int(height_elevation[1])

        # these are in feet so convert them to meters and store
        height_meters = float(height_feet) * 0.3048
        elevation_meters = float(elevation_feet) * 0.3048

        # round to the nearest .1
        height_meters = round(height_meters, 1)
        elevation_meters = round(elevation_meters, 1)
        
        # now we need to eat up the "Light Character"
        # this is directly after the height and elevation
        # it has many properties but we take until we reach a word of length >3 or a word that starts with a capital letter but contains a lowercase letter
        # this is because the "Light Character" can contain words like "FLG" and "FLG W" which we don't want

        # first get the index of the height and elevation
        height_elevation_index = line.find(" ".join(height_elevation))
        # now get the index of the first word of length >3 or a word that starts with a capital letter but contains a lowercase letter
        light_character_index = height_elevation_index + re.search(r"\b[A-Z][a-z]+\b", line[height_elevation_index:]).start()
        # we don't care about the light character so we just eat it up
        # now we want the rest of the line, this is the "Types of obstacles"
        types_of_obstacles = line[light_character_index:]
        # strip any leading or trailing whitespace
        types_of_obstacles = types_of_obstacles.strip()

        
        # append to our geojson
        geojson["features"].append({
            "type": "Feature",
            "properties": {
                "number": number,
                "designation": designation,
                "height_feet": height_feet,
                "height_meters": height_meters,
                "elevation_feet": elevation_feet,
                "elevation_meters": elevation_meters,
                "types_of_obstacles": types_of_obstacles
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            }
        })

# dump it
with open(outfile, "w") as f:
    dump(geojson, f, indent=2)