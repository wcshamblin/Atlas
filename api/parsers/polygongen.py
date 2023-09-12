from json import load, dump
import argparse

parser = argparse.ArgumentParser(description="Generate polygons from a geojson of points")
parser.add_argument("input", help="Input geojson file")
# output should be optional, if it's not given, it should be the input file with "_polygons" appended
parser.add_argument("-o", "--output", help="Output geojson file")

args = parser.parse_args()

if args.output:
    outfile = args.output
else:
    outfile = args.input.split(".")[0] + "_polygons.geojson"


objects = load(open(args.input, "r"))

object_polygons = {
    "type": "FeatureCollection",
    "features": []
}

for object in objects["features"]:
    print(object)

    # make a triangle centered around the coords
    triangle_top = [object["geometry"]["coordinates"][0], object["geometry"]["coordinates"][1] + 0.0001]
    triangle_left = [object["geometry"]["coordinates"][0] - 0.0001, object["geometry"]["coordinates"][1] - 0.0001]
    triangle_right = [object["geometry"]["coordinates"][0] + 0.0001, object["geometry"]["coordinates"][1] - 0.0001]

    object_poly = {
        "type": "Feature",
        "properties": object["properties"],
        "geometry": {
            "type": "Polygon",
            "coordinates": [[triangle_top, triangle_left, triangle_right, triangle_top]]
        }
    }

    object_polygons["features"].append(object_poly)


dump(object_polygons, open(outfile, "w"))