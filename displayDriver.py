from PIL import Image, ImageEnhance
from inky.auto import auto

# Initialise display
inky_display = auto()

# Open and show screenshot
image = Image.open("screenshot.png")
image = image.rotate(90, expand=True)

converter = ImageEnhance.Color(image)
image = converter.enhance(2.0)

contrast = ImageEnhance.Contrast(image)
image = converter.enhance(1.2)

inky_display.set_image(image)
inky_display.show()
