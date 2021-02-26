//Matter.js aliases
const FLOORBODY = 0X0001,
  CHEMBODY = 0X0002,
  Engine = Matter.Engine,
  //Render = Matter.Render,
  // Composite = Matter.Composite,
  // Composites = Matter.Composites,
  World = Matter.World,
  Events = Matter.Events,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint,
  Constraint = Matter.Constraint,
  Vertices = Matter.Vertices,
  Body = Matter.Body,
  Bodies = Matter.Bodies;
let engine;
let isPaused = false;
let world;
let matterMouse;
let mConstraint;

function preload() {
  scene = new Scene();
}

function setup() {
  const canvas = createCanvas(900, 600);
  setEngine(canvas);
  scene.setup(world, engine);

  Events.on(engine, 'collisionStart', function(event) {
    let pairs = event.pairs;
    //console.log(pairs.length);
    for (let i = pairs.length - 1; i > -1; i--) {
      scene.collisionStart(pairs[i]);
    }
    // change object colours to show those starting a collision
    // for (var i = 0; i < pairs.length; i++) {
    //   var pair = pairs[i];
    //   pair.bodyA.render.fillStyle = '#333';
    //   pair.bodyB.render.fillStyle = '#333';
    // }
  });
  Events.on(engine, 'collisionActive', function(event) {
    let pairs = event.pairs;
    for (let i = pairs.length - 1; i > -1; i--) {
      scene.collisionActive(pairs[i]);
    }
  });
  Events.on(engine, 'collisionEnd', function(event) {
    var pairs = event.pairs;
    for (let i = pairs.length - 1; i > -1; i--) {
      scene.collisionEnd(pairs[i]);
    }
  });
}
//TODO check if Continuous collisions is implemented now
//main loop
function draw() {
  Engine.update(engine);
  scene.updateEnv();
  // if (isPaused) {
  //   showForces();
  //   for (let f of fields) {
  //     f.show();
  //   }
  //   noLoop();
  // }
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
  world.gravity.y = 0.017;

}


function mousePressed() {
  scene.addFlash({
    x: mouseX - 20,
    y: mouseY
  });
  //  isPaused = !isPaused;
  //  if (!isPaused) {
  //    loop();
  //}
}

function addRandomOfType(type) {
  let shapes = ['circle', 'trap', 'polygon', 'rect', 'tri'];
  if (!type) {
    type = random(shapes);
  }
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
  vehicles.push(new Chemical(p));
  //  vehicles[vehicles.length - 1].setTarget(vehicles);
}