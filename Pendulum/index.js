'use strict';

const sin  = Math.sin;
const cos  = Math.cos;
const sign = Math.sign;
const abs  = Math.abs;
const PI   = Math.PI;

class Point {
    constructor(...args) {
        if (args.length === 1) {
            args = args[0];
            this.x = args.x;
            this.y = args.y;
        } else if (args.length === 2) {
            this.x = args[0];
            this.y = args[1];
        } else {
            this.x = this.y = 0;
        }
    }
}

function toRect(radius, angle) {
    return new Point(radius*sin(angle), radius*cos(angle));
}

function translate(origin, point) {
    return new Point(origin.x + point.x, origin.y + point.y);
}

function drawPendulum (context, origin, destination, mass) {
    context.drawLine({
       strokeStyle: '#000',
       strokeWidth: '6',
       x1: origin.x,      y1: origin.y,
       x2: destination.x, y2: destination.y
    }).drawArc({
        fillStyle: '#000',
        x: destination.x, y: destination.y,
        radius: mass * 0.25,
        start: 0, end: 2 * PI,
        ccw: true,
        inDegrees: false
    });
}

function drawHistory(context, history) {

    history.forEach((val, i) => {
       if (i !== 0) {
           context.drawLine({
               strokeStyle: `#333`,
               strokeWidth: '3',
               x1: history[i-1].x, y1: history[i-1].y,
               x2: history[i].x,   y2: history[i].y
           });
       }
    });
}

$(document).ready(() => {
    const ctx       = $('#board');
    const verbose   = false;
    let running     = true;
    const width     = ctx.width();
    const height    = ctx.height();
    const origin    = new Point(width/2, height/8);
    const history   = [];
    const histSize  = 500;

    const g         = 1.1;
    const mass      = [50, 75];

    let theta       = [PI/2, PI/2];
    let radius      = [100, 200];
    let velocity    = [0, 0];
    let accel       = [0, 0];

    const points    = [toRect(radius[0], theta[0]), toRect(radius[1], theta[1])];
    points[0] = translate(origin, points[0]);
    points[1] = translate(points[0], points[1]);

    function loop() {
        ctx.drawRect({
            fillStyle: 'white',
            strokeStyle: 'white',
            x: 0, y: 0,
            fromCenter: false,
            width: width, height: height
        });

        drawPendulum(ctx, origin, points[0], mass[0]);
        drawPendulum(ctx, points[0], points[1], mass[1]);
        drawHistory(ctx, history);

        accel[0] =  -g * (2*mass[0] + mass[1]) * sin(theta[0]); // -g(2m1+m2)sin(theta1)
        accel[0] += -mass[1] * g * sin(theta[0] - 2*theta[1]);  // -m2*g*sin(theta1 - 2theta2)
        accel[0] += -2*sin(theta[0] - theta[1])                 // -2sin(theta1 - theta2)
                  * mass[1]*((velocity[1] ** 2)*radius[1]          // * m2 * (v2²l2 +
                  + (velocity[0] ** 2)*radius[0]*cos(theta[0] - theta[1])); // v1²l1*cos(theta1 - theta2)

        accel[0] =  accel[0]
                 / (radius[0] * (2*mass[0] + mass[1] - mass[1]*cos(2*theta[0] - 2*theta[1]))); // l1*(2m1+m2-m2cos(2theta1 - 2theta2)

        accel[1]   = (velocity[0] ** 2)*radius[0]*(mass[0] + mass[1]);  // v1²l1*(m1 + m2)
        accel[1]  += g * (mass[0] + mass[1]) * cos(theta[0]);          // g*(m1+m2)*cos(theta1)
        accel[1]  += (velocity[1] ** 2) * radius[1] * mass[1] * cos(theta[0] - theta[1]);
        accel[1]  *= 2*sin(theta[0] - theta[1]);
        accel[1]   = accel[1]
                   / (radius[1] * (2*mass[0] + mass[1] - mass[1]*cos(2*theta[0] - 2*theta[1])));

        if (accel.filter(isFinite).length !== 2) {
            console.error('Infinite value', accel);
            running = false;
        } else if (accel.filter(isNaN) > 0) {
            console.error('Not a Number value', accel);
            running = false;
        } else if (verbose) {
            console.log(accel);
        }

        velocity = velocity.map((v, i) => v + accel[i]);
        theta    = theta.map((t, i) => t + velocity[i]);

        points[0] = translate(origin, toRect(radius[0], theta[0]));
        points[1] = translate(points[0], toRect(radius[1], theta[1]));

        history.push(points[1]);
        if (history.length > histSize)
            history.shift();

        if (running)
            setTimeout(loop, 15);
    }

    loop();

    $('#stop').click(_ => running = false);

});