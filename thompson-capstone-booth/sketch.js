let peer;
let conn;


let myPeerId = "thompson-capstone-v10-node";
let otherPeerId = "thompson-capstone-v10-screen";


let reconnectInterval = 5000;
let maxInterval = 30000;
let snapshotButton;
let capture;
let ui;

let aspectRatio = 1;

let flashAlpha = 0;
let shutterPressed = false;
let shutterSound;
let flashOverlay;

let capturedFrame = null;
let showingSnapshot = false;


function preload() {
  shutterSound = loadSound("assets/shutter.wav"); // ensure this file is in your project
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  ui = createGraphics(windowWidth, windowHeight);
  flashOverlay = createGraphics(windowWidth, windowHeight);

  // snapshotButton = createButton("snapshot");
  // snapshotButton.mousePressed(takeSnapshot);

  peer = new Peer(myPeerId);
  peer.on("open", (id) => {
    console.log("My Peer ID is:", id);
    attemptConnection();
  });

  peer.on("connection", (connection) => {
    conn = connection;
    console.log("Connected to:", conn.peer);
    setupConnectionHandlers(conn);
  });

  capture = createCapture({
    video: {
      facingMode: "user",
      width: { ideal: 1080 },
      height: { ideal: 1920 },
    },
    audio: false,
  });

  capture.size(1080, 1080);
  aspectRatio = 1080 / 1080;
  capture.hide();
}

function draw() {
  background(0);

  // Use the captured snapshot during flash; otherwise get fresh webcam frame
  let frameToDisplay = showingSnapshot && capturedFrame ? capturedFrame : capture.get();

  // Scale it proportionally to the canvas
  let scaleFactor = min(width / frameToDisplay.width, height / frameToDisplay.height);
  let scaledWidth = frameToDisplay.width * scaleFactor;
  let scaledHeight = frameToDisplay.height * scaleFactor;
  let offsetX = (width - scaledWidth) / 2;
  let offsetY = (height - scaledHeight) / 2;

  
  // Draw the frame (live or frozen)
  push();
  translate(offsetX + scaledWidth, offsetY);
  scale(-1, 1); // Flip horizontally
  image(frameToDisplay, 0, 0, scaledWidth, scaledHeight);
  pop();


  // Flash effect
  if (flashAlpha > 0) {
    flashOverlay.clear();
    flashOverlay.background(255, flashAlpha);
    image(flashOverlay, 0, 0);
    flashAlpha -= 15;
  } else {
    showingSnapshot = false; // Resume live feed after flash
  }

  // UI overlay
  drawInterface();
}


function drawInterface() {
  ui.resizeCanvas(width, height);
  ui.clear();

  // Background
  ui.background(30);

  // Screen area (erase section)
  ui.fill(230);
  ui.noStroke();
  let screenX = 75;
  let screenY = 150;
  let screenW = width - 150;
  let screenH = height - 450;
  ui.erase();
  ui.rect(screenX, screenY, screenW, screenH, 20);
  ui.noErase();

  // Title
  ui.fill(255);
  ui.textAlign(CENTER, TOP);
  ui.textSize(60);
  ui.textFont("Helvetica");
  ui.textStyle(BOLD);
  ui.text("PHOTO BOOTH", width / 2, 50);

  // Capture button
  let btnRadius = 100;
  let btnX = width / 2;
  let btnY = height - 150;

  ui.stroke(0);
  ui.strokeWeight(8);
  ui.fill(shutterPressed ? 200 : 255); // darker when pressed
  ui.ellipse(btnX, btnY, btnRadius);

  ui.noFill();
  ui.stroke(30);
  ui.strokeWeight(4);
  ui.ellipse(btnX, btnY, btnRadius - 16);

  image(ui, 0, 0);
}



function attemptConnection() {
  console.log(`Attempting to connect to ${otherPeerId}`);
  conn = peer.connect(otherPeerId);

  conn.on("open", () => {
    console.log("Connection established with:", otherPeerId);
    reconnectInterval = 1000;
    setupConnectionHandlers(conn);
  });
}

function scheduleReconnect() {
  console.log(`Scheduling reconnect in ${reconnectInterval / 1000} seconds...`);
  setTimeout(() => {
    attemptConnection();
    reconnectInterval = Math.min(reconnectInterval * 2, maxInterval);
  }, reconnectInterval);
}

function setupConnectionHandlers(connection) {
  connection.on("data", (data) => {
    console.log("Received:", data);
  });

  connection.on("close", () => {
    console.log("Connection closed.");
    scheduleReconnect();
  });

  connection.on("error", (err) => {
    console.error("Connection Error:", err);
    scheduleReconnect();
  });
}

function keyPressed() {
  if (conn && conn.open) {
    conn.send("Hello from " + myPeerId + "!");
    console.log("Sent: Hello from " + myPeerId);
  } else {
    console.log("No active connection to send data.");
  }
}

function canTakeSnapshot() {
  return flashAlpha <= 0;
}


function takeSnapshot() {
  print("Taking snapshot!");
  shutterPressed = true;

  flashAlpha = 255; // start white flash
  if (shutterSound) shutterSound.play();

  // Step 1: Get the latest webcam frame
  let snap = capture.get();

  // Step 2: Crop the center square
  let squareSize = min(snap.width, snap.height);
  let cropX = (snap.width - squareSize) / 2;
  let cropY = (snap.height - squareSize) / 2;
  let squareSnap = snap.get(cropX, cropY, squareSize, squareSize);
  capturedFrame = squareSnap; // reuse this cropped version
  showingSnapshot = true;


  // Step 3: Resize to 200x200 using a graphics buffer
  let resized = createGraphics(200, 200);
  resized.push();
  resized.translate(200, 0);  // Move origin to the right edge
  resized.scale(-1, 1);       // Flip horizontally
  resized.image(squareSnap, 0, 0, 200, 200);
  resized.pop();


  // Step 4: Convert to base64
  const imageBase64 = resized.canvas.toDataURL("image/png");

  // Step 5: Send over PeerJS
  if (conn && conn.open) {
    conn.send({ type: "image", data: imageBase64 });
    console.log("200x200 image sent!");
  } else {
    console.log("No active connection to send image.");
  }

  shutterPressed = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  ui = createGraphics(windowWidth, windowHeight);
  flashOverlay = createGraphics(windowWidth, windowHeight);
}
function touchStarted() {
  if (!fullscreen()) {
    fullscreen(true);
  }

  if (!canTakeSnapshot()) return false;

  let btnX = width / 2;
  let btnY = height - 150;
  let btnRadius = 100;

  let d = dist(mouseX, mouseY, btnX, btnY);
  if (d < btnRadius / 2) {
    takeSnapshot(); // handle state internally
  }

  return false;
}


function mousePressed() {
  if (!canTakeSnapshot()) return;

  let btnX = width / 2;
  let btnY = height - 150;
  let btnRadius = 100;

  let d = dist(mouseX, mouseY, btnX, btnY);
  if (d < btnRadius / 2) {
    takeSnapshot(); // handle state internally
  }
}


