(function(T, R) {

    var elem = document.getElementById('animation').children[0];
    var two = new T({
        width: 968,
        height: 200
    }).appendTo(elem); 


    var verticies = function(rect) {
        var halfWidth = rect.width / 2;
        var halfHeight = rect.height / 2;
        return [{
            x: rect.centreX - halfWidth,
            y: rect.centreY - halfHeight
        }, {
            x: rect.centreX + halfWidth,
            y: rect.centreY - halfHeight
        }, {
            x: rect.centreX - halfWidth,
            y: rect.centreY + halfHeight
        }, {
            x: rect.centreX + halfWidth,
            y: rect.centreY + halfHeight
        }, ];
    }

    var contain = verticies({
        centreX: 2,
        centreY: 5,
        width: 10,
        height: 4
    });

    var check = verticies({
        centreX: 6,
        centreY: 7.5,
        width: 6,
        height: 2
    });

    var createRect = function(two, rect, rotation) {
        var scale = 20;
        var width = (rect[1].x - rect[0].x) * scale;
        var height = (rect[2].y - rect[0].y) * scale;
        var centreX = 300 + (rect[0].x * scale) + width / 2;
        var centreY = rect[0].y * scale + height / 2;

        var rect = two.makeRectangle(centreX, centreY, width, height);
        rect.rotation = rotation;

        return rect;
    };

    var containRect = createRect(two, contain, Math.PI / 4);
    var checkRect = createRect(two, check, 0);

    containRect.fill = 'rgb(0, 200, 255)';
    containRect.opacity = 0.75;
    containRect.noStroke();

    checkRect.fill = 'rgb(200, 10, 255)';
    checkRect.opacity = 0.75;
    checkRect.noStroke();

    two.update();

    var bounds = function(rect) {
        return R.reduce(
            function(acc, point) {
                return {
                    minX: R.min(acc.minX, point.x),
                    maxX: R.max(acc.maxX, point.x),
                    minY: R.min(acc.minY, point.y),
                    maxY: R.max(acc.maxY, point.y)
                };
            }, {
                minX: Infinity,
                maxX: -Infinity,
                minY: Infinity,
                maxY: -Infinity
            },
            rect
        );
    }

    var pointInBounds = R.curry(function(bounds, point) {
        return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
    });

    var rotationAngle = function(point1, point2) {
        return Math.atan((point1.y - point2.y) / (point1.x - point2.x));
    }

    var rotatePoint = R.curry(function(angle, point) {
        return {
            x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
            y: point.x * Math.sin(angle) + point.y * Math.cos(angle)
        };
    });

    var angle = rotationAngle(contain[0], contain[2]);
    console.log(angle);
    var rotator = R.map(rotatePoint(-angle));

    var containsRect = function(checkrect, containrect) {
        return R.map(pointInBounds(rotator(bounds(containrect))), rotator(checkrect));
    };

    console.log(containsRect(check, contain));

})(Two, R);