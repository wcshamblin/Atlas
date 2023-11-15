import psycopg2

connection = psycopg2.connect(user="postgres", password="postgres_2034", dbname="fccdata", host="localhost", port="5432")
faacursor = connection.cursor()


# declarations
obstacle_declaration = "st_x        |        st_y        |         x         |        y         | objectid | oas_number | verified | country | state |       city       |   lat_dms    |   long_dms    |  lat_dd   |  long_dd   |     type_code      | quantity | agl | amsl | lighting | horizontal | vertical | marking |     study      | action |  date   |                   location_point"
obstacle_declaration = obstacle_declaration.replace(" ", "").split("|")

def retrieve_obstacles(lat, lng, radius, minheight=None, maxheight=None):
    print("Lat: ", lat, "Lng: ", lng, "Radius: ", radius, "Minheight: ", minheight, "Maxheight: ", maxheight)
    # querystring = f"SELECT ST_X(ST_Transform(location_point, 4326)), ST_Y(ST_Transform(location_point, 4326)), * FROM asr_locations WHERE status_code = 'C' AND ST_Dwithin(ST_Transform(ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 2877), location_point, {radius});"
    querystring = f"SELECT ST_X(ST_Transform(location_point, 4326)), ST_Y(ST_Transform(location_point, 4326)), * FROM faa_locations WHERE ST_Dwithin(ST_Transform(ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 2877), location_point, {radius})"

    if minheight and maxheight and minheight < maxheight and minheight > 0 and maxheight > 0:
        querystring += "AND agl != '' AND agl::numeric >= 1.0 AND (agl::numeric >= {minheight} AND agl::numeric <= {maxheight})".format(minheight=minheight, maxheight=maxheight)
    querystring += ";"

    faacursor.execute(querystring)
    obstacles = faacursor.fetchall()

    obstacles = [dict(zip(obstacle_declaration, obstacle)) for obstacle in obstacles]

    return obstacles