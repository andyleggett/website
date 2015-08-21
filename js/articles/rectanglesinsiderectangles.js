(function(Two, R) {

    //functions
    var rotatePoint = R.curry(function(angle, about, point) {
        return {
            x: about.x + ((point.x - about.x) * Math.cos(angle) + (point.y - about.y) * Math.sin(angle)),
            y: about.y + (-(point.x - about.x) * Math.sin(angle) + (point.y - about.y) * Math.cos(angle))
        };
    });

    var verticies = function(rect) {
        var halfWidth = rect.width / 2;
        var halfHeight = rect.height / 2;
        var rotator = rotatePoint(rect.angle, rect.centre);
        return [
            rotator({
                x: rect.centre.x - halfWidth,
                y: rect.centre.y - halfHeight
            }),
            rotator({
                x: rect.centre.x + halfWidth,
                y: rect.centre.y - halfHeight
            }),
            rotator({
                x: rect.centre.x - halfWidth,
                y: rect.centre.y + halfHeight
            }),
            rotator({
                x: rect.centre.x + halfWidth,
                y: rect.centre.y + halfHeight
            })
        ];
    }

    var createRect = function(id, two, rect, fill) {
        var scale = 96.8;

        var newRect = two.makeRectangle(rect.centre.x * scale, rect.centre.y * scale, rect.width * scale, rect.height * scale);
        newRect.id = id;
        newRect.rotation = rect.angle || 0;
        newRect.fill = fill;
        newRect.opacity = 0.75;
        newRect.noStroke();

        return newRect;
    };

    var recalculateRect = function(rect, position) {
        return R.merge(rect, {
            centre: {
                x: position.x / 96.8,
                y: position.y / 96.8
            }
        });
    }

    var recalculateAngle = function(rect) {
        return R.merge(rect, {
            angle: rect.angle + 0.05
        });
    }

    var bounds = function(verticies) {
        return R.reduce(
            function(acc, vertex) {
                return {
                    minX: R.min(acc.minX, vertex.x),
                    maxX: R.max(acc.maxX, vertex.x),
                    minY: R.min(acc.minY, vertex.y),
                    maxY: R.max(acc.maxY, vertex.y)
                };
            }, {
                minX: Infinity,
                maxX: -Infinity,
                minY: Infinity,
                maxY: -Infinity
            },
            verticies
        );
    }

    var pointInBounds = R.curry(function(bounds, point) {
        return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
    });

    var containsRect = R.curry(function(containrect, checkrect) {
        var rotator = rotatePoint(-containrect.angle, containrect.centre);
        var vertexChecker = pointInBounds(R.compose(bounds, R.map(rotator), verticies)(containrect));

        return R.all(vertexChecker, R.compose(R.map(rotator), verticies)(checkrect));
    });

    //interaction 1
    (function() {

        var contain = {
            centre: {
                x: 5,
                y: 2.5
            },
            width: 5,
            height: 3,
            angle: 0
        };

        var check = {
            centre: {
                x: 5,
                y: 2.5
            },
            width: 3,
            height: 1,
            angle: 0
        };

        var elem = document.getElementById('animation1').children[0];

        var two = new Two({
            width: 968,
            height: 484,
            autostart: true
        }).appendTo(elem);

        var mouse = new Two.Vector();

        var containRect = createRect('contain1', two, contain, 'rgb(0, 200, 255)');
        var checkRect = createRect('check1', two, check, 'rgb(200, 10, 255)');

        two.update();

        var $output = $('#output1');

        $('#twocontainer1')
            .on('mousemove', function(e) {
                var parentOffset = $(this).parent().offset();

                mouse.x = e.pageX - parentOffset.left;
                mouse.y = e.pageY - parentOffset.top;
            })
            .on('touchstart', function(e) {
                e.preventDefault();
            })
            .on('touchmove', function(e) {
                e.preventDefault();
                var parentOffset = $(this).parent().offset();
                var touch = e.originalEvent.changedTouches[0];
                mouse.x = touch.pageX - parentOffset.left;
                mouse.y = touch.pageY - parentOffset.top;
            });

        two.bind('update', function() {
            checkRect.translation.set(mouse.x, mouse.y);
            check = recalculateRect(check, mouse);
            $output.text(containsRect(contain, check) ? 'Yes' : 'No');
        });
    })();

    //interaction 2
    (function() {

        var contain = {
            centre: {
                x: 5,
                y: 2.5
            },
            width: 5,
            height: 3,
            angle: 0
        };

        var check = {
            centre: {
                x: 5,
                y: 2.5
            },
            width: 3,
            height: 1,
            angle: -Math.PI / 5
        };

        var elem = document.getElementById('animation2').children[0];

        var two = new Two({
            width: 968,
            height: 484,
            autostart: true
        }).appendTo(elem);

        var mouse = new Two.Vector();

        var containRect = createRect('contain2', two, contain, 'rgb(0, 200, 255)');
        var checkRect = createRect('check2', two, check, 'rgb(200, 10, 255)');

        two.update();

        var $output = $('#output2');
        var angleInterval;
        var touchTimer;

        $('#check2')
            .on('mousedown', function(e) {
                angleInterval = window.setInterval(function() {
                    check = recalculateAngle(check);
                    checkRect.rotation = check.angle;
                }, 50);
            })
            .on('mouseup', function(e) {
                clearInterval(angleInterval);
            })
            .on('touchstart', function(e) {
                touchTimer = setTimeout(startRotate, 400);
            })
            .on('touchend', function(e) {
                clearTimeout(touchTimer);
                clearInterval(angleInterval);
            });

        var startRotate = function() {
            angleInterval = window.setInterval(function() {
                check = recalculateAngle(check);
                checkRect.rotation = check.angle;
            }, 50);
        };


        $('#twocontainer2')
            .on('mousemove', function(e) {
                var parentOffset = $(this).parent().offset();

                mouse.x = e.pageX - parentOffset.left;
                mouse.y = e.pageY - parentOffset.top;
            })
            .on('touchstart', function(e) {
                e.preventDefault();
            })
            .on('touchmove', function(e) {
                e.preventDefault();
                var parentOffset = $(this).parent().offset();
                var touch = e.originalEvent.changedTouches[0];
                mouse.x = touch.pageX - parentOffset.left;
                mouse.y = touch.pageY - parentOffset.top;
            });

        two.bind('update', function() {
            checkRect.translation.set(mouse.x, mouse.y);
            check = recalculateRect(check, mouse);
            $output.text(containsRect(contain, check) ? 'Yes' : 'No');
        });
    })();

    //interaction 3
    (function() {
        var contain = {
            centre: {
                x: 5,
                y: 2.5
            },
            width: 5,
            height: 3,
            angle: Math.PI / 10
        };

        var check = {
            centre: {
                x: 5,
                y: 2.5
            },
            width: 3,
            height: 1,
            angle: -Math.PI / 5
        };

        var elem = document.getElementById('animation3').children[0];

        var two = new Two({
            width: 968,
            height: 484,
            autostart: true
        }).appendTo(elem);

        var mouse = new Two.Vector();

        var containRect = createRect('contain3', two, contain, 'rgb(0, 200, 255)');
        var checkRect = createRect('check3', two, check, 'rgb(200, 10, 255)');

        two.update();

        var $output = $('#output3');
        var angleInterval;
        var touchTimer;

        $('#check3')
            .on('mousedown', function(e) {
                angleInterval = window.setInterval(function() {
                    check = recalculateAngle(check);
                    checkRect.rotation = check.angle;
                }, 50);
            })
            .on('mouseup', function(e) {
                clearInterval(angleInterval);
            })
            .on('touchstart', function(e) {
                touchTimer = setTimeout(startRotate, 400);
            })
            .on('touchend', function(e) {
                clearTimeout(touchTimer);
                clearInterval(angleInterval);
            });

        var startRotate = function() {
            angleInterval = window.setInterval(function() {
                check = recalculateAngle(check);
                checkRect.rotation = check.angle;
            }, 50);
        };

        $('#twocontainer3')
            .on('mousemove', function(e) {
                var parentOffset = $(this).parent().offset();

                mouse.x = e.pageX - parentOffset.left;
                mouse.y = e.pageY - parentOffset.top;
            })
            .on('touchstart', function(e) {
                e.preventDefault();
            })
            .on('touchmove', function(e) {
                e.preventDefault();
                var parentOffset = $(this).parent().offset();
                var touch = e.originalEvent.changedTouches[0];
                mouse.x = touch.pageX - parentOffset.left;
                mouse.y = touch.pageY - parentOffset.top;
            });

        two.bind('update', function() {
            checkRect.translation.set(mouse.x, mouse.y);
            check = recalculateRect(check, mouse);
            $output.text(containsRect(contain, check) ? 'Yes' : 'No');
        });
    })();

})(Two, R);