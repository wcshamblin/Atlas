from PIL import Image
from sys import argv

left = 2025
top = 776
right = left+60
bottom = top+60

for arg in argv[1:]:
    image = Image.open(arg)
    cropped = image.crop((left, top, right, bottom))
    cropped.save(arg)