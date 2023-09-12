import json
from pprint import pprint
from matplotlib.colors import Normalize
import matplotlib.cm as cm
import matplotlib.colors as colors
import argparse

parser = argparse.ArgumentParser(description="Generate height colors from a geojson of points")

parser.add_argument("input", help="Input geojson file")
# output should be optional, if it's not given, it should be the input file with "_heightcolored" appended
parser.add_argument("-o", "--output", help="Output geojson file")

args = parser.parse_args()

if args.output:
    outfile = args.output
else:
    outfile = args.input.split(".")[0] + "_heightcolored.geojson"

height_key = "height_feet"

objects = json.load(open(args.input, "r"))
# sort by height
objects = sorted(objects, key=lambda k: float(k[height_key]))

pprint(objects[:10])

geojson = {'type': 'FeatureCollection', 'features': []}
outfile = open(outfile, 'w')

max_color_height = 243.84 # 800 feet

maxheight = minheight = float(objects[0][height_key])
heights = []

# determine min, max, and average height
for object in objects:
    height = float(object[height_key])
    heights.append(height)
    if height > maxheight:
        maxheight = height
    if height < minheight:
        minheight = height
avgheight = sum(heights) / len(objects)
print("Max height: " + str(maxheight), "Min height: " + str(minheight), "Average height: " + str(avgheight))


for i in range(len(heights)):
    if heights[i] > max_color_height:
        heights[i] = max_color_height

norm = Normalize(vmin=minheight, vmax=max_color_height + max_color_height / 3) # so we don't have an ugly bright color on top

rgba_values = cm.plasma(norm(heights))

i=0
for object in objects:
    height = float(object[height_key])
    print(height)

    color = colors.to_hex(rgba_values[i])
    i+=1

    geojson['features'].append({
        'type': 'Feature',
        # properties mirror the object properties but with the color added
        'properties': {
            **object,
            'color': color
        },

        'geometry': {
            'type': 'Point',
            # 'coordinates': [float(tower["coordinates"].split(", ")[1]), float(tower["coordinates"].split(", ")[0])]
            'coordinates': [float(tower["longitude"]), float(tower["latitude"])]
        }
    })

json.dump(geojson, outfile)