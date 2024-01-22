import requests
from oauthlib.oauth2 import BackendApplicationClient
from requests_oauthlib import OAuth2Session

# Your client credentials
client_id = 'sh-ab15c4e1-32e4-4cd0-8105-18b495d02b0c'
client_secret = 'tkkIaIzMkaRsaes999isP0u6lJzvpoBi'

# Create a session
client = BackendApplicationClient(client_id=client_id)
oauth = OAuth2Session(client=client)

# Get token for the session
token = oauth.fetch_token(token_url='https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
                          client_secret=client_secret, include_client_id=True)

evalscript = """
//VERSION=3
function setup() {
  return {
    input: ["B02", "B03", "B04"],
    output: { bands: 3 },
  }
}

function evaluatePixel(sample) {
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02]
}
"""

# ISO-8601 formatted time intervals
def get_image(bbox: list, time_range: list):
    request = {
        "input": {
            "bounds": {
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/3857"},
                "bbox": [
                    bbox[0],
                    bbox[1],
                    bbox[2],
                    bbox[3],
                ],
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": time_range[0],
                            "to": time_range[1], 
                        }
                    },
                }
            ],
        },
        "output": {
            "width": 256,
            "height": 256,
        },
        "evalscript": evalscript,
    }

    url = "https://sh.dataspace.copernicus.eu/api/v1/process"

    resp = oauth.post(url, json=request)
    return resp.content

if __name__ == '__main__':
    bbox = [-9223809.077228788,4287811.538685247,-9221363.092323663,4290257.523590371

]
    
    timerange = ["2024-01-01T00:00:00Z", "2024-01-22T00:00:00Z"]

    image = get_image(bbox, timerange)
    
    with open("image.png", "wb") as f:
        f.write(image)
