from PIL import Image, ImageEnhance, ImageOps
from inky.auto import auto


# Initialise display
inky_display = auto()

background = Image.new('RGB', (WIDTH, HEIGHT), (255, 255, 255))

offset_x = (inky_display.width - background.width) // 2
offset_y = (inky_display.height - background.height) // 2

# Open and show screenshot
image = Image.open("screenshot.png")

converter = ImageEnhance.Color(image)
image = converter.enhance(2.0)

contrast = ImageEnhance.Contrast(image)
image = converter.enhance(1.2)


background.paste(image, (offset_x, offset_y))
imageToDisplay = background.rotate(90, expand=True)

# Limit colors to be handled on eink display better
ImageOps.posterize(imageToDisplay, bits=4)

inky_display.set_image(imageToDisplay)
inky_display.show()
