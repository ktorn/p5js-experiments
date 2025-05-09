let x, y; // position
let dx = 1; // x velocity
let dy = 1; // y velocity

function setup() {
  createCanvas(windowWidth, windowHeight);
  x = width / 2;
  y = height / 2;
}

function draw() {
  background(220);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(50);

  // Draw the rectangle
  rect(x, y, 200, 100);

  // Display the time inside the rectangle
  let timeNow = millis();
  text(floor(timeNow / 1000), x, y);

  // Move the rectangle
  x += dx;
  y += dy;

  // Bounce off edges
  if (x < 100 || x > width - 100) {
    dx *= -1;
  }
  if (y < 50 || y > height - 50) {
    dy *= -1;
  }
}

function touchStarted() {
  var fs = fullscreen();
  if (!fs) {
    fullscreen(true);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Prevent default touch behavior
document.ontouchmove = function(event) {
  event.preventDefault();
};
