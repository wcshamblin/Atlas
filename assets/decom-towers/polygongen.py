from json import load, dump

towers = load(open("../../website/spa_react_javascript_hello-world-basic-authentication-with-api-integration/src/components/decoms.geojson", "r"))

tower_polygons = {
    "type": "FeatureCollection",
    "features": []
}

for tower in towers["features"]:
    print(tower)

    # make a triangle centered around the coords
    triangle_top = [tower["geometry"]["coordinates"][0], tower["geometry"]["coordinates"][1] + 0.0001]
    triangle_left = [tower["geometry"]["coordinates"][0] - 0.0001, tower["geometry"]["coordinates"][1] - 0.0001]
    triangle_right = [tower["geometry"]["coordinates"][0] + 0.0001, tower["geometry"]["coordinates"][1] - 0.0001]

    tower_poly = {
        "type": "Feature",
        "properties": {
            "name": tower["properties"]["name"],
            "description": tower["properties"]["description"],
            "color": tower["properties"]["color"],
            "height": tower["properties"]["height"]
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[triangle_top, triangle_left, triangle_right, triangle_top]]
        }
    }

    tower_polygons["features"].append(tower_poly)


dump(tower_polygons, open("../../website/spa_react_javascript_hello-world-basic-authentication-with-api-integration/src/components/decoms_polygons.geojson", "w"))