"""
Enhanced Sentinel imagery fetching with metadata support
This module extends the original sentinel_fetching.py to include metadata retrieval,
particularly cloud cover percentage.
"""

import datetime
import requests
import math
from oauthlib.oauth2 import BackendApplicationClient
from requests_oauthlib import OAuth2Session
from oauthlib.oauth2.rfc6749.errors import TokenExpiredError
from dateutil import parser as dateutil_parser

def sentinelhub_compliance_hook(response):
    response.raise_for_status()
    return response

# Your client credentials
client_id = 'sh-ab15c4e1-32e4-4cd0-8105-18b495d02b0c'
client_secret = 'tkkIaIzMkaRsaes999isP0u6lJzvpoBi'

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


def convert_bbox_3857_to_4326_approximate(bbox_3857):
    """
    Convert from EPSG:3857 (Web Mercator) to EPSG:4326 (WGS84)
    
    Args:
        bbox_3857: [min_x, min_y, max_x, max_y] in EPSG:3857
    
    Returns:
        [min_lon, min_lat, max_lon, max_lat] in EPSG:4326
    """
    def mercator_to_latlon(x, y):
        # Convert x to longitude
        lon = (x / 20037508.34) * 180.0
        
        # Convert y to latitude using inverse Mercator projection
        lat = math.atan(math.sinh(y * math.pi / 20037508.34)) * 180.0 / math.pi
        
        return lon, lat
    
    min_lon, min_lat = mercator_to_latlon(bbox_3857[0], bbox_3857[1])
    max_lon, max_lat = mercator_to_latlon(bbox_3857[2], bbox_3857[3])
    
    return [min_lon, min_lat, max_lon, max_lat]


def search_available_images(bbox_3857, date, max_cloud_cover=100, days_range=13):
    """
    Search for available Sentinel-2 images with metadata including cloud cover.
    
    Args:
        bbox_3857: [min_x, min_y, max_x, max_y] in EPSG:3857 (Web Mercator)
        date: datetime object for the end date
        max_cloud_cover: Maximum acceptable cloud cover percentage (0-100)
        days_range: Number of days to search back from the date
    
    Returns:
        List of available images with metadata, or None if search fails
    """
    # Calculate date range
    end_date = date
    start_date = date - datetime.timedelta(days=days_range)
    
    # Convert bbox to lat/lon for catalog API
    bbox_4326 = convert_bbox_3857_to_4326_approximate(bbox_3857)
    
    catalog_url = "https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search"
    
    search_request = {
        "bbox": bbox_4326,
        "datetime": f"{start_date.strftime('%Y-%m-%dT%H:%M:%SZ')}/{end_date.strftime('%Y-%m-%dT%H:%M:%SZ')}",
        "collections": ["sentinel-2-l2a"],
        "limit": 50,
        "filter": f"eo:cloud_cover <= {max_cloud_cover}"
    }
    
    try:
        response = oauth.post(catalog_url, json=search_request)
        response.raise_for_status()
        result = response.json()
        
        # Extract and format the features
        features = result.get('features', [])
        
        # Sort by cloud cover (ascending) and date (descending)
        # Use dateutil parser to handle variable precision milliseconds
        def sort_key(x):
            try:
                dt = dateutil_parser.parse(x['properties']['datetime'])
                return (x['properties'].get('eo:cloud_cover', 100), -dt.timestamp())
            except:
                # If parsing fails, put it at the end
                return (100, 0)
        
        features.sort(key=sort_key)
        
        return features
        
    except TokenExpiredError:
        oauth.fetch_token(
            token_url='https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
            client_secret=client_secret, 
            include_client_id=True
        )
        # Retry
        response = oauth.post(catalog_url, json=search_request)
        response.raise_for_status()
        result = response.json()
        features = result.get('features', [])
        
        # Sort by cloud cover (ascending) and date (descending)
        def sort_key(x):
            try:
                dt = dateutil_parser.parse(x['properties']['datetime'])
                return (x['properties'].get('eo:cloud_cover', 100), -dt.timestamp())
            except:
                return (100, 0)
        
        features.sort(key=sort_key)
        return features
        
    except Exception as e:
        print(f"Error searching catalog: {e}")
        return None


def get_sentinel_image_with_metadata(bbox, date, max_cloud_cover=100):
    """
    Get Sentinel image along with its metadata.
    This function first searches for available images with acceptable cloud cover,
    then retrieves the best quality image.
    
    Args:
        bbox: [min_x, min_y, max_x, max_y] in EPSG:3857
        date: datetime object for the end date
        max_cloud_cover: Maximum acceptable cloud cover percentage (0-100)
    
    Returns:
        Dictionary with 'image' (bytes) and 'metadata' (dict), or None if no suitable image found
    """
    # First, search for available images
    available_images = search_available_images(bbox, date, max_cloud_cover)
    
    if not available_images:
        print(f"No images found with cloud cover <= {max_cloud_cover}%")
        return None
    
    # Get the best image (lowest cloud cover, most recent)
    best_image = available_images[0]
    metadata = best_image['properties']
    
    print(f"Found {len(available_images)} image(s)")
    print(f"Selected image from {metadata['datetime']} with {metadata['eo:cloud_cover']}% cloud cover")
    
    # Now fetch the actual image using the original process API
    image_data = get_sentinel_image(bbox, date)
    
    return {
        'image': image_data,
        'metadata': metadata,
        'all_available': available_images  # Include all available images for reference
    }


def retrieve_sentinel_image(oauth, url, request):
    """Original function for fetching image"""
    resp = oauth.post(url, json=request)
    return resp.content


def get_sentinel_image(bbox, date):
    """
    Original function to get Sentinel image (without metadata).
    Kept for backward compatibility.
    """
    # end date is passed in, and start date should be 13 days prior (Sentinel's orbit should create a max 12 day revisit cycle)
    startdate = (date - datetime.timedelta(days=13)).strftime("%Y-%m-%dT00:00:00Z")
    enddate = date.strftime("%Y-%m-%dT00:00:00Z")    
    
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

    try:
        resp = oauth.post("https://sh.dataspace.copernicus.eu/api/v1/process", json=request)
    except TokenExpiredError as e:
        oauth.fetch_token(token_url='https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
                                  client_secret=client_secret, include_client_id=True)
        resp = oauth.post("https://sh.dataspace.copernicus.eu/api/v1/process", json=request)

    return resp.content


if __name__ == '__main__':
    # Example usage
    print("="*70)
    print("ENHANCED SENTINEL IMAGE FETCHING WITH METADATA")
    print("="*70)
    
    # Test coordinates (San Francisco area - same as in your original script)
    bbox = [-13580977.876779, 4530594.196425, -13578531.891874, 4533040.181330]
    
    # Date
    date = datetime.datetime(2024, 1, 22)
    
    print(f"\nFetching imagery for date: {date.date()}")
    print(f"Bounding box: {bbox}")
    print(f"Max cloud cover: 50%")
    
    # Get image with metadata
    result = get_sentinel_image_with_metadata(bbox, date, max_cloud_cover=50)
    
    if result:
        print("\n" + "="*70)
        print("RESULTS")
        print("="*70)
        
        print("\nSelected Image Metadata:")
        print(f"  Date/Time: {result['metadata']['datetime']}")
        print(f"  Cloud Cover: {result['metadata']['eo:cloud_cover']}%")
        print(f"  Platform: {result['metadata']['platform']}")
        print(f"  Instrument: {result['metadata']['instruments']}")
        print(f"  Ground Sample Distance: {result['metadata']['gsd']}m")
        
        # Save the image
        with open("image_with_metadata.png", "wb") as f:
            f.write(result['image'])
        print("\n✓ Image saved to: image_with_metadata.png")
        
        # Show all available images
        if len(result['all_available']) > 1:
            print(f"\nOther available images in the time range:")
            for idx, img in enumerate(result['all_available'][1:], 2):
                props = img['properties']
                print(f"  {idx}. {props['datetime']} - Cloud cover: {props['eo:cloud_cover']}%")
    else:
        print("\n✗ No suitable images found")
    
    print("\n" + "="*70)
    print("COMPLETE")
    print("="*70)

