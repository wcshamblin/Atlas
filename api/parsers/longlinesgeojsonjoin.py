from json import load, dump

long_lines_geojsons = {
    "assets/long-lines/google-map/Earth_Stations.geojson": {"color": "#d1531d", "type": "Earth Station"},
    "assets/long-lines/google-map/Echo_Fox_Combat_CIDERS_GEP.geojson": {"color": "#d1711d", "type": "Echo Fox Combat CIDERS GEP"},
    "assets/long-lines/google-map/IL_IN_KY_MI_MD_NC_OH_PA_VA_WV.geojson": {"color": "#1da7d1", "type": "Regular"},
    "assets/long-lines/google-map/ND_SD_NE_KS_MO_IA_MN_WI_OK_CO.geojson": {"color": "#1da7d1", "type": "Regular"},
    "assets/long-lines/google-map/New_England_States.geojson": {"color": "#1da7d1", "type": "Regular"},
    "assets/long-lines/google-map/Project_Office_Govt_facility.geojson": {"color": "#d11717", "type": "Project Office"},
    "assets/long-lines/google-map/TN_NC_SC_GA_FL_AL_MS_AR_LA_TX.geojson": {"color": "#1da7d1", "type": "Regular"},
    "assets/long-lines/google-map/Underground_Facilities.geojson": {"color": "#4917d1", "type": "Underground Facility"},
    "assets/long-lines/google-map/WA_OR_ID_MT_WY_UT_NV_CA_AZ_NM.geojson": {"color": "#1da7d1", "type": "Regular"},
}


def long_lines_geojson_join():
    geojson_points_out = {
        "type": "FeatureCollection",
        "features": []
    }
    geojson_lines_out = {
        "type": "FeatureCollection",
        "features": []
    }

    for geojson, obj in long_lines_geojsons.items():
        with open(geojson, "r") as f:
            geojson_in = load(f)
            for feature in geojson_in["features"]:
                feature["properties"]["type"] = obj["type"]
                if "description" not in feature["properties"] or feature["properties"]["description"] is None:
                    feature["properties"]["description"] = ""
                if feature["geometry"]["type"] == "Point":
                    feature["properties"]["color"] = obj["color"]
                    geojson_points_out["features"].append(feature)

                elif feature["geometry"]["type"] == "LineString":
                    feature["properties"]["color"] = obj["color"]
                    geojson_lines_out["features"].append(feature)
            # if description isn't present or null, use an empty string
    with open("assets/long-lines/long-lines.geojson", "w") as f:
        dump(geojson_points_out, f, indent=4)

    with open("assets/long-lines/long-lines-linestrings.geojson", "w") as f:
        dump(geojson_lines_out, f, indent=4)

if __name__ == "__main__":
    long_lines_geojson_join()