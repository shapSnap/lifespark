class Shape {
  constructor(properties) {
    this.properties = properties;
    this.create();
    //this.pos = createVector(x, y);
    //this.angle = 0;

  }
  create() {
    let p = this.properties;
    let options = {
      label: p.label
    }
    let t = p.type;
    let ratio = 0.9;
    switch (t) {
      case 'rect':
        this.body = Bodies.rectangle(p.x, p.y, p.w, p.h, options);
        break;
      case 'circle':
        this.body = Bodies.circle(p.x, p.y, p.r, options);
        break;
      case 'polygon':
        this.body = Bodies.polygon(p.x, p.y, p.sides, p.r, options);
        break;
      case 'trap':
        this.body = Bodies.trapezoid(p.x, p.y, p.w, p.h, p.slope, options);
        break;
      case 'tri':
        let path = '';
        //example x,y: 0 w: 4 h: 6
        //  (-2,0) , (0,-6), (2,0)  -- the points of a triangle
        //    '        -2                  0           0             -6                 2                0 '
        path = path + (p.x - p.w / 2) + ' ' + p.y + ' ' + p.x + ' ' + (p.y - p.h) + ' ' + (p.x + p.w / 2) + ' ' + p.y;
        let verts = new Vertices.fromPath(path);
        this.body = Bodies.fromVertices(p.x, p.y - p.h / 2, verts, options);
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

class Vehicle extends Shape {
  constructor(properties, list) {
    super(properties);
    this.maxForce = .0002;
    this.maxSpeed = .0001;
    this.maxAngle = PI / 4;
    this.target = this.body;
    this.unitV = null;
  }
  applyGlobalDrift(cornerV) {
    let inc = 0.2;
    // let x = map(this.body.position.x, 0, width, 0, 1000);
    // let y = map(this.body.position.y, 0, height, 0, 1000);
    let x = this.body.position.x;
    let y = this.body.position.y;
    let angle;
    let unitV = cornerV.copy();
    unitV.normalize();
    unitV.mult(reducer);
    angle = map(noise(x * inc, y * inc), 0, 1, -PI, PI);
    unitV.rotate(angle);
    this.applyForce(this.body.position, unitV);
    this.unitV = unitV;
  }
  applyForce(position, force) {
    Body.applyForce(this.body, position, force);
    let mag = 0.001;
    let vel = createVector(this.body.velocity.x, this.body.velocity.y);
    let angle = vel.angleBetween(force);
    if (angle > 0) {
      //CCW
      if (angle < HALF_PI) {
        Body.setAngularVelocity(this.body, this.body.angularVelocity - map(angle, 0, HALF_PI, 0, mag));
        //CW
      } else {
        Body.setAngularVelocity(this.body, this.body.angularVelocity + map(angle, HALF_PI, PI, 0, mag));
      }
    } else {
      //CW
      if (angle > -HALF_PI) {
        Body.setAngularVelocity(this.body, this.body.angularVelocity - map(angle, 0, -HALF_PI, 0, mag));
        //CCW
      } else {
        Body.setAngularVelocity(this.body, this.body.angularVelocity + map(angle, -HALF_PI, -PI, 0, mag));
      }
    }

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
  showVector() {
    push();
    //stroke(color('rgba(255, 255, 155, .4)'));
    strokeWeight(4);
    noFill();
    translate(this.body.position.x, this.body.position.y);
    line(0, 0, this.unitV.x * 2000000, this.unitV.y * 2000000);
    pop();
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

//each section of the floor is a triangle. The 1st two vertices are always the bottom two points
class PerlinFloor {
  constructor(qty, peakHeight) {
    this.peakHeight = peakHeight;
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
    let y = height - peakH * 0.25;
    startPeak = map(noise(x), 0, 1, peakH * 2, peakH * 8);
    while (x < width - size / 3) {
      radius = Math.floor(random(size * 0.75, size * 1.25));
      if (x < width - size * 1.8) {
        endPeak = map(noise(x / 5), 0, 1, peakH * 0.50, peakH * 3);
      } else {
        endPeak = map(noise(x / 5), 0, 1, peakH * 4, peakH * 8);
      }
      x += radius;
      //ensures a two dimensional triangle
      if (startPeak == endPeak) {
        startPeak++;
      }
      //slope is negative
      if (startPeak > endPeak) {
        //right corner
        verts.push({
          x: x + radius,
          y: y - endPeak
        });
        //bottom left corner
        verts.push({
          x: x - radius,
          y: y - endPeak
        });
        //top left corner
        verts.push({
          x: x - radius,
          y: y - startPeak
        });
      } else {
        //bottom right corner
        verts.push({
          x: x + radius,
          y: y - startPeak
        });
        //bottom left corner
        verts.push({
          x: x - radius,
          y: y - startPeak
        });
        //top right corner
        verts.push({
          x: x + radius,
          y: y - endPeak
        });
      }
      this.bodies.push(this.sectionTriangle(verts));
      verts.pop();
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
      isStatic: true,
      label: 'Floor'
    }
    //center the triangle's mass on the centroid of the tri
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
        curveVertex(v.x, v.y);
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

class Volcano {
  constructor(ps, chems, floor, frequency, lifespan, magnitude) {
    //TODO change height to porportional, and below screen
    this.ps = ps;
    this.chems = chems;
    this.floorHeight = floor.peakHeight - 20;
    this.freq = frequency;
    this.lifespan = lifespan;
    this.mag = magnitude;
    this.field = new ForceContainer(-100, -200, 300, 270, createVector(0, -0.7));
    this.reset();
  }
  reset() {
    this.pos = createVector(random(width * 0.1, width * 0.9), height + 15);
    this.life = this.lifespan;
    this.lifeMult = random(0.6, 1.5);
    this.isErupted = false;
    this.isVenting = false;
    this.tris = [];
    this.vent = null;
    this.clipPath = new Path2D();
    let a = {};
    let b = {};
    let c = {};
    a.x = this.pos.x - 10;
    a.y = height + 15;
    b.x = this.pos.x + 10;
    b.y = height + 15;
    c.x = this.pos.x + random(12, 15);
    c.y = this.pos.y - random(10, 24);
    this.tris.push({
      a: a,
      b: b,
      c: c
    });
  }
  erupt() {
    if (this.ps.systems.indexOf(this.vent) == -1) {
      this.life--;
      this.isVenting = false;
    } else if (!(frameCount % 40)) {
      let pos = createVector(this.vent.origin.x + random(-25, 25), this.vent.origin.y - 120);
      this.chems.add(new Si(pos));
    }
    if (this.life < 0 - this.lifespan * this.lifeMult) {
      this.reset();
    }
  }
  addEmitter(pos) {
    this.vent = this.ps.constructSystem(pos.x, pos.y, 20, 500, 5);
    this.isVenting = true;
    this.field.x = pos.x;
    this.field.y = pos.y - height / 8;
  }
  update() {
    if (this.isErupted) {
      this.erupt();
      //console.log('ERUPTED');

    } else {
      for (let tri of this.tris) {
        //if (random() < 0.5) {
        this.expandCrack(tri);
        //}
      }
      if (frameCount % this.freq == 0) {
        this.crack();
      }
    }
  }
  expandCrack(tri) {
    let centroid = createVector((tri.a.x + tri.b.x + tri.c.x) / 3,
      (tri.a.y + tri.b.y + tri.c.y) / 3);
    let cv = createVector(tri.c.x - centroid.x, tri.c.y - centroid.y);
    cv.mult(1.005);
    let newPos = centroid.add(cv);
    tri.c.x = newPos.x;
    tri.c.y = newPos.y;
    let floorHeight = height - this.floorHeight - map(noise(tri.c.x / 5), 0, 1, this.floorHeight * 0.50, this.floorHeight * 3);
    if (tri.c.y < floorHeight) {
      tri.c.y = floorHeight;
      this.isErupted = true;
      this.addEmitter(tri.c);
    }
    if (tri.a.y > tri.b.y) {
      tri.a.y -= 0.03;
      tri.b.y += 0.03;
    } else {
      tri.b.y -= 0.03;
      tri.a.y += 0.03;
    }
    if (tri.a.x > tri.b.x) {
      tri.a.x += 0.03;
      tri.b.x -= 0.03;
    } else {
      tri.a.x -= 0.03;
      tri.b.x += 0.03;
    }
  }
  crack() {
    let tri = random(this.tris);
    let xRange = [random(-20, -10), random(10, 20)];
    let lowRatio = random(0.6, 0.7);
    let highRatio = random(0.8, 0.9);
    let p;
    let a = {};
    let b = {};
    let c = {};
    if (random() > 0.5) {
      p = tri.a;
    } else {
      p = tri.b;
    }
    let dx = tri.c.x - p.x;
    let dy = tri.c.y - p.y;
    //let dist = Math.sqrt(dx * dx + dy * dy);
    // console.log(dx + ',' + dy + ',' + dist);
    // console.log((dx * 0.2 / dist) + ',' + (dy * 0.2 / dist) + ',' + dist);
    a.x = p.x + dx * lowRatio;
    a.y = p.y + dy * lowRatio;
    b.x = p.x + dx * highRatio;
    b.y = p.y + dy * highRatio;

    // if (a.y > b.y) {
    //   c.x = b.x;
    //   c.y = a.y;
    // } else {
    //   c.x = a.x;
    //   c.y = b.y;
    // }
    c.x = tri.c.x + random(xRange);
    c.y = tri.c.y - random(10, 14);
    let floorHeight = height - this.floorHeight - map(noise(c.x / 5), 0, 1, this.floorHeight * 0.50, this.floorHeight * 3);
    if (c.y < floorHeight) {
      c.y = floorHeight;
      this.isErupted = true;
      this.addEmitter(c);
    }
    this.tris.push({
      a: a,
      b: b,
      c: c
    });

  }
  showCracks(images) {
    // let clipPath = new Path2D();
    let ctx = drawingContext;
    // images.createClippingPaths(this.tris, clipPath);
    // ctx.clip(clipPath);
    // let lava = images.lavaImg;
    // image(lava, width / 2, height - lava.height / 2, lava.width, lava.height);
    push();
    noStroke();
    let life = max(0, this.life);
    ctx.globalAlpha = map(life, 0, this.lifespan, 0.0, 1.0);
    ctx.fillStyle = images.pattern;
    for (let v of this.tris) {
      beginShape();
      vertex(v.a.x, v.a.y);
      vertex(v.c.x, v.c.y);
      vertex(v.b.x, v.b.y);
      endShape(CLOSE);
    }
    pop();
    // if (this.isVenting) {
    //   this.field.show(12);
    // }
  }

}
class ParticleSystems {
  constructor() {
    this.systems = [];
  }
  constructSystem(x, y, size, span, rate) {
    let emitter = {
      origin: createVector(x, y),
      size: size,
      start: frameCount,
      span: span,
      rate: rate,
      particles: []
    };
    this.systems.push(emitter);
    emitter.particles.push(new Particle(emitter));
    return emitter;
  }
  run() {
    let emitter;
    let particle;
    for (let i = this.systems.length - 1; i >= 0; i--) {
      emitter = this.systems[i];
      if (emitter.particles.length <= 0) {
        this.systems.splice(i, 1);
      } else if (frameCount % emitter.rate == 0 && frameCount < emitter.start + emitter.span) {
        emitter.particles.push(new Particle(emitter));
      }
      for (let j = emitter.particles.length - 1; j >= 0; j--) {
        particle = emitter.particles[j];
        particle.update();
        if (particle.lifeSpan <= 0) {
          emitter.particles.splice(j, 1);
        } else {
          particle.show();
        }
      }
    }
  }

}

class Particle {
  constructor(emitter) {
    this.size = emitter.size;
    this.origin = emitter.origin;
    this.lifeSpan = 200;
    this.vel = createVector(random(-0.2, 0.2), random(-2, -0.2));
    this.acc = createVector(random(-0.01, 0.01), random(-0.06, -0.02));
    this.pos = createVector(emitter.origin.x + random(-4, 4), emitter.origin.y + random(-6, 0));
  }
  update() {
    this.lifeSpan -= 2;
    this.size = this.size * 0.995;
    this.pos = this.pos.add(this.vel);
    this.vel = this.vel.add(this.acc);
  }
  show() {
    push();
    noStroke();
    fill(255, this.lifeSpan);
    ellipse(this.pos.x, this.pos.y, random(this.size * 0.90, this.size * 2), random(this.size * 0.90, this.size * 2));
    pop();
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
    this.maxDeflection = PI / 2;
    this.maxDrift = 3;
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
  applyForce(shape) {
    //TODO: find angle between body.velocity and this.acc - add angular velocity
    let pos = createVector(shape.body.position.x - this.x, shape.body.position.y - this.y);
    let angle = map(this.getAngle(pos), PI, -PI, -this.maxDeflection, this.maxDeflection);
    let dest = createVector(this.acc.x, this.acc.y);
    dest.rotate(angle);
    let mForce = Matter.Vector.create(dest.x, dest.y);
    let sideReducer = map(abs(this.x - shape.body.position.x), 0, this.width, 1, 0.15);
    mForce = Matter.Vector.mult(mForce, this.reducer * sideReducer);
    shape.applyForce(shape.body.position, createVector(mForce.x, mForce.y));
  }
  perlinShift() {
    let v = createVector(this.acc.x, this.acc.y);
    let angle = map(noise(frameCount / 100), 0, 1, -PI / 12, PI / 12);
    // let dx = map(noise(frameCount), 0, 1, -this.maxDrift, this.maxDrift);
    // let dy = map(noise(frameCount), 0, 1, -this.maxDrift, this.maxDrift);
    // let dx = random(-this.maxDrift, this.maxDrift);
    // let dy = random(-this.maxDrift, this.maxDrift);
    //
    // this.x += dx;
    // this.y += dy;
    // this.x = constrain(this.x, 0, width);
    // this.y = constrain(this.y, 0, height);
    v.rotate(angle);
    this.acc.x = v.x;
    this.acc.y = v.y;
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
          angle = map(this.getAngle(pos), PI, -PI, -this.maxDeflection, this.maxDeflection);
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

class DayCycle {
  constructor() {
    this.states = [];
    let states = this.states;
    let state;
    // dusk begins
    states.push(state = {
      start: 0,
      end: 15,
      r1: 252,
      g1: 151,
      b1: 53,
      r2: 241,
      g2: 121,
      b2: 53
    });
    states.push(state = {
      start: state.end,
      end: 30,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 214,
      g2: 97,
      b2: 62
    });
    states.push(state = {
      start: state.end,
      end: 45,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 181,
      g2: 68,
      b2: 74
    });
    states.push(state = {
      start: state.end,
      end: 60,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 148,
      g2: 39,
      b2: 85
    });
    states.push(state = {
      start: state.end,
      end: 75,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 134,
      g2: 26,
      b2: 88
    });
    // dusk ends
    states.push(state = {
      start: state.end,
      end: 90,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 134,
      g2: 26,
      b2: 88
    });
    // night descends
    states.push(state = {
      start: state.end,
      end: 180,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 114,
      g2: 9,
      b2: 94
    });
    // night
    states.push(state = {
      start: state.end,
      end: 320,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 21,
      g2: 40,
      b2: 82
    });
    //dawn starts to break
    states.push(state = {
      start: state.end,
      end: 335,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 89,
      g2: 29,
      b2: 72
    });
    states.push(state = {
      start: state.end,
      end: 350,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 104,
      g2: 16,
      b2: 68
    });
    states.push(state = {
      start: state.end,
      end: 365,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 147,
      g2: 14,
      b2: 18
    });
    states.push(state = {
      start: state.end,
      end: 380,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 255,
      g2: 10,
      b2: 10
    });
    states.push(state = {
      start: state.end,
      end: 395,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 230,
      g2: 36,
      b2: 36
    });

    // states.push(state = {
    //   start: state.end,
    //   end: 410,
    //   r1: state.r2,
    //   g1: state.g2,
    //   b1: state.b2,
    //   r2: 220,
    //   g2: 206,
    //   b2: 50
    // });
    // dawn fades to day

    // states.push(state = {
    //   start: state.end,
    //   end: 500,
    //   r1: state.r2,
    //   g1: state.g2,
    //   b1: state.b2,
    //   r2: 180,
    //   g2: 200,
    //   b2: 170
    // });

    // states.push(state = {
    //   start: state.end,
    //   end: 610,
    //   r1: state.r2,
    //   g1: state.g2,
    //   b1: state.b2,
    //   r2: 210,
    //   g2: 160,
    //   b2: 110
    // });
    states.push(state = {
      start: state.end,
      end: 720,
      r1: state.r2,
      g1: state.g2,
      b1: state.b2,
      r2: 252,
      g2: 151,
      b2: 53
    });
  }
  getColor(a) {
    let r = 252;
    let g = 151;
    let b = 53;
    let s = null;

    for (let aState of this.states) {
      if (a >= aState.start && a < aState.end) {
        s = aState;
        r = map(a, s.start, s.end, s.r1, s.r2);
        g = map(a, s.start, s.end, s.g1, s.g2);
        b = map(a, s.start, s.end, s.b1, s.b2);
        return color('rgba(' + r + '%, ' + g + '%, ' + b + '%, 0.5)');
        //console.log(s.start);
      }
    }
    //condole.log(a + ': fail');
    return color('rgba(' + r + '%, ' + g + '%, ' + b + '%, 0.2)');
  }
}
//Instances created outside of preload() may result in failure
class ImageData {
  constructor() {
    this.ctx = null;
    this.floor = null;
    this.clipShapes = [];
    this.clipPaths = new Path2D();
    //credit to "LuminousDragonGames"
    this.lavaImg = loadImage('img/lavaTiled.png');
    this.nonP5Lava = new Image();
    this.nonP5Lava.src = 'img/lavaTiled.png';
    //no credit
    this.sandImg = loadImage('img/sandTiled.png');
    //non-required credit to http://www.benkyoustudio.com
    this.stoneImg = loadImage('img/stoneTiled.png');
    //self made
    this.transLight = loadImage('img/darkMask.png');
    this.nightImg = loadImage('img/nightMask.png');
  }
  // two of each floor triangle's vertices are the bottom, a higher y value
  //one has a different x value, the difference is the width of a floor panel
  setContext(floor) {
    let x = 0;
    let dx = null;
    let y = null;
    this.ctx = drawingContext;
    this.pattern = this.ctx.createPattern(this.nonP5Lava, 'repeat');

    for (let tri of floor.bodies) {
      x = min(tri.vertices[0].x, tri.vertices[1].x, tri.vertices[2].x);
      dx = max(tri.vertices[0].x, tri.vertices[1].x, tri.vertices[2].x);
      y = max(tri.vertices[0].y, tri.vertices[1].y);
      this.clipShapes.push(tri.vertices);
      let rec = [{
        x: x - 1,
        y: y - 0.5
      }, {
        x: dx + 1,
        y: y - 0.5
      }, {
        x: dx + 1,
        y: height
      }, {
        x: x - 1,
        y: height
      }];
      this.clipShapes.push(rec);

    }
    this.createClippingPaths(this.clipShapes, this.clipPaths);
  }
  createClippingPaths(clipShapes, clipPaths) {
    let p;
    for (let verts of clipShapes) {
      p = new Path2D();
      for (let i = 0; i < verts.length; i++) {
        if (i == 0) {
          p.moveTo(verts[i].x, verts[i].y)
        } else {
          p.lineTo(verts[i].x, verts[i].y);
        }
      }
      clipPaths.addPath(p);
    }
  }

  drawBackground() {
    push();
    let gradient = this.ctx.createLinearGradient(width / 2, height / 10, width / 2, height);
    // Add three color stops
    gradient.addColorStop(0.2, '#153142');
    gradient.addColorStop(0.7, '#074A53');
    gradient.addColorStop(1, '#0A6162');
    // Set the fill style and draw a rectangle
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
    // background(140, 140, 255);
    this.drawClipped();

    pop();
  }
  drawClipped() {
    this.ctx.clip(this.clipPaths);
    let sand = this.sandImg;
    let stone = this.stoneImg;
    image(sand, 0, height - sand.height - stone.height, width, sand.height);
    image(stone, 0, height - stone.height, width, stone.height);
  }
}