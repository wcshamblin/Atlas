from json import load
from classes import Point
from database import add_pte_point


#     {
#         "type": "Feature",
#         "properties": {
#             "Name": "Cape Fear Trestle",
#             "description": null,
#             "gx_media_links": null,
#             "color": "#673AB7",
#             "special": false,
#             "category": "Bridges"
#         },
#         "geometry": {
#             "type": "Point",
#             "coordinates": [
#                 -79.045938,
#                 35.568646
#             ]
#         }
#     },


with open("assets/placestoexplore/Places_to_Explore_new.geojson", "r") as f:
    # Load the JSON file
    data = load(f)
    # Loop through the JSON file
    for point in data:
        # Create a new Point object
        new_point = Point(owner="",
                          name=point["properties"]["Name"],
                          description=point["properties"]["description"],
                          color=point["properties"]["color"], special=point["properties"]["special"],
                          category=point["properties"]["category"], lat=point["geometry"]["coordinates"][1],
                          lng=point["geometry"]["coordinates"][0])

        # Add the point to the database
        add_pte_point(new_point.to_dict())

    # Close the file
    f.close()
