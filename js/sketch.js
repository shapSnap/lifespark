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
let isPaused = false;
let world;
let floor;
let field;
let fields = [];
let bodies = [];
let vehicles = [];
let properties;
let shape;
let shapes = ['circle', 'trap', 'polygon', 'rect', 'tri'];
let path;
let matterMouse;
let mConstraint;

function preload() {

}

function setup() {
  const canvas = createCanvas(900, 600);
  setEngine(canvas);
  floor = new PerlinFloor(140, 70);
  //field = new ForceContainer(mouseX, mouseY, 120, 120);
  //fields.push(field);
  fillFields();
  for (let i = 0; i < 120; i++) {
    let shapeName = shapes[Math.floor(random(shapes.length))];
    addRandomOfType(shapeName);
  }
}
//TODO check if Continuous collisions is implemented now
//main loop
function draw() {

  background(55);
  //field.x = mouseX;
  //field.y = mouseY;
  //field.show(12);
  floor.show();
  if (vehicles.length < 120) {
    let shapeName = shapes[Math.floor(random(shapes.length))];
    let shape = addRandomOfType(shapeName);
  }

  Engine.update(engine);
  for (let i = vehicles.length - 1; i >= 0; i--) {
    shape = vehicles[i];
    if (shape.body.position.x < -40 || shape.body.position.x > width + 40 || shape.body.position.y < -40 || shape.body.position.y > height + 40) {
      World.remove(world, shape.body);
      vehicles.splice(i, 1);
    } else {
      for (let f of fields) {
        if (shape.isContained(f.x, f.y, f.width, f.height)) {
          f.perlinShift();
          f.applyForce(shape.body);
          //f.show(1);
          //  Body.applyForce(shape.body, shape.body.position, field.acc);
        }
      }
      shape.show();
      //drives toward a shape with similar area
      //shape.setTarget(vehicles);
      //shape.seek(shape.target);
    }
  }
  if (isPaused) {
    for (let f of fields) {
      f.show();
    }
    noLoop();
  }
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
  let h = random(12, 35);
  let w = random(12, 35);
  let r = random(8, 17);
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
  vehicles[vehicles.length - 1].setTarget(vehicles);
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
  isPaused = !isPaused;
  if (!isPaused) {
    loop();
  }
}

function addMotes() {
  for (i = 0; i < 24; i++) {
    for (j = 0; j < 24; j++) {
      motes.push(new Mote(map(i, 0, 24, width * 0.02, width * 0.98), map(j, 0, 24, height * 0.02, height * 0.98)));
    }
  }
}