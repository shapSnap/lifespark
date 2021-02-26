class Chems {
  constructor() {
    this.all = [];
  }
  add(chemical) {
    this.all.push(chemical);
  }
  remove(chemical) {
    let i = this.all.indexOf(chemical);
    if (i > -1) {
      return this.all.splice(i, 1);
    } else {
      return false;
    }
  }
}

class Chemical extends Shape {
  constructor(properties) {
    //if (properties) {
    super(properties);
    //} else {
    //  console.log("LIST CHEMICAL");
    //  this.all = [];
    //  }
    this.maxForce = .0002;
    this.maxSpeed = .0001;
    this.driftForce = null;

  }
  applyGlobalDrift(drift, reducer) {
    let angle;
    let inc = 0.2;
    let x = this.body.position.x;
    let y = this.body.position.y;
    let force = drift.copy();
    force.normalize();
    force.mult(reducer);
    angle = map(noise(x * inc, y * inc), 0, 1, -PI, PI);
    force.rotate(angle);
    this.applyForce(this.body.position, force);
    this.driftForce = force;
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
  // setTarget(bodies) {
  //   let target = this.body;
  //   let areaD = null;
  //   let sidesD = null;
  //   for (let i = bodies.length - 1; i >= 0; i--) {
  //     let dif = abs(this.body.area - bodies[i].body.area);
  //     if (areaD == null && bodies[i] != this) {
  //       areaD = dif;
  //       target = bodies[i].body;
  //     } else if (bodies[i] != this && areaD > abs(this.body.area - bodies[i].body.area)) {
  //       areaD = dif;
  //       target = bodies[i].body;
  //     }
  //   }
  //   this.target = target;
  // }
  showVector() {
    push();
    //stroke(color('rgba(255, 255, 155, .4)'));
    strokeWeight(4);
    noFill();
    translate(this.body.position.x, this.body.position.y);
    line(0, 0, this.driftForce.x * 2000000, this.driftForce.y * 2000000);
    pop();
  }

}
class Si extends Chemical {
  constructor(pos) {
    //console.log('SILICON');
    let properties = {
      x: pos.x,
      y: pos.y,
      r: 10,
      sides: 3,
      type: 'polygon',
      label: 'Silicon',
      valence: 4,
      atomic: 6,
      hsl: {
        h: 26,
        s: 78,
        l: 73,
        a: 0.7
      }
    }
    super(properties);

  }
}