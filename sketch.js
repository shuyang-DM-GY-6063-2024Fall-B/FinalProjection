let hexagons = new Map();
let edgesMap = new Map();

let walls = new Set();
let doors = new Set();
let lines = [];

let player;
let playerRadius = 10;
let moveSpeed = 5;
let hexRadius = 50;

let goalPosition = null;
let gameWon = false;
let restartButton;

class Wall {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  draw() {
    stroke(0, 0, 255);
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
    stroke(255, 165, 0);
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
    this.pos.set(width / 2, height / 2);
  }

  checkGoalReached() {
    if (!gameWon && goalPosition && dist(this.pos.x, this.pos.y, goalPosition.x, goalPosition.y) < this.radius) {
      gameWon = true;
      createRestartButton();
    }
  }

  draw() {
    fill(0, 255, 0);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
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
      if (random() < 0.6) {
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
    if (wallStart.x > wallEnd.x || (wallStart.x === wallEnd.x && wallStart.y > wallEnd.y)) {
      [wallStart, wallEnd] = [wallEnd, wallStart];
    }

    if (start.equals(wallStart) && end.equals(wallEnd)) {
      return true;
    }
  }

  for (let existingDoor of doors) {
    let doorStart = existingDoor.start;
    let doorEnd = existingDoor.end;
    if (doorStart.x > doorEnd.x || (doorStart.x === doorEnd.x && doorStart.y > doorEnd.y)) {
      [doorStart, doorEnd] = [doorEnd, doorStart];
    }

    if (start.equals(doorStart) && end.equals(doorEnd)) {
      return true;
    }
  }

  return false;
}
function setup() {
  createCanvas(800, 600);
  player = new Player(width / 2, height / 2, playerRadius);

  let hexWidth = hexRadius * 2;
  let hexHeight = sqrt(3) * hexRadius;
  let rows = 5;
  let cols = 5;

  let hexCenters = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let xOffset = col * hexWidth + (row % 2) * (hexWidth / 2);
      let yOffset = row * hexHeight;

      let hexagon = createHexagon(xOffset + 100, yOffset + 100, hexRadius);
      hexCenters.push(hexagon.center);
    }
  }

  let start = createVector(width / 2, height / 2);
  let minDistance = 2 * hexRadius;

  do {
    goalPosition = random(hexCenters);
  } while (dist(start.x, start.y, goalPosition.x, goalPosition.y) < minDistance);
}


function draw() {
  background(220);

  if (gameWon) {
    textAlign(CENTER, CENTER);
    textSize(50);
    fill(0, 128, 255);
    text("YOU WIN!", width / 2, height / 2 - 40);
    return;
  }

  player.move();

  for (let wall of walls) {
    wall.draw();
  }

  for (let door of doors) {
    door.draw();
  }

  if (goalPosition) {
    fill(0, 0, 255);
    noStroke();
    ellipse(goalPosition.x, goalPosition.y, 10);
  }

  player.draw();
}

function keyPressed() {
  if (key === 'O' || key === 'o') {
    let closestDoor = null;
    let minDistance = Infinity;

    for (let door of doors) {
      let doorCenter = createVector((door.start.x + door.end.x) / 2, (door.start.y + door.end.y) / 2);
      let distance = dist(player.pos.x, player.pos.y, doorCenter.x, doorCenter.y);

      if (distance < minDistance) {
        minDistance = distance;
        closestDoor = door;
      }
    }

    if (closestDoor) {
      closestDoor.open();
    }
  }
}

function createRestartButton() {
  if (restartButton) return;

  restartButton = createButton("Restart");
  restartButton.position(width / 2 - 40, height / 2 + 20);
  restartButton.mousePressed(() => {
    restartGame();
  });
}

function restartGame() {
  walls.clear();
  doors.clear();
  edgesMap.clear();
  gameWon = false;
  if (restartButton) {
    restartButton.remove();
    restartButton = null;
  }
  setup();
}

// Fake Code
// Initialize variables for visual enhancements, integration, and interaction updates
function nextWeekFeatures() {
  
  // Refine visuals
  // Update visuals such as colors, shapes, or animations for better aesthetics

  // Integrate p5.js with Arduino
  // Set up communication between p5.js and Arduino for real-time data exchange
  integrateArduino();

  // Enhance user interaction for returning to the center of the current room
  // When player touches a wall, reset their position to the center of the current room
  if (playerTouchesWall()) {
    resetPlayerToCurrentRoomCenter();
  }

  // If time allows, add wandering Dementors to the maze
  // Generate Dementors that move randomly within the maze, chasing or interacting with the player
  if (timeAllows) {
    addWanderingDementors();
  }
}


// Integrate p5.js with Arduino
function integrateArduino() {
  // Transmit player movement or other game data to Arduino
}

// Add wandering Dementors to the maze
function wanderingDementors() {
  // Create Dementor entities and place them in random positions in the maze
  // Make them wander randomly or follow the player within a defined range
  let dementor = new Dementor(randomMazePosition());
  dementor.wander();
}

// Dementor class for creating and controlling Dementors
class Dementor {
  constructor(position) {
    this.pos = position;
    this.speed = 2;
  }

  wander() {
    // Make the Dementor move randomly within the maze
    this.pos.x += random(-this.speed, this.speed);
    this.pos.y += random(-this.speed, this.speed);
  }

  draw() {
    // Visual representation of Dementor
    fill(0, 0, 0);
    ellipse(this.pos.x, this.pos.y, 20, 20);
  }
}
