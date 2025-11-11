import psycopg2
from math import sin, cos, sqrt
import re
import random
from datetime import datetime


# db initialization
connection = psycopg2.connect(user="postgres", password="postgres_2034", dbname="fccdata", host="localhost", port="5432")
fcccursor = connection.cursor()

try:
    fcccursor.execute("CREATE EXTENSION postgis;")
    connection.commit()
    fcccursor.execute("CREATE EXTENSION postgis_topology;")
    connection.commit()
except Exception:
    connection.rollback()
    pass

# declarations
tower_declaration = "st_x    |       st_y        | record_type | content_indicator | file_number | registration_number | unique_system_identifier | coordinate_type | latitude_degrees | latitude_minutes | latitude_seconds | latitude_direction | latitude_total_seconds | longitude_degrees | longitude_minutes | longitude_seconds | longitude_direction | longitude_total_seconds | array_tower_position | array_total_tower | record_type2 | content_indicator2 | file_number2 | registration_number2 | unique_system_identifier2 | application_purpose | previous_purpose | input_source_code | status_code | date_entered | date_received | date_issued | date_constructed | date_dismantled | date_action | archive_flag_code | version | signature_first_name | signature_middle_initial | signature_last_name | signature_suffix |       signature_title       | invalid_signature |      structure_street_address       | structure_city | structure_state_code | county_code | zip_code | height_of_structure | ground_elevation | overall_height_above_ground | overall_height_amsl | structure_type | date_faa_determination_issued | faa_study_number | faa_circular_number | specification_option | painting_and_lighting | mark_light_code | mark_light_other | faa_emi_flag | nepa_flag | date_signed | signature_last_or | signature_first_or | signature_mi_or | signature_suffix_or | title_signed_or | date_signed_or |                   location_point"
tower_declaration = tower_declaration.replace(" ", "").split("|")
tower_types = {"B": "Building", "BANT": "Building with Antenna on top", "BMAST": "Building with Mast", "BPIPE": "Building with Pipe", "BPOLE": "Building with Pole", "BRIDG": "Bridge", "BTWR": "Building with Tower", "GTOWER": "Guyed Structure Used for Communication", "LTOWER": "Lattice Tower", "MAST": "Mast", "MTOWER": "Monopole", "PIPE": "Any type of Pipe", "POLE": "Any type of Pole", "RIG": "Oil or other type of Rig", "SIGN": "Any Type of Sign or Billboard", "SILO": "Any type of Silo", "STACK": "Smoke Stack", "TANK": "Any type of Tank (Water, Gas, etc)", "TOWER": "Free standing or Guyed Structure", "TREE": "When used as a support for an antenna", "UPOLE": "Utility Pole/Tower used to provide power", "UTOWER": "Unguyed - Free Standing Tower"}

tv_declaration = "st_x        |        st_y        | ant_input_pwr | ant_max_pwr_gain | ant_polarization | antenna_id | antenna_type | application_id | asrn_na_ind |  asrn   | aural_freq | avg_horiz_pwr_gain | biased_lat | biased_long | border_code | carrier_freq | docket_num | effective_erp | electrical_deg |  elev_amsl  | elev_bldg_ag | eng_record_type | fac_zone | facility_id | freq_offset | gain_area | haat_rc_mtr | hag_overall_mtr | hag_rc_mtr | horiz_bt_erp | lat_deg | lat_dir | lat_min |  lat_sec  | lon_deg | lon_dir | lon_min |  lon_sec  | loss_area | max_ant_pwr_gain | max_erp_dbk | max_erp_kw  |  max_haat  | mechanical_deg | multiplexor_loss | power_output_vis_dbk | power_output_vis_kw | predict_coverage_area | predict_pop | terrain_data_src_other | terrain_data_src | tilt_towards_azimuth |  true_deg  | tv_dom_status | upperband_freq | vert_bt_erp| visual_freq | vsd_service | rcamsl_horiz_mtr | ant_rotation | input_trans_line | max_erp_to_hor | trans_line_loss | lottery_group | analog_channel | lat_whole_secs | lon_whole_secs | max_erp_any_angle | station_channel | lic_ant_make | lic_ant_model_num  | dt_emission_mask | whatisthiscol1 | whatisthiscol2 | last_change_date |location_point                   "
tv_declaration = tv_declaration.replace(" ", "").split("|")
tv_frequencies = {2:60, 3:66, 4:72, 5:82, 6:88, 7:180, 8:186, 9:192, 10:198, 11:204, 12:210, 13:216, 14:476, 15:482, 16:488, 17:494, 18:500, 19:506, 20:512, 21:518, 22:524, 23:530, 24:536, 25:542, 26:548, 27:554, 28:560, 29:566, 30:572, 31:578, 32:584, 33:590, 34:596, 35:602, 36:608, 37:614, 38:620, 39:626, 40:632, 41:638, 42:644, 43:650, 44:656, 45:662, 46:668, 47:674, 48:680, 49:686, 50:692, 51:698, 52:704, 53:710, 54:716, 55:722, 56:728, 57:734, 58:740, 59:746, 60:752, 61:758, 62:764, 63:770, 64:776, 65:782, 66:788, 67:794, 68:800, 69:806}

fm_declaration = "st_x        |       st_y        | antenna_id | antenna_type | ant_input_pwr | ant_max_pwr_gain | ant_polarization | ant_rotation | application_id | asd_service | asrn | asrn_na_ind |     biased_lat     |    biased_long     | border_code | border_dist | docket_num | effective_erp | elev_amsl | eng_record_type | erp_w | facility_id | fm_dom_status | gain_area | haat_horiz_calc_ind | haat_horiz_rc_mtr | haat_vert_rc_mtr | hag_horiz_rc_mtr | hag_overall_mtr | hag_vert_rc_mtr | horiz_bt_erp | horiz_erp |    last_update_date     | lat_deg | lat_dir | lat_min | lat_sec | lic_ant_make | lic_ant_model_num | lon_deg | lon_dir | lon_min | lon_sec | loss_area |     mainkey      | market_group_num | max_haat | max_horiz_erp | max_vert_erp | min_horiz_erp | num_sections | power_output_vis_kw | rcamsl_horiz_mtr | rcamsl_vert_mtr | spacing | station_channel | station_class | trans_power_output | trans_power_output_w | vert_bt_erp | vert_erp |                   location_point                   "
fm_declaration = fm_declaration.replace(" ", "").split("|")
fm_frequencies = {200: 87.9, 226: 93.1, 251: 98.1, 276: 103.1, 201: 88.1, 227: 93.3, 252: 98.3, 277: 103.3, 202: 88.3, 228: 93.5, 253: 98.5, 278: 103.5, 203: 88.5, 229: 93.7, 254: 98.7, 279: 103.7, 204: 88.7, 230: 93.9, 255: 98.9, 280: 103.9, 205: 88.9, 231: 94.1, 256: 99.1, 281: 104.1, 206: 89.1, 232: 94.3, 257: 99.3, 282: 104.3, 207: 89.3, 233: 94.5, 258: 99.5, 283: 104.5, 208: 89.5, 234: 94.7, 259: 99.7, 284: 104.7, 209: 89.7, 235: 94.9, 260: 99.9, 285: 104.9, 210: 89.9, 236: 95.1, 261: 100.1, 286: 105.1, 211: 90.1, 237: 95.3, 262: 100.3, 287: 105.3, 212: 90.3, 238: 95.5, 263: 100.5, 288: 105.5, 213: 90.5, 239: 95.7, 264: 100.7, 289: 105.7, 214: 90.7, 240: 95.9, 265: 100.9, 290: 105.9, 215: 90.9, 241: 96.1, 266: 101.1, 291: 106.1, 216: 91.1, 242: 96.3, 267: 101.3, 292: 106.3, 217: 91.3, 243: 96.5, 268: 101.5, 293: 106.5, 218: 91.5, 244: 96.7, 269: 101.7, 294: 106.7, 219: 91.7, 245: 96.9, 270: 101.9, 295: 106.9, 220: 91.9, 246: 97.1, 271: 102.1, 296: 107.1, 221: 92.1, 247: 97.3, 272: 102.3, 297: 107.3, 222: 92.3, 248: 97.5, 273: 102.5, 298: 107.5, 223: 92.5, 249: 97.7, 274: 102.7, 299: 107.7, 224: 92.7, 250: 97.9, 275: 102.9, 300: 107.9, 225: 92.9}
fm_classes = {"A": 6, "B1": 25, "B": 50, "C3": 25, "C2": 50, "C1": 100, "C0": 100, "C": 100}

am_declaration = "st_x | st_y | am_dom_status | ant_dir_ind | ant_mode | any_sys_id | application_id | aug_count | augmented_ind | bad_data_switch | biased_lat | biased_long | domestic_pattern | dummy_data_switch | efficiency_restricted | efficiency_theoretical | eng_record_type | feed_circ_other | feed_circ_type | grandfathered_ind | hours_operation | last_update_date | lat_deg | lat_dir | lat_min | lat_sec | lat_whole_secs | lon_deg | lon_dir | lon_min | lon_sec | lon_whole_secs | mainkey | power | q_factor | q_factor_custom_ind | rms_augmented | rms_standard | rms_theoretical | specified_hrs_range | tower_count | location_point "
am_declaration = am_declaration.replace(" ", "").split("|")
am_hours = {"U": "Unlimited", "N": "Nighttime", "D": "Daytime", "C": "Critical Hours", "R": "Canadian Restricted", "P": "Pre-sunrise"}

uls_declaration = "st_x        |        st_y        | record_type | unique_system_identifier | uls_file_number | ebf_number | call_sign  | location_action_performed | location_type_code | location_class_code | location_number | site_status | corresponding_fixed_location |                           location_address                           |  location_city  | location_county | location_state | radius_of_operation | area_of_operation_code | clearance_indicator | ground_elevation | lat_degrees | lat_minutes | lat_seconds | lat_direction | long_degrees | long_minutes | long_seconds | long_direction | max_lat_degrees | max_lat_minutes | max_lat_seconds | max_lat_direction | max_long_degrees | max_long_minutes | max_long_seconds | max_long_direction | nepa | quiet_zone_notification_date | tower_registration_number | height_of_support_structure | overall_height_of_structure | structure_type | airport_id |    location_name     | units_hand_held | units_mobile | units_temp_fixed | units_aircraft | units_itinerant | status_code | status_date | earth_agree | uls_datatype | location_point"
uls_declaration = uls_declaration.replace(" ", "").split("|")



def get_tower_description(tower_type: str):
    if tower_type in tower_types.keys():
        return tower_types[tower_type]

    elif tower_type.endswith("NGTANN"):
        return "Guyed Tower Array with " + tower_type[0] + " towers"
    elif tower_type.endswith("NLTANN"):
        return "Lattice Tower Array with " + tower_type[0] + " towers"
    elif tower_type.endswith("NMTANN"):
        return "Monopole Array with " + tower_type[0] + " towers"
    elif tower_type.endswith("NTANN"):
        return "Antenna Tower Array with " + tower_type[0] + " towers"
    elif len(tower_type) > 5 and tower_type.endswith("TOWER"):
        return "Multiple Structures with " + tower_type[0] + " towers"
    else:
        group = re.search("[0-9]TA[0-9]", tower_type)
        if group:
            return "Tower #" + group.group()[-1] + " in array of " + group.group()[0] + " antenna towers"
    
        group = re.search("[0-9]GTA[0-9]", tower_type)
        if group:
            return "Guyed Tower #" + group.group()[-1] + " in array of " + group.group()[0] + " antenna towers"
        
        group = re.search("[0-9]LTA[0-9]", tower_type)
        if group:
            return "Lattice Tower #" + group.group()[-1] + " in array of " + group.group()[0] + " antenna towers"
        
        group = re.search("[0-9]MTA[0-9]", tower_type)
        if group:
            return "Monopole #" + group.group()[-1] + " in array of " + group.group()[0] + " antenna towers"
    
    return "Unknown Tower Type"

def create_circle_polygon(lat: float, lng: float, radius: float):
    # radius should be in feet
    polygon_coordinates = []
    for i in range(0, 360, 5):
        polygon_coordinates.append([lng + radius * cos(i), lat + radius * sin(i)])
    return polygon_coordinates


def retrieve_fcc_towers(lat: float, lng: float, radius: float):
    # radius should be in feet
    querystring = f"SELECT ST_X(ST_Transform(location_point, 4326)), ST_Y(ST_Transform(location_point, 4326)), * FROM asr_locations WHERE status_code = 'C' AND ST_Dwithin(ST_Transform(ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 2877), location_point, {radius});"
    fcccursor.execute(querystring)
    return fcccursor.fetchall()

def retrieve_fcc_antennas(lat: float, lng: float, radius: float, table: str):
    # radius should be in feet
    querystring = f"SELECT ST_X(ST_Transform(location_point, 4326)), ST_Y(ST_Transform(location_point, 4326)), * FROM {table} WHERE eng_record_type = 'C' AND ST_Dwithin(ST_Transform(ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 2877), location_point, {radius});"
    fcccursor.execute(querystring)
    return fcccursor.fetchall()

def retrieve_fcc_uls_antenna_data(lat: float, lng: float, radius: float, table: str):
    # radius should be in feet
    querystring = f"SELECT ST_X(ST_Transform(location_point, 4326)), ST_Y(ST_Transform(location_point, 4326)), * FROM {table} WHERE ST_Dwithin(ST_Transform(ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), 2877), location_point, {radius});"
    fcccursor.execute(querystring)
    return fcccursor.fetchall()

def calculate_safe_zone(kilowatts: float, gain: int, freq: float, ground_reflections: bool):
    # frequency should be in MHz
    if ground_reflections:
        gf = .64
    else:
        gf = .25

    power = 1000 * 1000 * kilowatts

    eirp = power * pow(10, (gain/10))

    if freq < 1.34:
        # Below 1.34 MHz
        std1 = 100.0
        std2 = 100.0
    elif freq < 3.0:
        # Below 3.0 MHz
        std1 = 100.0
        std2 = 180.0 / (pow(freq,2))
    elif freq < 30.0:
        # Below 30 MHz
        std1 = 900.0 / pow(freq,2)
        std2 = 180.0 / (pow(freq,2))
    elif freq < 300.0:
        # Below 300 MHz
        std1 = 1.0
        std2 = 0.2
    elif freq < 1500.0:
        # Below 1500 MHz
        std1 = freq / 300.0
        std2 = freq / 1500.0
    elif freq < 100000.0:
        # Below 100 GHz
        std1 = 5.0
        std2 = 1.0
    else:
        # Frequency too high
        return None
    
    dx1 = sqrt((gf * eirp)/(std1 * 3.14159))
    dx1 = dx1/30.48
    dx1 = ((dx1 * 10) + 0.5) / 10
    dx2 = sqrt((gf * eirp)/(std2 * 3.14159))
    dx2 = dx2/30.48
    dx2 = ((dx2 * 10) + 0.5) / 10

    return {
        "safe_distance_controlled_feet": round(dx1, 4),
        "safe_distance_uncontrolled_feet": round(dx2, 4)
    }

def retrieve_fcc_tower_objects(lat: float, lng: float, radius: float):
    offset = 0.0001
    results = retrieve_fcc_towers(lat, lng, radius) #feet

    # parse results
    towers_polygons = {"type": "FeatureCollection",
                      "features": []
                     }

    towers_points = {"type": "FeatureCollection",
                        "features": []
                        }

    # loop through towers and make geojson objects
    for tower in results:
        try:
            overall_height = float(tower[tower_declaration.index("overall_height_above_ground")])
        except ValueError:
            overall_height = 0

        try:
            height_support = float(tower[tower_declaration.index("height_of_structure")])
        except ValueError:
            height_support = 0


        # circular shapes
        # PIPE, POLE, SILO, STACK, TANK, TREE, UPOLE, MTOWER, []NMTANN
        # we can't really get a circle so let's just do an octogon
        if tower[tower_declaration.index("structure_type")] in ["PIPE", "POLE", "SILO", "STACK", "TANK", "TREE", "UPOLE", "MTOWER"] or tower[tower_declaration.index("structure_type")].endswith("NMTANN"):
            polygon_coordinates = create_circle_polygon(tower[tower_declaration.index("st_y")], tower[tower_declaration.index("st_x")], offset/2)
            
            towers_polygons["features"].append({"type": "Feature", "properties": {
                "name": tower[tower_declaration.index("registration_number")],
                "description": "",
                "overall_height": overall_height,
                "height_support": height_support,
                "color": "#BD1313"},
                                    "geometry": {"type": "Polygon", "coordinates":
                                        [polygon_coordinates]
                        }})
                        
        # square shapes
        # B, BANT, BMAST, BPIPE, BPOLE, BTWR, RIG, SIGN, BRIDGE
        elif tower[tower_declaration.index("structure_type")] in ["B", "BANT", "BMAST", "BPIPE", "BPOLE", "BTWR", "RIG", "SIGN", "BRIDGE"]:
            polygon_coordinates = [[tower[tower_declaration.index("st_x")] + offset, tower[tower_declaration.index("st_y")] + offset], # 1 1
                                    [tower[tower_declaration.index("st_x")] - offset, tower[tower_declaration.index("st_y")] + offset], # -1 1
                                    [tower[tower_declaration.index("st_x")] - offset, tower[tower_declaration.index("st_y")] - offset], # -1 -1
                                    [tower[tower_declaration.index("st_x")] + offset, tower[tower_declaration.index("st_y")] - offset], # 1 -1
                                    ]
            
            towers_polygons["features"].append({"type": "Feature", "properties": {
                "name": tower[tower_declaration.index("registration_number")],
                "description": "",
                "overall_height": overall_height,
                "height_support": height_support,
                "color": "#6813bd"},
                                    "geometry": {"type": "Polygon", "coordinates":
                                        [polygon_coordinates]
                        }})
        
        # triangular shapes for everything else
        else:
            polygon_coordinates = [[tower[tower_declaration.index("st_x")], tower[tower_declaration.index("st_y")] + offset],
                                [tower[tower_declaration.index("st_x")] - offset, tower[tower_declaration.index("st_y")] - offset],
                                [tower[tower_declaration.index("st_x")] + offset, tower[tower_declaration.index("st_y")] - offset],
                                ]
            
            towers_polygons["features"].append({"type": "Feature", "properties": {
                "name": tower[tower_declaration.index("registration_number")],
                "description": "",
                "overall_height": overall_height,
                "height_support": height_support,
                "color": "#1370bd"},
                                    "geometry": {"type": "Polygon", "coordinates":
                                        [polygon_coordinates]
                        }})

        towers_points["features"].append({"type": "Feature", "properties": {
            "name": tower[tower_declaration.index("registration_number")],
            "description": "",
            "overall_height": overall_height,
            "height_support": height_support,
            "structure_type": tower[tower_declaration.index("structure_type")] + " - " + get_tower_description(tower[tower_declaration.index("structure_type")]),
            "color": towers_polygons["features"][-1]["properties"]["color"]},
                                "geometry": {"type": "Point", "coordinates":
                                    [tower[tower_declaration.index("st_x")], tower[tower_declaration.index("st_y")]]
                    }})
        
    
    return towers_polygons, towers_points



def retrieve_fcc_tv_antennas(lat: float, lng: float, radius: float):
    # radius should be in feet
    antennas = retrieve_fcc_antennas(lat, lng, radius, "tv_locations")

    antennas_out = []

    for antenna in antennas:
        try:
            safe_distances = calculate_safe_zone(float(antenna[tv_declaration.index("effective_erp")]), 0, tv_frequencies[int(antenna[tv_declaration.index("station_channel")])], False)
        except ValueError:
            safe_distances = {"safe_distance_controlled_feet": -1, "safe_distance_uncontrolled_feet": -1}

        polarity = antenna[tv_declaration.index("ant_polarization")]

        if polarity == "C":
            polarity = "Circular"
        elif polarity == "E":
            polarity = "Elliptical"
        elif polarity == "H":
            polarity = "Horizontal"
        else:
            polarity = "?"

        try:
            height = float(antenna[tv_declaration.index("hag_overall_mtr")]) * 3.28084
        except ValueError:
            height = 0

        try:
            erp_kw = float(antenna[tv_declaration.index("effective_erp")])
        except ValueError:
            erp_kw = 0

        antennas_out.append({
            "lat": antenna[tv_declaration.index("st_y")],
            "lng": antenna[tv_declaration.index("st_x")],
            "facility_id": antenna[tv_declaration.index("facility_id")],
            "effective_erp": erp_kw,
            "channel": antenna[tv_declaration.index("station_channel")],
            "polarization": polarity,
            "safe_distance_controlled_feet": safe_distances["safe_distance_controlled_feet"],
            "safe_distance_uncontrolled_feet": safe_distances["safe_distance_uncontrolled_feet"],
            "height_agl": height,
            "status": antenna[tv_declaration.index("tv_dom_status")],
            "last_update": antenna[tv_declaration.index("last_change_date")].split(" ")[0],
            "RabbitEars": "https://www.rabbitears.info/market.php?request=station_search&callsign=" + antenna[tv_declaration.index("facility_id")]
        })

    # only output antennas with a unique facility_id, if there are multiple with the same, chose the newest one (last_update)
    # create a dictionary with the facility_id as the key
    antennas_dict = {}
    for antenna in antennas_out:
        if antennas_dict.get(antenna["facility_id"]):
            # convert last_update to datetime
            # 05/16/2023
            if datetime.strptime(antenna["last_update"], "%m/%d/%Y") > datetime.strptime(antennas_dict[antenna["facility_id"]]["last_update"], "%m/%d/%Y"):
                antennas_dict[antenna["facility_id"]] = antenna
        else:
            antennas_dict[antenna["facility_id"]] = antenna
    
    antennas_out = list(antennas_dict.values())

    return antennas_out

def retrieve_fcc_fm_antennas(lat: float, lng: float, radius: float):
    # radius should be in feet
    antennas = retrieve_fcc_antennas(lat, lng, radius, "fm_locations")
    antennas_out = []
    for antenna in antennas:

        # determining ERP
        erp_kw = 0
        # if we have absolute erp watts, use that..
        if antenna[fm_declaration.index("erp_w")] != "":
            erp_kw = float(antenna[fm_declaration.index("erp_w")]) / 1000
        # otherwise, use the max of the horizontal and vertical erps
        elif antenna[fm_declaration.index("horiz_erp")] != "" and antenna[fm_declaration.index("vert_erp")] != "":
            erp_kw = max(float(antenna[fm_declaration.index("horiz_erp")]), float(antenna[fm_declaration.index("vert_erp")]))
        # else if only one exists
        elif antenna[fm_declaration.index("horiz_erp")] != "":
            erp_kw = float(antenna[fm_declaration.index("horiz_erp")])
        elif antenna[fm_declaration.index("vert_erp")] != "":
            erp_kw = float(antenna[fm_declaration.index("vert_erp")])
        # if none of these are present, use the max ERP that the station class can transmit
        else:
            erp_kw = fm_classes[antenna[fm_declaration.index("station_class")]]

        try:
            erp_kw = float(erp_kw)
        except ValueError:
            erp_kw = 0


        # calculate safe distances
        try:
            safe_distances = calculate_safe_zone(erp_kw, 0, fm_frequencies[int(antenna[fm_declaration.index("station_channel")])], False)
        except ValueError:
            safe_distances = {"safe_distance_controlled_feet": -1, "safe_distance_uncontrolled_feet": -1}

        polarity = antenna[fm_declaration.index("ant_polarization")]

        if polarity == "C":
            polarity = "Circular"
        elif polarity == "E":
            polarity = "Elliptical"
        elif polarity == "H":
            polarity = "Horizontal"
        else:
            polarity = "?"

        try:
            height = float(antenna[fm_declaration.index("hag_overall_mtr")]) * 3.28084
        except ValueError:
            height = 0

        try:
            channel = str(fm_frequencies[int(antenna[fm_declaration.index("station_channel")])]) + " MHz"
        except ValueError:
            channel = antenna[fm_declaration.index("station_channel")]
        except KeyError:
            channel = "?"
        
        antennas_out.append({
            "lat": antenna[fm_declaration.index("st_y")],
            "lng": antenna[fm_declaration.index("st_x")],
            "facility_id": antenna[fm_declaration.index("facility_id")],
            "effective_erp": erp_kw,
            "channel": channel,
            "polarization": polarity,
            "safe_distance_controlled_feet": safe_distances["safe_distance_controlled_feet"],
            "safe_distance_uncontrolled_feet": safe_distances["safe_distance_uncontrolled_feet"],
            "height_agl": height,
            "status": antenna[fm_declaration.index("fm_dom_status")],
            "last_update": antenna[fm_declaration.index("last_update_date")].split(" ")[0],
        })

    # only output antennas with a unique facility_id, if there are multiple with the same, chose the newest one (last_update)
    # create a dictionary with the facility_id as the key
    antennas_dict = {}
    for antenna in antennas_out:
        if antennas_dict.get(antenna["facility_id"]):
            # convert last_update to datetime
            # 05/16/2023
            if datetime.strptime(antenna["last_update"], "%Y-%m-%d") > datetime.strptime(antennas_dict[antenna["facility_id"]]["last_update"], "%Y-%m-%d"):
                antennas_dict[antenna["facility_id"]] = antenna
        else:
            antennas_dict[antenna["facility_id"]] = antenna
    
    antennas_out = list(antennas_dict.values())

    return antennas_out

def retrieve_fcc_am_antennas(lat: float, lng: float, radius: float):
    antennas = retrieve_fcc_antennas(lat, lng, radius, "am_locations")
    antennas_out = []

    for antenna in antennas:
        antennas_out.append({
            "lat": antenna[am_declaration.index("st_y")],
            "lng": antenna[am_declaration.index("st_x")],
            "appid": antenna[am_declaration.index("application_id")],
            "towers_in_array": antenna[am_declaration.index("tower_count")],
            "nominal_power": antenna[am_declaration.index("power")],
            "status": antenna[am_declaration.index("am_dom_status")],
            "last_update": antenna[am_declaration.index("last_update_date")].split(" ")[0],
            "hours_operation": am_hours[antenna[am_declaration.index("hours_operation")]],
        })

    return antennas_out

def retrieve_fcc_uls_antennas(lat: float, lng: float, radius: float):
    antennas = retrieve_fcc_uls_antenna_data(lat, lng, radius, "uls_locations")
    antennas_out = []

    for antenna in antennas:
        antennas_out.append({
            "lat": antenna[uls_declaration.index("st_y")],
            "lng": antenna[uls_declaration.index("st_x")],
            "call_sign": antenna[uls_declaration.index("call_sign")],
            "uls_type": antenna[uls_declaration.index("uls_datatype")],
            "type": convertUlsDatatype(antenna[uls_declaration.index("uls_datatype")]),
            "height_agl": antenna[uls_declaration.index("ground_elevation")],
        })

    return antennas_out

def convertUlsDatatype(dataType):
    if(dataType == "cell"):
        return "Cellular"
    if(dataType == "coast"):
        return "Maritime Coast & Aviation Ground"
    if(dataType == "LMbcast"):
        return "Land Mobile - Broadcast Auxiliary"
    if(dataType == "LMcomm"):
        return "Land Mobile - Commercial"
    if(dataType == "LMpriv"):
        return "Land Mobile - Private"
    if(dataType == "market"):
        return "Market Based Services"
    if(dataType == "micro"):
        return "Microwave"
    if(dataType == "paging"):
        return "Paging"
    if(dataType == "mdsitfs"):
        return "BRS & EBS (Formerly known as MDS/ITFS)"
    return "Unknown ULS Data Type"

def retrieve_fcc_antenna_objects(lat, lng, radius, uls=False):
    # geojson output
    antennas = {"type": "FeatureCollection",
                        "features": []
                        }

    # retrieve antennas
    tv_antennas = retrieve_fcc_tv_antennas(lat, lng, radius) #feet
    fm_antennas = retrieve_fcc_fm_antennas(lat, lng, radius) #feet
    am_antennas = retrieve_fcc_am_antennas(lat, lng, radius) #feet

    if(uls):
        uls_antennas = retrieve_fcc_uls_antennas(lat, lng, radius) #feet
        for antenna in uls_antennas:
            antennas["features"].append({"type": "Feature", "properties": {
                "data_type": "ULS",
                "name": antenna["uls_type"] + " " + antenna["call_sign"],
                "description": "",
                "transmitter_type": antenna["type"],
                "facility_id": antenna["call_sign"],
                "erp": 0,
                "color": "#ffffff"},
                "geometry": {"type": "Point", "coordinates":
                                        [antenna["lng"], antenna["lat"]]
                        }})

    # loop through antennas and add to geojson
    for antenna in tv_antennas:
        antennas["features"].append({"type": "Feature", "properties": {
            "name": antenna["facility_id"],
            "description": "",
            "transmitter_type": "TV",
            "height_agl": antenna["height_agl"],
            "RabbitEars": antenna["RabbitEars"],
            "status": antenna["status"],
            "last_update": antenna["last_update"],
            "erp": antenna["effective_erp"],
            "polarization": antenna["polarization"],
            "facility_id": antenna["facility_id"],
            "channel": antenna["channel"],
            "safe_distance_controlled_feet": antenna["safe_distance_controlled_feet"],
            "safe_distance_uncontrolled_feet": antenna["safe_distance_uncontrolled_feet"],
            "color": "#d66400"},
            "geometry": {"type": "Point", "coordinates":
                                    [antenna["lng"], antenna["lat"]]
                    }})

    for antenna in fm_antennas:    
        antennas["features"].append({"type": "Feature", "properties": {
            "name": antenna["facility_id"],
            "description": "",
            "transmitter_type": "FM",
            "height_agl": antenna["height_agl"],
            "status": antenna["status"],
            "last_update": antenna["last_update"],
            "erp": antenna["effective_erp"],
            "polarization": antenna["polarization"],
            "facility_id": antenna["facility_id"],
            "channel": antenna["channel"],
            "safe_distance_controlled_feet": antenna["safe_distance_controlled_feet"],
            "safe_distance_uncontrolled_feet": antenna["safe_distance_uncontrolled_feet"],
            "color": "#9200d6"},
            "geometry": {"type": "Point", "coordinates":
                                    [antenna["lng"], antenna["lat"]]
                    }})
        
    for antenna in am_antennas:
        antennas["features"].append({"type": "Feature", "properties": {
            "name": "AM " + antenna["appid"],
            "description": "",
            "transmitter_type": "AM",
            "status": antenna["status"],
            "last_update": antenna["last_update"],
            "erp": float(antenna["nominal_power"]),
            "facility_id": antenna["appid"],
            "hours_operation": antenna["hours_operation"],
            "towers_in_array": antenna["towers_in_array"],
            "color": "#000000"},
            "geometry": {"type": "Point", "coordinates":
                                    [antenna["lng"], antenna["lat"]]
                    }})


    # if we have any antennas that are within 5 feet of eachother, we should displace them to 10 feet apart
    # this is to prevent overlapping antennas from being on top of eachother
    # 47.4622422504934, -120.35777773708105
    # change-^^-polling
    
    # for antenna in antennas, if two antennas have the same coords (round to 5 decimal places), move one of them
    changer = 1
    for i in range(len(antennas["features"])):
        for j in range(i+1, len(antennas["features"])):
            if round(antennas["features"][i]["geometry"]["coordinates"][0], 5) == round(antennas["features"][j]["geometry"]["coordinates"][0], 5) and round(antennas["features"][i]["geometry"]["coordinates"][1], 5) == round(antennas["features"][j]["geometry"]["coordinates"][1], 5):
                changer += 1

                # if we have an odd number, move the antenna to the right
                if changer%2 == 1:
                    antennas["features"][j]["geometry"]["coordinates"][0] += changer * 0.00003

                # if we have an even number, move the antenna to the left
                else:
                    antennas["features"][j]["geometry"]["coordinates"][0] -= changer * 0.00003
    
    # sort antennas by power output, this way if there are multiple antennas at the same location, the most powerful one will be displayed
    antennas["features"].sort(key=lambda x: x["properties"]["erp"], reverse=True)


    return antennas