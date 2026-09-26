from PIL import Image
import sys
im=Image.open(sys.argv[1]).convert('RGB')
im.thumbnail((int(sys.argv[3]),int(sys.argv[3])))
im.save(sys.argv[2],'WEBP',quality=82,method=6)
