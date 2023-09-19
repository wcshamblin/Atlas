from PIL import Image
from sys import argv

google_hybrid_path = argv[1]
bing_hybrid_path = argv[2]
esri_path = argv[3]
naip_path = argv[4]
vfr_path = argv[5]
openstreetmap_path = argv[6]

google_hybrid = Image.open(google_hybrid_path)
bing_hybrid = Image.open(bing_hybrid_path)
esri = Image.open(esri_path)
naip = Image.open(naip_path)
vfr = Image.open(vfr_path)
openstreetmap = Image.open(openstreetmap_path)

left = 1994
top = 720
right = 1994 + 60
bottom = 720 + 60

google_hybrid = google_hybrid.crop((left, top, right, bottom))
bing_hybrid = bing_hybrid.crop((left, top, right, bottom))
esri = esri.crop((left, top, right, bottom))
naip = naip.crop((left, top, right, bottom))
vfr = vfr.crop((left, top, right, bottom))
openstreetmap = openstreetmap.crop((left, top, right, bottom))

# save the images
google_hybrid.save(google_hybrid_path)
bing_hybrid.save(bing_hybrid_path)
esri.save(esri_path)
naip.save(naip_path)
vfr.save(vfr_path)
openstreetmap.save(openstreetmap_path)