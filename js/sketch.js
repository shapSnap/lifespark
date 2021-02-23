//Matter.js aliases
const Engine = Matter.Engine,
  //Render = Matter.Render,
  // Composite = Matter.Composite,
  // Composites = Matter.Composites,
  World = Matter.World,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint,
  Constraint = Matter.Constraint,
  Vertices = Matter.Vertices,
  Body = Matter.Body,
  Bodies = Matter.Bodies;
let engine;
let images;
let skyAngle;
let isPaused = false;
let world;
let floor;
let volocano;
let field;
let fields = [];
let bodies = [];
let vehicles = [];
let properties;
let shape;
let shapes = ['circle', 'trap', 'polygon', 'rect', 'tri'];
let path;
let ps;
let matterMouse;
let mConstraint;
let globalDriftVector = p5.Vector.random2D(); //.normalize().mult(0.00006);
let reducer = 0.0000003;

function preload() {
  images = new ImageData();
}

function setup() {
  const canvas = createCanvas(900, 600);
  setEngine(canvas);
  ps = new ParticleSystems();
  //ps.constructSystem(width / 2, height * 0.85, 20, 5);
  floor = new PerlinFloor(140, 70);
  volcano = new Volcanoes(ps, floor, 130, 200);
  images.setContext(floor);
  skyColor = new DayCycle();
  skyAngle = random(720);
  for (let i = 0; i < 40; i++) {
    let shapeName = shapes[Math.floor(random(shapes.length))];
    addRandomOfType(shapeName);
    //let shape = addTriangle();
  }
}
//TODO check if Continuous collisions is implemented now
//main loop
function draw() {
  let ctx = drawingContext;
  images.drawBackground();
  //field.show(12);
  if (vehicles.length < 200) {
    let shapeName = shapes[Math.floor(random(shapes.length))];
    let shape = addRandomOfType(shapeName);
    //let shape = addTriangle();
  }
  globalDriftVector.rotate(map(noise(frameCount * 100), 0, 1, -PI / 6, PI / 6));

  Engine.update(engine);
  for (let i = vehicles.length - 1; i >= 0; i--) {
    shape = vehicles[i];
    if (shape.body.position.x < -40 || shape.body.position.x > width + 40 || shape.body.position.y < -40 || shape.body.position.y > height + 40) {
      World.remove(world, shape.body);
      vehicles.splice(i, 1);
    } else {
      shape.applyGlobalDrift(globalDriftVector);
      for (let f of fields) {
        if (shape.isContained(f.x, f.y, f.width, f.height)) {
          //f.perlinShift();
          f.applyForce(shape);
          //f.show(1);
          //  Body.applyForce(shape.body, shape.body.position, field.acc);
        }
      }
      if (shape.isContained(volcano.field.x, volcano.field.y, volcano.field.width, volcano.field.height) && volcano.isVenting) {
        volcano.field.applyForce(shape);
      }
      shape.show();
      //shape.showVector();
      //drives toward a shape with similar area
      //shape.setTarget(vehicles);
      //shape.seek(shape.target);
    }
  }
  //skyAngle is time of day at beginning
  ps.run();
  lightCycle(skyAngle);
  volcano.showCracks(images);
  volcano.update();
  if (isPaused) {
    showForces();
    for (let f of fields) {
      f.show();
    }
    noLoop();
  }
}

function lightCycle(start) {
  let scroll;
  let dayLength = 8500;
  let r = 252;
  let g = 151;
  let b = 53;
  let c = color('rgba(' + r + '%, ' + g + '%, ' + b + '%, 0.2)');
  push();
  let angle = map((frameCount + start) % dayLength, 0, dayLength, 0, 720);
  //dusk rotates CCW into scene from right, transLight is rotated to imitate dusk
  if (angle < 90) {
    translate(width, height);
    rotate(radians(90 - angle));
    image(images.transLight, -images.transLight.width, -images.transLight.height);
    //c = color('rgba(252%, 156%, 84%, 0.2)');
    rotate(-radians(90 - angle));
    translate(-width, -height);

    //night descends
  } else if (angle < 360) {
    translate(width, height);
    let scroll = map(angle, 90, 180, 0, images.nightImg.height);
    image(images.transLight, -images.transLight.width, -images.transLight.height + scroll);
    image(images.nightImg, -images.nightImg.width, min(scroll - images.nightImg.height * 2, -images.nightImg.height));
    translate(-width, -height);
    //night rotates CCW out of scene and is replaced by dawn from bottom
  } else if (angle < 450) {
    translate(0, height);
    rotate(-radians(angle - 360));
    image(images.nightImg, 0, -images.nightImg.height);
    image(images.transLight, 0, 0);
    rotate(radians(angle - 360));
    translate(0, -height);
    //dawn exits scene to the left, transLight is rotated to imitate dawn
  } else if (angle < 720) {
    translate(0, height);
    let scroll = map(angle, 450, 540, 0, width);
    rotate(-PI / 2);
    image(images.transLight, 0, -scroll);
    //c = color('rgba(253%, 94%, 83%, 0.2)');
    rotate(PI / 2);
    translate(0, -height);

  } else {
    console.log(angle + ': ERROR');
  }
  blendMode(SOFT_LIGHT);
  noStroke();
  //c = color('rgba(' + r + '%, ' + g + '%, ' + b + '%, 0.2)');
  c = skyColor.getColor(angle);
  if (c == null) {
    console.log('null color');
  }
  fill(c);
  rect(0, 0, width, height);
  pop();

}

function setEngine(canvas) {
  engine = Engine.create();
  world = engine.world;
  //Provides the DOM element of canvas for matter-js event handling
  matterMouse = Mouse.create(canvas.elt);
  //fix for high density or low density pixel monitors
  matterMouse.pixelRatio = pixelDensity();
  mConstraint = MouseConstraint.create(engine, {
    mouse: matterMouse
  });
  World.add(world, mConstraint);
  world.gravity.y = 0.01;

}

function fillFields() {
  let size = 120;
  let angle;
  let angle2;
  let unitV = p5.Vector.random2D();
  let unitV2 = p5.Vector.random2D();
  unitV.normalize();
  unitV2.normalize();
  for (let i = 0; i < width / size; i++) {
    for (let j = 0; j < height / size; j++) {
      angle = map(noise(i + j), 0, 1, -PI / 2, PI / 2);
      angle2 = map(noise(i + j + size), 0, 1, -PI / 2, PI / 2);
      unitV.rotate(angle);
      fields.push(new ForceContainer(i * size, j * size, size, size, unitV));
      fields.push(new ForceContainer(i * size + size / 2, j * size + size / 2, size, size, unitV));
    }
  }
}

function showForces() {
  let size = 35;
  let inc = 0.2;
  let unitV;
  let angle;
  for (let i = 0; i < width / size; i++) {
    for (let j = 0; j < height / size; j++) {
      unitV = globalDriftVector.copy();
      unitV.normalize();
      unitV.mult(reducer);
      angle = map(noise(i * inc, j * inc), 0, 1, -PI, PI);
      unitV.rotate(angle);
      push();
      //stroke(color('rgba(255, 255, 155, .4)'));
      strokeWeight(4);
      noFill();
      translate(i * size, j * size);
      line(0, 0, unitV.x * 800000, unitV.y * 800000);
      ellipse(unitV.x * 800000, unitV.y * 800000, 4);
      pop();
    }
  }
}

function addRandomOfType(type) {
  let p = {
    type: type,
    hsl: {
      h: random(360),
      s: 100,
      l: random(35, 70)
    },
    x: random(width),
    y: random(-20, -10)
  };
  //console.log('Add Random: ' + type);
  let h = random(12, 35) / 5;
  let w = random(12, 35) / 5;
  let r = random(8, 17) / 5;
  let sides = random(5, 11);
  let slope = random(0.25, 0.75);
  switch (type) {
    case 'trap':
      p.slope = slope;
    case 'rect':
    case 'tri':
      p.w = w;
      p.h = h;
      break;
    case 'polygon':
      p.sides = sides;
    case 'circle':
      p.r = r;
      break;
      // Could create a set of convex points
    case 'path':
      break;
    default:
  }
  vehicles.push(new Vehicle(p));
  //  vehicles[vehicles.length - 1].setTarget(vehicles);
}

function addTriangle() {
  let p = {
    type: 'tri',
    hsl: {
      h: random(360),
      s: 100,
      l: random(35, 70)
    },
    x: random(width),
    y: random(-20, -10),
    w: 30,
    h: 50
  };
  vehicles.push(new Vehicle(p));
  //  vehicles[vehicles.length - 1].setTarget(vehicles);
}

function bodyForce(body) {
  let acc;
  let pos = Matter.Vector.clone(body.position);
  let vel = Matter.Vector.clone(body.velocity);
  let targetPos = Matter.Vector.create(width / 2, height / 2);
  acc = Matter.Vector.sub(targetPos, pos);
  acc = Matter.Vector.sub(acc, vel);
  acc = Matter.Vector.normalise(acc);
  acc = Matter.Vector.mult(acc, 0.06);
  Body.applyForce(body, body.position, acc);
}

function mousePressed() {
  // console.log(field.x + ',' + field.y + ',' + field.width + ',' + field.height);
  // console.log(vehicles[0].body.position);
  volcano.update();
  //  isPaused = !isPaused;
  //  if (!isPaused) {
  //    loop();
  //}
}

function addMotes() {
  for (i = 0; i < 24; i++) {
    for (j = 0; j < 24; j++) {
      motes.push(new Mote(map(i, 0, 24, width * 0.02, width * 0.98), map(j, 0, 24, height * 0.02, height * 0.98)));
    }
  }
}