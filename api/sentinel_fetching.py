import datetime
import requests
from oauthlib.oauth2 import BackendApplicationClient
from requests_oauthlib import OAuth2Session
from oauthlib.oauth2.rfc6749.errors import TokenExpiredError

def sentinelhub_compliance_hook(response):
    response.raise_for_status()
    return response

# client 1
# sh-ab15c4e1-32e4-4cd0-8105-18b495d02b0c
# tkkIaIzMkaRsaes999isP0u6lJzvpoBi

# client 2
# sh-553b3744-5018-4b06-b8dd-321de62503f1
# c2y4Jod1wv5lM5umDAXAdrWQLGmUVASz

# Your client credentials
client_id = 'sh-553b3744-5018-4b06-b8dd-321de62503f1'
client_secret = 'c2y4Jod1wv5lM5umDAXAdrWQLGmUVASz'

client = BackendApplicationClient(client_id=client_id)
oauth = OAuth2Session(client=client)
token = oauth.fetch_token(token_url='https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
                          client_secret=client_secret, include_client_id=True)

oauth.register_compliance_hook("access_token_response", sentinelhub_compliance_hook)

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
def retrieve_sentinel_image(oauth, url, request):
    resp = oauth.post(url, json=request)
    return resp.content

# ISO-8601 formatted time intervals
def get_sentinel_image(bbox, date, days_range=13, center_window=False):
    # end date is passed in, and start date should be days_range days prior
    # (Sentinel's orbit creates a max 12 day revisit cycle, so default is 13 days)
    # For explicit date selections with center_window=True, center the window around the date
    # to prefer images from that specific date
    if center_window:
        # Center the window around the requested date
        start_dt = date - datetime.timedelta(days=days_range//2)
        end_dt = date + datetime.timedelta(days=days_range//2 + 1)
        startdate = start_dt.strftime("%Y-%m-%dT00:00:00Z")
        enddate = end_dt.strftime("%Y-%m-%dT23:59:59Z")
        print(f"[get_sentinel_image] Centered window: {start_dt.date()} to {end_dt.date()} (requested: {date.date()})")
    else:
        # Default: backward-looking window
        start_dt = date - datetime.timedelta(days=days_range)
        startdate = start_dt.strftime("%Y-%m-%dT00:00:00Z")
        enddate = date.strftime("%Y-%m-%dT00:00:00Z")
        print(f"[get_sentinel_image] Backward window: {start_dt.date()} to {date.date()}")    
    
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
                            "from": startdate,
                            "to": enddate,
                        },
                        "mosaickingOrder": "mostRecent"  # Always prioritize most recent imagery
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

    print(f"[get_sentinel_image] Sending request with timeRange: {startdate} to {enddate}")
    print(f"[get_sentinel_image] mosaickingOrder: {request['input']['data'][0]['dataFilter'].get('mosaickingOrder', 'NOT SET')}")
    
    try:
        resp = oauth.post("https://sh.dataspace.copernicus.eu/api/v1/process", json=request)
        print(f"[get_sentinel_image] Response status: {resp.status_code}, size: {len(resp.content)} bytes")
    except TokenExpiredError as e:
        oauth.fetch_token(token_url='https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
                                  client_secret=client_secret, include_client_id=True)
        resp = oauth.post("https://sh.dataspace.copernicus.eu/api/v1/process", json=request)

    return resp.content

if __name__ == '__main__':
    bbox = [-9223809.077228788,4287811.538685247,-9221363.092323663,4290257.523590371

]
    
    timerange = ["2024-01-01T00:00:00Z", "2024-01-22T00:00:00Z"]

    date = "2024-01-01"
    date = datetime.datetime.strptime(date, "%Y-%m-%d")

    image = get_sentinel_image(bbox, date)
    
    with open("image.png", "wb") as f:
        f.write(image)
