(function(Two, R) {

  (function() {
    var parentWidth = $('#animation1').width();

    var canvas = {
      width: parentWidth,
      height: parentWidth / 2,
      scale: parentWidth / 10
    };

    var elem = document.getElementById('animation1').children[0];

    var two = new Two({
      width: canvas.width,
      height: canvas.height,
      autostart: true
    }).appendTo(elem);

    var parts = [
      two.makeLine(0, 0, 0, two.height / 4),
      two.makeCircle(0, two.height / 4, two.height / 32)
    ];

    var pendulum = two.makeGroup(parts);
    pendulum.id = 'pendulum';
    pendulum.translation.set(two.width / 2, two.height / 2);
    pendulum.rotation = 0.25;
    pendulum.fill = 'rgb(0, 200, 255)';
    pendulum.stoke = 'rgb(0, 200, 255)';

    two.update();

    var params = {
      gravity: 9.81,
      forceAmplitude: 16.18, //0 to 100 w
      forceFrequency: 1, //0 to 10 a
      dampingCoefficient: 0.01, //0 to 2 delta
      timeStep: 0.1, //0 to 0.5 tstep
      length: 100, //0 to 100 l
      initialAngle: 0.2, //-PI to PI theta
      initialVelocity: 2, //-PI to PI deltaTheta
    };

    var state = {
      time: 0,
      angle: params.initialAngle,
      velocity: params.initialVelocity,
      translationY: 0
    };

    var calculateDifferential = function(params, time, angle, velocity) {
      return (-2 * params.dampingCoefficient * velocity) - ((params.gravity / params.length) * Math.sin(angle)) + ((params.forceAmplitude * params.forceFrequency * params.forceFrequency / params.length) * Math.cos(params.forceFrequency * time) * Math.sin(angle));
    };

    function calculateRotation(params, oldstate) {
      //use numerical integration (Runge-Kutta 4th order method)
      var k1, k2, k3, k4;
      var step = params.timeStep;
      var angle = oldstate.angle;
      var velocity = oldstate.velocity;
      var time = oldstate.time;

      k1 = 0.5 * step * calculateDifferential(params, time, angle, velocity);
      k2 = 0.5 * step * calculateDifferential(params, time + 0.5 * step, angle + 0.5 * step * (velocity + 0.5 * k1), velocity + k1);
      k3 = 0.5 * step * calculateDifferential(params, time + 0.5 * step, angle + 0.5 * step * (velocity + 0.5 * k1), velocity + k2);
      k4 = 0.5 * step * calculateDifferential(params, time + step, angle + step * (velocity + k3), velocity + 2 * k3);

      return {
        angle: angle + (step * (velocity + (1 / 3) * (k1 + k2 + k3))),
        velocity: velocity + ((1 / 3) * (k1 + (2 * k2) + (2 * k3) + k4))
      };
    };

    var calculateTranslation = function(params, oldstate){
      return -params.forceAmplitude * Math.cos(params.forceFrequency * oldstate.time);
    };

    var calculateState = function(oldstate, params) {
      var newTranslationY = calculateTranslation(params, oldstate);
      var newRotation = calculateRotation(params, oldstate);

        return {
          time: oldstate.time + params.timeStep,
          angle: newRotation.angle,
          velocity: newRotation.velocity,
          translationY: newTranslationY
        };
    };

    $('#twocontainer1 svg')
      .attr('viewBox', '0 0 968 484')
      .attr('preserveAspectRatio', 'xMidYMid meet');


    var accumulator = 0;

    two.bind('update', function() {

      
      state = calculateState(state, params);
      //console.log(state.angle);
      pendulum.rotation = state.angle;
      pendulum.translation.y = two.height / 2 + state.translationY;
    });

  })();


})(Two, R);