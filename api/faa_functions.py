import psycopg2

connection = psycopg2.connect(user="postgres", password="postgres_2034", dbname="fccdata", host="localhost", port="5432")
faacursor = connection.cursor()

try:
    faacursor.execute("CREATE EXTENSION postgis;")
    connection.commit()
    faacursor.execute("CREATE EXTENSION postgis_topology;")
    connection.commit()
except Exception:
    connection.rollback()
    pass


# declarations
obstacle_declaration = "st_x        |        st_y        |         x         |        y         | objectid | oas_number | verified | country | state |       city       |   lat_dms    |   long_dms    |  lat_dd   |  long_dd   |     type_code      | quantity | agl | amsl | lighting | horizontal | vertical | marking |     study      | action |  date   |                   location_point"
obstacle_declaration = obstacle_declaration.replace(" ", "").split("|")

def retrieve_obstacles(lat, lng, radius):
    geojson_obstacles = {
        "type": "FeatureCollection",
        "features": []
    }

    # querystring = f"SELECT ST_X(ST_Transform(location_point, 4326)), ST_Y(ST_Transform(location_point, 4326)), * FROM asr_locations WHERE status_code = 'C' AND ST_Dwithin(ST_Transform(ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 2877), location_point, {radius});"
    querystring = f"SELECT ST_X(ST_Transform(location_point, 4326)), ST_Y(ST_Transform(location_point, 4326)), * FROM faa_locations WHERE ST_Dwithin(ST_Transform(ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 2877), location_point, {radius});"

    faacursor.execute(querystring)
    obstacles = faacursor.fetchall()

    for obstacle in obstacles:
        obstacle = dict(zip(obstacle_declaration, obstacle))
        obstacle["type"] = "Feature"
        obstacle["geometry"] = {
            "type": "Point",
            "coordinates": [obstacle["st_x"], obstacle["st_y"]]
        }
        obstacle["properties"] = {
            # "x": obstacle["x"],
            # "y": obstacle["y"],
            # "objectid": obstacle["objectid"],
            "oas_number": obstacle["oas_number"],
            # "verified": obstacle["verified"],
            # "country": obstacle["country"],
            # "state": obstacle["state"],
            # "city": obstacle["city"],
            # "lat_dms": obstacle["lat_dms"],
            # "long_dms": obstacle["long_dms"],
            # "lat_dd": obstacle["lat_dd"],
            # "long_dd": obstacle["long_dd"],
            "type_code": obstacle["type_code"],
            # "quantity": obstacle["quantity"],
            "agl": obstacle["agl"],
            "amsl": obstacle["amsl"],
            "lighting": obstacle["lighting"],
            # "horizontal": obstacle["horizontal"],
            # "vertical": obstacle["vertical"],
            "marking": obstacle["marking"],
            "study": obstacle["study"],
            # "action": obstacle["action"],
            "date": obstacle["date"],
            # "location_point": obstacle["location_point"]
        }
        geojson_obstacles["features"].append(obstacle)

    return geojson_obstacles