from json import load, dump

long_lines_geojsons = {
    "assets/long-lines/google-map/Earth_Stations.geojson": "#d1531d",
    "assets/long-lines/google-map/Echo_Fox_Combat_CIDERS_GEP.geojson": "#d1711d",
    "assets/long-lines/google-map/IL_IN_KY_MI_MD_NC_OH_PA_VA_WV.geojson": "#1da7d1",
    "assets/long-lines/google-map/ND_SD_NE_KS_MO_IA_MN_WI_OK_CO.geojson": "#1da7d1",
    "assets/long-lines/google-map/New_England_States.geojson": "#1da7d1",
    "assets/long-lines/google-map/Project_Office_Govt_facility.geojson": "#d11717",
    "assets/long-lines/google-map/TN_NC_SC_GA_FL_AL_MS_AR_LA_TX.geojson": "#1da7d1",
    "assets/long-lines/google-map/Underground_Facilities.geojson": "#4917d1",
    "assets/long-lines/google-map/WA_OR_ID_MT_WY_UT_NV_CA_AZ_NM.geojson": "#1da7d1"
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

    for geojson, color in long_lines_geojsons.items():
        with open(geojson, "r") as f:
            geojson_in = load(f)
            for feature in geojson_in["features"]:
                if feature["geometry"]["type"] == "Point":
                    feature["properties"]["color"] = color
                    geojson_points_out["features"].append(feature)

                elif feature["geometry"]["type"] == "LineString":
                    feature["properties"]["color"] = color
                    geojson_lines_out["features"].append(feature)
        
    with open("assets/long-lines/long-lines.geojson", "w") as f:
        dump(geojson_points_out, f, indent=4)

    with open("assets/long-lines/long-lines-linestrings.geojson", "w") as f:
        dump(geojson_lines_out, f, indent=4)

if __name__ == "__main__":
    long_lines_geojson_join()