let hexagonCorners = [];
let walls = [];
let doors = [];
let player;
let playerRadius = 10;
let moveSpeed = 5;

class Wall {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  draw() {
    stroke(255, 0, 0);
    line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}

class Door {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  draw() {
    stroke(0, 255, 0);
    line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}

class Player {
  constructor(x, y, radius) {
    this.pos = createVector(x, y);
    this.radius = radius;
  }

  move() {
    if (keyIsPressed) {
      if (key === 'W' || key === 'w') this.pos.y -= moveSpeed;
      if (key === 'S' || key === 's') this.pos.y += moveSpeed;
      if (key === 'A' || key === 'a') this.pos.x -= moveSpeed;
      if (key === 'D' || key === 'd') this.pos.x += moveSpeed;
    }

    if (this.isTouchingLine()) {
      this.resetPosition();
    }
  }

  isTouchingLine() {
    let lines = walls.concat(doors);
    
    for (let line of lines) {
      let distance = distToLine(this.pos, line.start, line.end);
      if (distance < this.radius) {
        return true;
      }
    }
    return false;
}

  resetPosition() {
    this.pos.set(width / 2, height / 2);
  }
  draw() {
    fill(255, 0, 0);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }
}

function keyPressed() {
    if (key === 'O' || key === 'o') {
      let nearestDoor = findNearestDoor();
      if (nearestDoor) {
        doors = doors.filter(door => door !== nearestDoor);
      }
    }
  }
  
  function findNearestDoor() {
    let nearest = null;
    let minDist = Infinity;
  
    for (let door of doors) {
      let midPoint = createVector((door.start.x + door.end.x) / 2, (door.start.y + door.end.y) / 2);
      let dist = p5.Vector.dist(player.pos, midPoint);
      if (dist < minDist) {
        minDist = dist;
        nearest = door;
      }
    }
    return nearest;
  }
  
  function distToLine(point, start, end) {
    let lineVec = createVector(end.x - start.x, end.y - start.y);
    let pointVec = createVector(point.x - start.x, point.y - start.y);
    let dot = pointVec.dot(lineVec);
    let len = lineVec.mag();
    let param = dot / (len * len);
  
    let closest;
    if (param < 0) {
      closest = createVector(start.x, start.y);
    } else if (param > 1) {
      closest = createVector(end.x, end.y);
    } else {
      closest = createVector(start.x + param * lineVec.x, start.y + param * lineVec.y);
    }
  
    return p5.Vector.dist(point, closest);
  }

function setup() {
  createCanvas(windowWidth, windowHeight);

  let centerX = width / 2;
  let centerY = height / 2;
  let radius = 100;

  for (let i = 0; i < 6; i++) {
    let angle = PI * 2 / 6 * i;
    hexagonCorners.push(createVector(centerX + cos(angle) * radius, centerY + sin(angle) * radius));
  }

  for (let i = 0; i < 6; i++) {
    let start = hexagonCorners[i];
    let end = hexagonCorners[(i + 1) % 6];
    if (random() < 0.5) {
      walls.push(new Wall(start, end));
    } else {
      doors.push(new Door(start, end));
    }
  }

  player = new Player(centerX, centerY, playerRadius);
}

function draw() {
  background(255);

  for (let wall of walls) wall.draw();
  for (let door of doors) door.draw();
  player.move();
  player.draw();
}

// Follow the steps:
// Increase the number of maze rooms
// Introduce obstacles: Dementors
// Add communication interface with Arduino to receive user input
// Improve visualization
// Add background music