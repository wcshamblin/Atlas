from json import load, dump
# each cr*_pt.geojson row contains a lot of information we don't need

# { "type": "Feature", "properties": { "OBJECTID": 149914, "CR_ID": "{91BD962F-96E8-49E0-85DD-86D65312C025}", "SURVEY_ID": null, "GEOM_ID": "{EA172C5C-F070-469D-B075-505D08584AFC}", "RESNAME": "Vista Avenue Viaduct", "BND_TYPE": "Arbitrary point", "BND_OTHER": "Point is unspecified coordinate from NPS NRIS", "IS_EXTANT": "Unknown", "EXTANT_OTH": "Feature is likely but not guaranteed to be extant.  Feature was created as part of batch process from NRIS and status needs to be confirmed individually.", "CONTRIBRES": "Unknown", "RESTRICT_": "Unrestricted", "SOURCE": "National Register of Historic Places -- National Park Service", "SRC_DATE": "1984-04-26T00:00:00Z", "SRC_SCALE": "1:24000", "SRC_ACCU": "+/- 12 meters", "VERT_ERROR": "Not Applicable", "SRC_COORD": "Coordinates are typically provided in UTM format, and datum is assumed GCS_North_American_1927 except for sites in certain locations such as Pacifc Ocean islands.", "MAP_METHOD": "Derived by XY event point or centroid generation", "MAP_MTH_OT": "Coordinates are extracted directly from NPS NRIS and processed from assumed coordinate systems based upon location and CERTDATE via XY Event layers into WGS 84 system.  In some instances, clearly incorrect location data has been manually adjusted.", "CREATEDATE": "2012-08-01T00:00:00Z", "EDIT_DATE": "2012-08-17T00:00:00Z", "EDIT_BY": "Matt Stutts, NPS, Cultural Resources GIS", "ORIGINATOR": "National Register of Historic Places -- National Park Service", "CONSTRANT": "Extant status and datum information for resource not recorded by source; coordinate pairs used to generate points not checked for accuracy by source", "CR_NOTES": null, "ALPHA_CODE": null, "UNIT_CODEO": null, "UNIT": null, "UNIT_OTHER": null, "UNIT_TYPE": null, "GROUP_CODE": null, "REG_CODE": null, "META_MIDF": null, "NR_PROPERTYID": "84003093", "GlobalID": "{BD345312-4319-4593-824F-B20CF4CE9172}" }, "geometry": { "type": "Point", "coordinates": [ -122.697887683999966, 45.519205070000055 ] } },

# We only care about:
desirable_properties =  ["OBJECTID", "RESNAME", "IS_EXTANT", "EXTANT_OTH", "SRC_DATE", "SRC_ACCU", "CREATEDATE", "EDIT_DATE"]


files = ["crbldg_pt.geojson", "crdist_pt.geojson", "crobj_pt.geojson", "crsite_pt.geojson", "crstru_pt.geojson"]

geojson = {'type': 'FeatureCollection', 'features': []}


for file in files:
    type = None
    color = None
    if file == "crbldg_pt.geojson":
        type = "Building"
        color = "#c73a3a"
    elif file == "crdist_pt.geojson":
        type = "District"
        color = "#3a7ac7"
    elif file == "crobj_pt.geojson":
        type = "Object"
        color = "#3a54c7"
    elif file == "crsite_pt.geojson":
        type = "Site"
        color = "#c77e3a"
    elif file == "crstru_pt.geojson":
        type = "Structure"
        color = "#3ac77e"
    else:
        print("ERROR: unknown file type")
        exit(1)


    data = load(open(file))    
    geojson["crs"] = data["crs"]

    for feature in data["features"]:
        geojson["features"].append({
            "type": "Feature",
            "properties": {
                "type": type,
                "color": color,
                "object_id": feature["properties"]["OBJECTID"],
                "name": feature["properties"]["RESNAME"],
                "is_extant": feature["properties"]["IS_EXTANT"],
                "extant_oth": feature["properties"]["EXTANT_OTH"],
                "src_date": feature["properties"]["SRC_DATE"],
                "location_accuracy": feature["properties"]["SRC_ACCU"],
                "creation_date": feature["properties"]["CREATEDATE"],
                "edit_date": feature["properties"]["EDIT_DATE"]
                }
            ,
            "geometry": feature["geometry"]
            }
        )


outfile = open("nrhp.geojson", "w")

dump(geojson, outfile)