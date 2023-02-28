const posenet = import('node_modules/@tensorflow-models/posenet');

// Get a reference to the video element
const video = document.getElementById('video');

// Get a reference to the canvas element
const canvas = document.getElementById('canvas');

// Define an array of lifejacket image paths
const lifejacketImages = [
  'lifejacket.png',
  'lifejacket2.png',
  'lifejacket3.png'
];

// Load the PoseNet model
async function loadModel() {
  const net = await posenet.load();
  return net;
}

// Define a dictionary to store the lifejacket image for each person
const personLifejackets = {};

async function detectObjectsAndDraw(net) {
  // Get the canvas context and draw the current video frame
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Estimate the pose of each person in the current video frame
  const poses = await net.estimateMultiplePoses(video, {
    flipHorizontal: false,
    maxDetections: 1,
    scoreThreshold: 0.5,
    nmsRadius: 20
  });

  // Loop over the estimated poses
  for (let i = 0; i < poses.length; i++) {
    // Get the ID for this person
    const personId = poses[i].keypoints[0].score;

    // If we haven't seen this person before, choose a random lifejacket for them
    if (!personLifejackets[personId]) {
      const lifejacketOptions = ['lifejacket1.png', 'lifejacket2.png', 'lifejacket3.png'];
      const randomIndex = Math.floor(Math.random() * lifejacketOptions.length);
      personLifejackets[personId] = new Image();
      personLifejackets[personId].src = lifejacketOptions[randomIndex];
    }

    // Find the key points corresponding to the shoulders and hips
    const leftShoulder = poses[i].keypoints.find(kp => kp.part === 'leftShoulder');
    const rightShoulder = poses[i].keypoints.find(kp => kp.part === 'rightShoulder');
    const leftHip = poses[i].keypoints.find(kp => kp.part === 'leftHip');
    const rightHip = poses[i].keypoints.find(kp => kp.part === 'rightHip');

    // If all key points are present, calculate the position and size of the torso
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const x = leftShoulder.position.x;
      const y = leftShoulder.position.y;
      const w = rightShoulder.position.x - leftShoulder.position.x;
      const h = leftHip.position.y - leftShoulder.position.y;

      // Draw the lifejacket on top of the torso region
      const lifejacket = personLifejackets[personId];
      ctx.globalAlpha = 1; // Set the opacity to 1 (fully opaque)

      // Calculate the width and height of the lifejacket
      const jacketWidth = w * 0.7;
      const jacketHeight = h * 1.2;

      // Calculate the x and y coordinates for the top-left corner of the lifejacket
      const jacketX = x + (w - jacketWidth) / 2;
      const jacketY = y - jacketHeight / 2;

// Draw the lifejacket with a fixed x-coordinate
ctx.drawImage(lifejacket, jacketX, jacketY, jacketWidth, jacketHeight);
}
}

// Request the next frame
requestAnimationFrame(() => detectObjectsAndDraw(net));
}

async function setupCamera() {
// Get a reference to the video element
const video = document.getElementById('video');

// Get the user's camera
const stream = await navigator.mediaDevices.getUserMedia({
'audio': false,
'video': {
facingMode: 'user',
width: { ideal: 640 },
height: { ideal: 480 }
}
});

// Set the source of the video element to the user's camera stream
video.srcObject = stream;

// Wait for the video to load enough data to play
await video.play();

// Get the canvas element
const canvas = document.getElementById('canvas');

// Set the size of the canvas to match the video element
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

// Load the PoseNet model
const net = await loadModel();

// Start detecting objects and drawing on the canvas
detectObjectsAndDraw(net);
}

// Call the setupCamera function when the page loads
window.onload = () => {
setupCamera();
};
