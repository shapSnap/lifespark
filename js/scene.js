class Scene {
  constructor() {
    this.images = new ImageData();
    this.fields = [];
    this.flashes = [];
    this.floorPairs = [];
  }
  setup(world) {
    this.world = world;
    this.engine = engine;
    this.ps = new ParticleSystems();
    this.chems = new Chems();
    //ps.constructSystem(width / 2, height * 0.85, 20, 5);
    this.floor = new PerlinFloor(140, 70);
    this.volcano = new Volcano(this.ps, this.chems, this.floor, 130, 200);
    this.images.setContext(this.floor);
    this.skyColor = new DayCycle();
    this.skyAngle = random(720);
    this.globalDriftVector = p5.Vector.random2D();
    this.reducer = 0.000003;

  }
  updateEnv() {
    this.globalDriftVector.rotate(map(noise(frameCount * 100), 0, 1, -PI / 6, PI / 6));
    this.images.drawBackground();
    this.updateShowChems();
    this.showFlashes(this.flashes);
    this.ps.run();
    this.showLightCycle(this.skyAngle);
    this.volcano.showCracks(this.images);
    this.volcano.update();
  }
  updateShowChems() {
    for (let i = this.chems.all.length - 1; i >= 0; i--) {
      let shape = this.chems.all[i];
      if (shape.body.position.x < -40 || shape.body.position.x > width + 40 || shape.body.position.y < -40 || shape.body.position.y > height + 40) {
        World.remove(this.world, shape.body);
        this.chems.remove(shape);
      } else {
        shape.applyGlobalDrift(this.globalDriftVector, this.reducer);
        for (let f of this.fields) {
          if (shape.isContained(f.x, f.y, f.width, f.height)) {
            f.applyForce(shape);
          }
        }
        if (shape.isContained(this.volcano.field.x, this.volcano.field.y, this.volcano.field.width, this.volcano.field.height) && this.volcano.isVenting) {
          this.volcano.field.applyForce(shape);
        }
        shape.show();
        //shape.showVector();
        //drives toward a shape with similar area
        //shape.setTarget(vehicles);
        //shape.seek(shape.target);
      }
    }
  }
  addFloorPair(pair) {

  }
  collisionStart(pair) {
    //console.log(pairs[0].bodyA.label);
    let a = pair.bodyA;
    let b = pair.bodyB;
    // if (a.label == 'Floor' || b.label == 'Floor') {
    //   this.addFloorPair();
    // }
    if (a.label == 'Silicon' && b.label == 'Silicon') {
      this.addFlash({
        x: (a.position.x + b.position.x) / 2,
        y: (a.position.y + b.position.y) / 2
      });
    }
  }
  collisionActive(pair) {
    this.activePair = pair;
  }
  collisionEnd(pair) {

  }
  addFlash(pos) {
    let flash = {
      pos: pos,
      life: 65
    }
    this.flashes.push(flash);
  }
  showFlashes(flashes) {
    push();
    noStroke();
    for (let f of flashes) {
      fill(255, 255, 240, map(f.life, 0, 65, 0, 255));
      ellipse(f.pos.x, f.pos.y, 3);
      f.life--;
      if (!f.life) {
        flashes.splice(flashes.indexOf(f), 1);
      }
    }
    pop();
  }
  showLightCycle(start) {
    let scroll;
    let images = this.images;
    let dayLength = 7800;
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
      image(this.images.transLight, -this.images.transLight.width, -this.images.transLight.height);
      //c = color('rgba(252%, 156%, 84%, 0.2)');
      rotate(-radians(90 - angle));
      translate(-width, -height);

      //night descends
    } else if (angle < 320) {
      translate(width, height);
      let scroll = map(angle, 90, 180, 0, this.images.nightImg.height);
      image(images.transLight, -images.transLight.width, -images.transLight.height + scroll);
      image(images.nightImg, -images.nightImg.width, min(scroll - images.nightImg.height * 2, -images.nightImg.height));
      translate(-width, -height);
      //night rotates CCW out of scene and is replaced by dawn from bottom
    } else if (angle < 410) {
      translate(0, height);
      rotate(-radians(angle - 320));
      image(images.nightImg, 0, -images.nightImg.height);
      image(images.transLight, 0, 0);
      rotate(radians(angle - 320));
      translate(0, -height);
      //dawn exits scene to the left, transLight is rotated to imitate dawn
    } else if (angle < 720) {
      translate(0, height);
      let scroll = map(angle, 410, 500, 0, width);
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
    c = this.skyColor.getColor(angle);
    if (c == null) {
      console.log('null color');
    }
    fill(c);
    rect(0, 0, width, height);
    pop();

  }
}