"""
RPG - Random Point Generator
Version: 2015-06-30 Geometa Lab HSR, http://twitter.com/geometalab
License: MIT license, http://opensource.org/licenses/MIT

To run this: 
0. Start QGIS (must be version > 2.0)
1. Load a polygon layer and set it as the active layer.
2. Open Python Console and show editor.
3. Load this script and run it! (Don't forget to save memory layer).
"""
import random,sys
# This parameter sets the amount of random points to be generated
pointId = 2000
# Test if active layer is vector layer and of type polygon
layer = iface.activeLayer()
sys.stdout.write('RPG: ')
if not (layer and layer.type() == 0 and layer.geometryType() == 2):
    print("No polygon layer selected.")
else:
    # Prepare new temporary editable memory layer
    pointLayer = iface.addVectorLayer("Point?crs="+layer.crs().toWkt(), "random_points", "memory")
    xmin=xmax=ymin=ymax = 0.0
    # Create global bounding box from polygons/features
    features = layer.getFeatures()
    for polygon in features:
        bounds = polygon.geometry().boundingBox()
        xmin = bounds.xMinimum() if bounds.xMinimum() < xmin else xmin
        xmax = bounds.xMaximum() if bounds.xMaximum() > xmax else xmax
        ymin = bounds.yMinimum() if bounds.yMinimum() < ymin else ymin
        ymax = bounds.yMaximum() if bounds.yMaximum() > ymax else ymax
        
    # Iterate until N random points found
    while pointId > 0:
        # Create random point
        xRandom = xmin + (random.random() * (xmax-xmin))
        yRandom = ymin + (random.random() * (ymax-ymin))
        randomPoint = QgsPoint(xRandom,yRandom)
        randomPointGeometry = QgsGeometry.fromPoint(randomPoint)
        # if random_point is inside polygon feature, create new point feature in temporary layer
        for polygon in features:
            if polygon.geometry().contains(randomPointGeometry):
                pointFeature = QgsFeature()
                pointFeature.setGeometry(randomPointGeometry)
                pointLayer.dataProvider().addFeatures([pointFeature])
                pointId -= 1
                sys.stdout.write('.')
                break
    print(" Ok.")
