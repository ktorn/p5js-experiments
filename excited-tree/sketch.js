let maxLevels = 12;

let startingHue = 200;
let hue = 0;

let mic, fft;

let angle;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  colorMode(HSB);
  
  mic = new p5.AudioIn();  
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);
}

function draw() {
  
  let spectrum = fft.analyze();
  let amp = 0;
  for (let a=0; a< spectrum.length; a++){
    amp += spectrum[a];
  }
  ampAverage = amp /spectrum.length;
  
  print(ampAverage);

  angle = map(ampAverage, 0, 100, 0, 45, true);
  
  
  background(angle*3, 100, 100);
  
  
  hue = startingHue;
  translate(width/2, height);
  
  drawLine(1);
}

function drawLine(level) {
  
  let size = (height/4) * 1/level;
  
  hue = startingHue + (level*7.5);
  
  stroke(hue, 100, 100, 0.5);
  strokeWeight(5);
  
  line(0, 0, 0, -size);
  
  level++;
  
  if(level < maxLevels) {
    push();
      translate(0, -size);
      rotate(angle);
      drawLine(level);
    pop();
    push();
      translate(0, -size);
      rotate(-angle);
      drawLine(level);
    pop();
  }
}

function calculateDimensions() {
  // Scale maxDist based on the square root of the area of the canvas
  maxDist = floor(sqrt(width * height) * MAX_DIST_RATIO);
  maxNodes = 200;
  strokeBase = sqrt(width * height) * STROKE_WEIGHT_RATIO;
  nodeSize = sqrt(width * height) * NODE_SIZE_RATIO;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setup();
}


function touchStarted() {
  if (!fullscreen()) {
    fullscreen(true);
  }
}
