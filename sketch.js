let hexagons = new Map();
let edgesMap = new Map();
let walls = new Set();
let doors = new Set();
let lines = [];
let player;
let playerRadius = 5;
let moveSpeed = 5;
let hexRadius = 50;
let goalPosition = null;
let gameWon = false;
let dementors = [];
let projectiles = [];
let projectileSpeed = 7;
let projectileRadius = 5;
let initialPosition;
let restartButton = { x: 0, y: 0, width: 150, height: 50 };
let mSerial;
let d2Value = 0;
let d3Value = 0;

let connectButton;
let readyToReceive;
let mazeImage;

function preload() {
  mazeImage = loadImage("../Maze1.jpg");
}

class Wall {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  draw() {
    stroke(255, 215, 0);
    strokeWeight(3);
    line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}

class Door {
  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.isOpen = false;
  }

  draw() {
    stroke(101, 67, 33); 
    strokeWeight(3);
    line(this.start.x, this.start.y, this.end.x, this.end.y);
  }

  open() {
    this.isOpen = true;
    doors.delete(this);
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

    this.checkGoalReached();
  }

  isTouchingLine() {
    let lines = [...walls, ...doors];
    for (let line of lines) {
      let distance = distToLine(this.pos, line.start, line.end);
      if (distance < this.radius) {
        return true;
      }
    }
    return false;
  }

  resetPosition() {
    this.pos.set(initialPosition.x, initialPosition.y);
  }

  checkGoalReached() {
    if (!gameWon && goalPosition && dist(this.pos.x, this.pos.y, goalPosition.x, goalPosition.y) < this.radius*2) {
      gameWon = true;
    }
  }

  draw() {
    stroke(184, 115, 51);
    strokeWeight(3);
    fill(20, 20, 255);
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }
}

class Dementor {
  constructor(x, y, radius, hexCenter) {
    this.pos = createVector(x, y);
    this.radius = radius;
    this.speed = 2;
    this.target = createVector(hexCenter.x, hexCenter.y);
    this.hexCenter = hexCenter;
  }

  move() {
    let direction = p5.Vector.sub(this.target, this.pos);
    direction.setMag(this.speed);
    this.pos.add(direction);
    if (frameCount % 60 === 0) {
      const angle = random(TWO_PI);
      const distance = random(hexRadius - this.radius);
      this.target = createVector(
        this.hexCenter.x + cos(angle) * distance,
        this.hexCenter.y + sin(angle) * distance
      );
    }
  }

  draw() {
    fill(255, 255, 255, 150);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }

  isTouchingPlayer() {
    return dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y) < this.radius + player.radius;
  }
}

class Projectile {
  constructor(x, y, targetX, targetY) {
    this.pos = createVector(x, y);
    this.vel = createVector(targetX - x, targetY - y).setMag(projectileSpeed);
    this.radius = projectileRadius;
  }

  move() {
    this.pos.add(this.vel);
  }

  draw() {
    fill(255, 0, 0); 
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }

  isTouchingDementor(dementor) {
    return dist(this.pos.x, this.pos.y, dementor.pos.x, dementor.pos.y) < this.radius + dementor.radius;
  }
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

function createHexagon(centerX, centerY, radius) {
  let corners = [];
  for (let i = 0; i < 6; i++) {
    let angle = PI * 2 / 6 * i;
    corners.push(createVector(centerX + cos(angle) * radius, centerY + sin(angle) * radius));
  }

  let edges = [];
  for (let i = 0; i < 6; i++) {
    let start = corners[i];
    let end = corners[(i + 1) % 6];

    let key = `${min(start.x, start.y)},${min(end.x, end.y)}-${max(start.x, start.y)},${max(end.x, end.y)}`;

    if (!edgesMap.has(key)) {
      let edge;
      if (random() < 0.4) {
        edge = new Wall(start, end);
        if (!edgesAlreadyExist(edge)) {
          walls.add(edge);
          edgesMap.set(key, edge);
        }
      } else {
        edge = new Door(start, end);
        if (!edgesAlreadyExist(edge)) {
          doors.add(edge);
          edgesMap.set(key, edge);
        }
      }
    }
    edges.push(edgesMap.get(key));
  }

  return { center: createVector(centerX, centerY), edges };
}

function edgesAlreadyExist(edge) {
  let start = edge.start;
  let end = edge.end;

  if (start.x > end.x || (start.x === end.x && start.y > end.y)) {
    [start, end] = [end, start];
  }

  for (let existingWall of walls) {
    let wallStart = existingWall.start;
    let wallEnd = existingWall.end;
    if (wallStart.equals(start) && wallEnd.equals(end)) {
      return true;
    }
  }

  for (let existingDoor of doors) {
    let doorStart = existingDoor.start;
    let doorEnd = existingDoor.end;
    if (doorStart.equals(start) && doorEnd.equals(end)) {
      return true;
    }
  }

  return false;
}

function setup() {
  createCanvas(windowWidth, windowHeight); 
  restartButton.x = width / 2 - restartButton.width / 2;
  restartButton.y = height / 2 + 50; 

  mSerial = createSerial();

  connectButton = createButton("Connect To Serial");
  connectButton.position(width / 2 - 75, height / 2);
  connectButton.mousePressed(connectToSerial);

  let hexWidth = hexRadius * 2;
  let hexHeight = sqrt(3) * hexRadius;
  let rows = Math.ceil(height / hexHeight);
  let cols = Math.ceil(width / hexWidth);

  let hexCenters = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let xOffset = col * hexWidth + (row % 2) * (hexWidth / 2);
      let yOffset = row * hexHeight;
      let hexagon = createHexagon(xOffset, yOffset, hexRadius);
      hexCenters.push(hexagon.center);
    }
  }

  let startHex = random(hexCenters);
  initialPosition = startHex.copy();
  player = new Player(initialPosition.x, initialPosition.y, playerRadius);

  let minDistance = 2 * hexRadius;

  do {
    goalPosition = random(hexCenters);
  } while (dist(player.pos.x, player.pos.y, goalPosition.x, goalPosition.y) < minDistance);

  for (let i = 0; i < 10; i++) {
    let randomPosition = random(hexCenters);
    dementors.push(new Dementor(randomPosition.x, randomPosition.y, 15, randomPosition));
  }
  readyToReceive = false;
}

function draw() {
  background(mazeImage);

  if (gameWon) {
    fill(233, 233, 20);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("You Won! Click Restart to Play Again", width / 2, height / 2);

    fill(255);
    stroke(0);
    rect(restartButton.x, restartButton.y, restartButton.width, restartButton.height, 10);

    fill(0);
    noStroke();
    textSize(24);
    text("Restart", restartButton.x + restartButton.width / 2, restartButton.y + restartButton.height / 2 + 5);

    return;
  }

  for (let wall of walls) {
    wall.draw();
  }
  for (let door of doors) {
    door.draw();
  }

  if (goalPosition) {
    fill(255, 215, 0);
    noStroke();
    ellipse(goalPosition.x, goalPosition.y, 20);
  }

  for (let i = dementors.length - 1; i >= 0; i--) {
    let dementor = dementors[i];
    dementor.move();
    dementor.draw();
    if (dementor.isTouchingPlayer()) player.resetPosition();

    for (let j = projectiles.length - 1; j >= 0; j--) {
      if (projectiles[j].isTouchingDementor(dementor)) {
        dementors.splice(i, 1);
        projectiles.splice(j, 1);
        break;
      }
    }
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    let projectile = projectiles[i];
    projectile.move();
    projectile.draw();
    if (
      projectile.pos.x < 0 ||
      projectile.pos.x > width ||
      projectile.pos.y < 0 ||
      projectile.pos.y > height
    ) {
      projectiles.splice(i, 1);
    }
  }

  player.move();
  player.draw();

  if (d2Value === 1) {
    openNearestDoor();
  }

  if (d3Value === 1) {
    fireNearestDementor();
  }

  if (readyToReceive && mSerial.opened()) {
    mSerial.clear();
    mSerial.write(0xAB);
    readyToReceive = false;
  }

  if (mSerial.availableBytes() > 0) {
    receiveSerial();
  }
}

function openNearestDoor() {
  let nearestDoor = null;
  let minDistance = Infinity;

  for (let door of doors) {
    let distance = dist(player.pos.x, player.pos.y, (door.start.x + door.end.x) / 2, (door.start.y + door.end.y) / 2);
    if (distance < minDistance) {
      minDistance = distance;
      nearestDoor = door;
    }
  }

  if (nearestDoor) {
    nearestDoor.open();
  }

  d2Value = 0;
}

function fireNearestDementor() {
  if (dementors.length > 0) {
    let nearestDementor = null;
    let minDistance = Infinity;

    for (let dementor of dementors) {
      let distance = dist(player.pos.x, player.pos.y, dementor.pos.x, dementor.pos.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestDementor = dementor;
      }
    }

    if (nearestDementor) {
      let projectile = new Projectile(player.pos.x, player.pos.y, nearestDementor.pos.x, nearestDementor.pos.y);
      projectiles.push(projectile);
    }
  }
  d3Value = 0;
}
function receiveSerial() {
  let mLine = mSerial.readUntil("\n");
  mLine = trim(mLine);
  if (!mLine) return;
  let data = JSON.parse(mLine).data; 
  d2Value = data.D2;
  d3Value = data.D3;
  console.log(`Updated values - D2: ${d2Value}, D3: ${d3Value}`);
  readyToReceive = true;
}

function connectToSerial() {
  if (!mSerial.opened()) {
    mSerial.open(9600);
    connectButton.hide();
    readyToReceive = true;
  }
}

function mousePressed() {
  if (gameWon) {
    if (
      mouseX > restartButton.x &&
      mouseX < restartButton.x + restartButton.width &&
      mouseY > restartButton.y &&
      mouseY < restartButton.y + restartButton.height
    ) {
      location.reload(); 
    }
  }
}