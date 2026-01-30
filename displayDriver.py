from PIL import Image
from inky.auto import auto

# Initialise display
inky_display = auto()
resolution = inky_display.resolution

# Open and show screenshot
image = Image.open("screenshot.png")
image = image.resize(resolution)
inky_display.set_image(image, saturation=0.5)
inky_display.show()