class ShapeFromType {
  constructor(properties) {
    this.properties = properties;
    this.create();
    //this.pos = createVector(x, y);
    //this.angle = 0;

  }
  create() {
    let p = this.properties;
    let t = p.type;
    let ratio = 0.9;
    switch (t) {
      case 'rect':
        this.body = Bodies.rectangle(p.x, p.y, p.w, p.h);
        break;
      case 'circle':
        this.body = Bodies.circle(p.x, p.y, p.r);
        break;
      case 'polygon':
        this.body = Bodies.polygon(p.x, p.y, p.sides, p.r);
        break;
      case 'trap':
        this.body = Bodies.trapezoid(p.x, p.y, p.w, p.h, p.slope);
        break;
      case 'tri':
        let path = '';
        //example x,y: 0 w: 4 h: 6
        //  (-2,0) , (0,-6), (2,0)  -- the points of a triangle
        //    '        -2                  0           0             -6                 2                0 '
        path = path + (p.x - p.w / 2) + ' ' + p.y + ' ' + p.x + ' ' + (p.y - p.h) + ' ' + (p.x + p.w / 2) + ' ' + p.y;
        let verts = new Vertices.fromPath(path);
        this.body = Bodies.fromVertices(p.x, p.y - p.h / 2, verts);
        this.driveOffsetY = -p.h * ratio;
        break;
      case 'path':

        break;
      default:
    }
    World.add(world, this.body);


  }
  isContained(x, y, w, h) {
    let pos = this.body.position;
    return (pos.x < x + w / 2 && pos.x > x - w / 2 && pos.y < y + h / 2 && pos.y > y - h / 2);
  }
  show() {
    let c = this.properties.hsl;
    push();
    colorMode(HSL, 360, 100, 100, 1);
    stroke(3);
    fill(c.h, c.s, c.l);
    beginShape();
    for (let v of this.body.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    //rect(0, 0, this.w, this.h);
    pop();
  }
}

class Vehicle extends ShapeFromType {
  constructor(properties, list) {
    super(properties);
    this.maxForce = .0002;
    this.maxSpeed = .0001;
    this.maxAngle = PI / 4;
    this.target = this.body;
  }

  setTarget(bodies) {
    let target = this.body;
    let areaD = null;
    let sidesD = null;
    for (let i = bodies.length - 1; i >= 0; i--) {
      let dif = abs(this.body.area - bodies[i].body.area);
      if (areaD == null && bodies[i] != this) {
        areaD = dif;
        target = bodies[i].body;
      } else if (bodies[i] != this && areaD > abs(this.body.area - bodies[i].body.area)) {
        areaD = dif;
        target = bodies[i].body;
      }
    }
    this.target = target;
  }
  //seeking behavior with angle limits
  seekBroken(target) {
    let acc;
    let angleDif;
    let mag = this.maxForce;
    //a unit vector of where wehicle is pointed
    let forwardVector = Matter.Vector.create(0, -1);
    forwardVector = Matter.Vector.rotate(forwardVector, this.body.angle);
    let leftVector = Matter.Vector.rotate(forwardVector, -this.maxAngle);
    let rightVector = Matter.Vector.rotate(forwardVector, +this.maxAngle);

    //relative position vector
    acc = Matter.Vector.sub(target.position, this.body.position);
    //obeying speed limit
    acc = Matter.Vector.normalise(acc);
    acc = Matter.Vector.mult(acc, this.maxSpeed);
    //desired steering force
    acc = Matter.Vector.sub(acc, this.body.velocity);

    //mag = Matter.Vector.magnitude()
    angleDif = Matter.Vector.angle(forwardVector, acc);

    // if (angleDif > this.maxAngle) {
    //   console.log(angleDif.toPrecision(2) + ' : turn Right');
    //   acc = Matter.Vector.mult(rightVector, mag);
    // } else if (angleDif < -this.maxAngle) {
    //   console.log(angleDif.toPrecision(2) + ' : turn Left');
    //   acc = Matter.Vector.mult(leftVector, mag);
    // }

    //desired reduced to maxforce magnitude
    // let offsetPos = {
    //   x: this.body.position.x + this.driveOffsetX,
    //   y: this.body.position.y + this.driveOffsetY
    // }
    Body.applyForce(this.body, this.body.position, acc);
  }
  //rote seeking behavior
  seek(target) {
    //relative position vector
    let acc = Matter.Vector.sub(target.position, this.body.position);
    let dist = Matter.Vector.magnitude(acc);
    //desired steering force
    acc = Matter.Vector.normalise(acc);
    let speed = map(dist, 20, 80, 0, this.maxSpeed);
    acc = Matter.Vector.mult(acc, speed);

    //  acc = Matter.Vector.sub(acc, this.body.velocity);
    //obeying speed limit
    //acc = Matter.Vector.normalise(acc);
    //acc = Matter.Vector.mult(acc, this.maxSpeed);
    //console.log(acc);
    Body.applyForce(this.body, this.body.position, acc);
  }
}

class PerlinFloor {
  constructor(qty, peakHeight) {
    this.hsl = {
      h: 222,
      s: 40,
      l: 28
    }
    this.bodies = [];
    this.create(qty, peakHeight);
    for (let b of this.bodies) {
      World.add(world, b);
    }
  }


  create(qty, peakH) {
    let radius;
    let startPeak;
    let endPeak;
    let verts = [];
    let v = {};
    let size = width / qty;
    let x = -size / 2;
    let y = height + peakH * 0.48;
    startPeak = map(noise(x), 0, 1, peakH * 2, peakH * 8);
    while (x < width - size / 3) {
      radius = Math.floor(random(size * 0.75, size * 1.25));
      if (x < width - size * 1.8) {
        endPeak = map(noise(x / 5), 0, 1, peakH * 0.50, peakH * 3);
      } else {
        endPeak = map(noise(x / 5), 0, 1, peakH * 4, peakH * 8);
      }
      x += radius;
      verts.push({
        x: x,
        y: y
      });
      verts.push({
        x: x - radius,
        y: y - startPeak
      });
      verts.push({
        x: x + radius,
        y: y - endPeak
      });
      this.bodies.push(this.sectionTriangle(verts));
      verts.pop();
      verts.pop();
      verts.pop();
      startPeak = endPeak;
      x += radius;
    }
  }
  sectionTriangle(verts) {
    let path = '';
    //example x,y: 0 w: 4 h: 6
    //  (-2,0) , (0,-6), (2,0)  -- the points of a triangle
    //    '-2 0 0 -6 2 0 '
    let sumX = 0;
    let sumY = 0;
    for (let vert of verts) {
      path = path + vert.x + ' ' + vert.y + ' ';
      sumX += vert.x;
      sumY += vert.y;
    }
    let bodyV = new Vertices.fromPath(path);
    let options = {
      isStatic: true
    }
    return (Bodies.fromVertices(sumX / 3, sumY / 3, bodyV, options));
  }
  show() {
    for (let b of this.bodies) {
      let c = this.hsl;
      push();
      colorMode(HSL, 360, 100, 100, 1);
      stroke(3);
      fill(c.h, c.s, c.l);
      beginShape();
      for (let v of b.vertices) {
        vertex(v.x, v.y);
      }
      endShape(CLOSE);
      //rect(0, 0, this.w, this.h);
      pop();
    }
  }
}
class Sprite {
  constructor(img, x, y, velocityVector) {
    this.img = img;
    this.size = random(120, 160);
    // this.xOrigin = x - this.size / 2;
    // this.yOrigin = y - this.size / 2;
    // this.pos = createVector(this.xOrigin, this.yOrigin);
    this.pos = createVector(x, y);
    this.angle = 0;
    //this.ang = createVector(0, 0);
    this.angularVelocity = random(-0.3, 0.3);
    this.angMax = 0.3;
    this.spin = random() < .5 ? 1 : -1;
    //this.angularVelocity = 0.2;
    //this.vel = (velocityVector == null) ? create2D() : velocityVector;
    this.velMax = 65;
    if (velocityVector == null) {
      this.vel = p5.Vector.random2D();
      this.vel.normalize();
      this.vel.mult(random(0, this.velMax / 6));
    } else {
      this.vel = velocityVector.copy();
    }
  }
  applyForce(forceVector) {
    this.vel.add(forceVector);
    let mag = this.vel.mag();
    if (mag > this.velMax) {
      this.vel.setMag(constrain(mag, 0, this.velMax));
    }
    this.applyAngular(forceVector);
  }
  applyAngular(forceVector) {
    if (forceVector.heading() < 1.5 && forceVector.heading() >= -1.5) {
      this.angularVelocity += this.spin * forceVector.mag() * 0.04;
    } else {
      this.angularVelocity -= this.spin * forceVector.mag() * 0.04;
    }
    this.angularVelocity = constrain(this.angularVelocity, -this.angMax, this.angMax);
  }
  updatePos() {
    this.pos.add(this.vel);
    this.angle += this.angularVelocity;
    if (this.pos.y > height + this.size / 2) {
      this.pos.y = -this.size;
    }
  }
  isContained(area) {
    return (
      (this.pos.x > area.x && this.pos.x < area.x + area.width) && (this.pos.y > area.y && this.pos.y < area.y + area.height)
    );
  }
  show(forceVector) {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    image(this.img, 0 - this.size / 2, 0 - this.size / 2, this.size, this.size);
    //image(this.img, this.pos.x, this.pos.y, this.size, this.size);
    pop();
    this.showVectors(forceVector);
  }
  showVectors(forceVector) {
    let triSize;
    //draw angularVelocity
    let angV = this.angularVelocity;
    let factor = map(angV, -this.angMax, this.angMax, -TWO_PI * 0.90, TWO_PI * 0.90);
    push();
    translate(this.pos.x, this.pos.y);
    noFill();
    stroke('purple');
    if (factor >= 0) {
      strokeWeight(map(factor, 0, TWO_PI, 2, 10));
      arc(0, 0, this.size / 2, this.size / 2, PI, PI + factor);
      rotate(factor);
      triSize = map(factor, 0, TWO_PI, 6, 12);
      triangle((-this.size / 4) - triSize / 2, 0, (-this.size / 4), -1 * triSize, (-this.size / 4) + triSize / 2, 0);
    } else {
      strokeWeight(map(factor, -TWO_PI, 0, 10, 2));
      arc(0, 0, this.size / 2, this.size / 2, factor - PI, PI);
      rotate(factor);
      triSize = map(factor, -TWO_PI, 0, 12, 6);
      triangle((-this.size / 4) - triSize / 2, 0, (-this.size / 4), 1 * triSize, (-this.size / 4) + triSize / 2, 0);
    }
    pop();
    //draw supplied forceVector
    push();
    translate(this.pos.x, this.pos.y);
    stroke('green');
    strokeWeight(map(forceVector.mag(), 0, this.velMax, 5, 200));
    let xCon = constrain(forceVector.x * 700, -300, 300);
    let yCon = constrain(forceVector.y * 700, -300, 300);
    line(0, 0, xCon, yCon);
    translate(xCon, yCon);
    rotate(forceVector.heading());
    triSize = map(this.vel.mag(), 0, this.velMax, 6, 10);
    triangle(0, (triSize - 2) / 2, 0, -1 * (triSize - 2) / 2, triSize - 2, 0);
    pop();
    //draw velocityVector
    push();
    translate(this.pos.x, this.pos.y);
    stroke('red');
    fill('pink');
    strokeWeight(map(this.vel.mag(), 0, this.velMax, 4, 20));
    line(0, 0, this.vel.x * 10, this.vel.y * 10);
    translate(this.vel.x * 10, this.vel.y * 10);
    rotate(this.vel.heading());
    triSize = map(this.vel.mag(), 0, this.velMax, 6, 10);
    triangle(0, triSize / 2, 0, -triSize / 2, triSize, 0);
    pop();


  }
}

class Mote {
  constructor(x, y) {
    this.origin = createVector(x, y);
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.lifeSpan = random(130, 950);
  }
  //forces move a mote, but motes do not retain velocity
  applyForce(forceVector) {
    this.vel.add(forceVector);
    this.vel.mult(0.9);
  }
  goHome() {
    this.pos.set(this.origin.x, this.origin.y);
    this.vel.set(0, 0);
    this.lifeSpan = random(130, 950);
  }
  updatePos() {
    this.pos.add(this.vel);
    this.lifeSpan--;
  }

  show() {
    stroke('white', .4);
    strokeWeight(0);
    point(this.pos.x, this.pos.y);
  }
  isContained(area) {
    return (
      (this.pos.x > area.x && this.pos.x < area.x + area.width) && (this.pos.y > area.y && this.pos.y < area.y + area.height)
    );
  }
  isDead() {
    return (this.lifeSpan <= 0);
  }
}

//expected use: forceVector = a unit vector. in applying a force, reduce by .reducer
class ForceContainer {
  constructor(x, y, w, h, forceVector) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.reducer = 0.0001;
    this.maxDeflection = PI / 4;
    if (forceVector == null) {
      this.acc = Matter.Vector.create(random(-1, 1), random(-1, 1));
      this.acc = Matter.Vector.normalise(this.acc);
      //this.acc = Matter.Vector.mult(this.acc, 0.0001);
      //  console.log(this.acc);
    } else {
      this.acc = forceVector.copy();
    }
  }
  //
  applyForce(body) {

    let pos = createVector(body.position.x - this.x, body.position.y - this.y);
    let angle = map(this.getAngle(pos), -PI, PI, -this.maxDeflection, this.maxDeflection);
    let dest = createVector(this.acc.x, this.acc.y);
    dest.rotate(angle);
    let mForce = Matter.Vector.create(dest.x, dest.y);
    mForce = Matter.Vector.mult(mForce, this.reducer);
    Body.applyForce(body, body.position, mForce);
  }
  //returns a unit vector pointed u/d/l/r based on this.acc
  getForce(x, y) {
    let multi = map(y, this.y - this.height / 2, this.y + this.height / 2, 0.05, 1);
    let ang = p5.Vector.fromAngle(map(x, this.x - this.width / 2, this.x + this.width / 2, -PI * 3 / 4, -PI / 4));
    ang.normalize();
    let mForce = Matter.Vector.create(ang.x, ang.y);
    mForce = Matter.Vector.add(this.acc, mForce);
    //console.log(mForce);
    //mForce = Matter.Vector.normalise(mForce);
    mForce = Matter.Vector.mult(mForce, multi * 0.001);

    return (mForce);
  }
  getAngle(pos) {
    let v = createVector(this.acc.x, this.acc.y);
    return (v.angleBetween(pos));
  }
  show(n) {
    push();
    rectMode(CENTER);
    stroke(color('rgba(255, 255, 155, .4)'));
    strokeWeight(4);
    noFill();
    translate(this.x, this.y);
    rect(0, 0, this.width, this.height);
    strokeWeight(3);
    if (n != null) {
      let pos;
      let dest;
      let angle;
      for (let i = 0; i < n + 1; i++) {
        for (let j = 0; j < n + 1; j++) {
          pos = createVector(map(i, 0, n + 1, -this.width * 2 / 5, this.width * 3 / 5), map(j, 0, n, -this.height / 2, this.height / 2));
          angle = map(this.getAngle(pos), -PI, PI, -this.maxDeflection, this.maxDeflection);
          dest = createVector(this.acc.x, this.acc.y);
          dest.mult(30);
          dest.rotate(angle);
          line(pos.x, pos.y, dest.x + pos.x, dest.y + pos.y);
          ellipse(dest.x + pos.x, dest.y + pos.y, 4);
        }
      }
      pos = createVector(0, 0);
      dest = createVector(this.acc.x, this.acc.y)
      dest.mult(50);
      stroke(color('rgba(155, 255, 255, 1)'));
      strokeWeight(6);
      line(pos.x, pos.y, dest.x + pos.x, dest.y + pos.y);
      ellipse(dest.x + pos.x, dest.y + pos.y, 8);
    }
    pop();
  }
}