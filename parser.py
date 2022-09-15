from pykml import parser
from pykml.factory import nsmap

namespace = {"ns": nsmap[None]}

with open("assets/PlacesToExploreWCS.kml") as f:
    root = parser.parse(f).getroot()
    pms = root.findall(".//ns:Placemark", namespaces=namespace)

    for pm in pms:
        styleurl = str(pm.styleUrl).split("-")
        print(str(pm.name).strip(), "#"+styleurl[2], "special" if styleurl[1]=="1502" else "")