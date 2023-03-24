import json
from matplotlib.colors import Normalize
import matplotlib.cm as cm
import matplotlib.colors as colors

towers = json.load(open('decoms.json'))
# sort by height
towers = sorted(towers, key=lambda k: k['height'])

geojson = {'type': 'FeatureCollection', 'features': []}
outfile = open('parsed.geojson', 'w')

max_color_height = 304.8 # 1000 feet

maxheight = minheight = float(towers[0]['height'])
heights = []

# determine min, max, and average height
for tower in towers:
    height = float(tower['height'])
    heights.append(height)
    if height > maxheight:
        maxheight = height
    if height < minheight:
        minheight = height
avgheight = sum(heights) / len(towers)
print("Max height: " + str(maxheight), "Min height: " + str(minheight), "Average height: " + str(avgheight))


for i in range(len(heights)):
    if heights[i] > max_color_height:
        heights[i] = max_color_height

norm = Normalize(vmin=minheight, vmax=max_color_height + max_color_height / 3) # so we don't have an ugly bright color on top
rgba_values = cm.plasma(norm(heights))

i=0
for tower in towers:
    height = float(tower['height'])

    color = colors.to_hex(rgba_values[i])
    i+=1

    geojson['features'].append({
        'type': 'Feature',
        'properties': {
            'name': tower['registration_number'],
            'description': str(float(tower['height']) * 3.28084) + " feet",
            'color': color
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [float(tower["coordinates"].replace(" ", "").split(",")[1]), float(tower["coordinates"].replace(" ", "").split(",")[0])]
        }
    })

json.dump(geojson, outfile)