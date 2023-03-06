// Get a reference to the video element
const video = document.getElementById('video');

// Get a reference to the canvas element
const canvas = document.getElementById('canvas');

// Define an array of lifejacket image paths
const lifejacketImages = [
  'lifejacket1.png',
  'lifejacket2.png',
  'lifejacket3.png',

];

// Load the COCO-SSD model
async function loadModel() {
  const model = await cocoSsd.load();
  return model;
}

// Define a dictionary to store the lifejacket image for each person
const personLifejackets = {};

async function detectObjectsAndDraw(model) {
  // Get the canvas context and draw the current video frame
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Detect objects in the current video frame
  const predictions = await model.detect(video);

  // Loop over the detected objects
  for (let i = 0; i < predictions.length; i++) {
    // If the object is a person, draw a lifejacket on top of their torso
    if (predictions[i].class === 'person') {
      // Get the ID for this person
      const personId = predictions[i].trackId;

      // If we haven't seen this person before, choose a random lifejacket for them
      if (!personLifejackets[personId]) {
        const lifejacketOptions = ['lifejacket1.png', 'lifejacket2.png', 'lifejacket3.png'];
        const randomIndex = Math.floor(Math.random() * lifejacketOptions.length);
        personLifejackets[personId] = new Image();
        personLifejackets[personId].src = lifejacketOptions[randomIndex];
      }

      // Get the coordinates of the bounding box around the person
      const x = predictions[i].bbox[0];
      const y = predictions[i].bbox[1];
      const w = predictions[i].bbox[2];
      const h = predictions[i].bbox[3];

      // Calculate the coordinates of the torso region
      const torsoY = y + h * 0.3;
      const torsoH = h * 0.5;
      const torsoW = w * 0.8;
      const torsoX = x + (w - torsoW) / 2; // Set the X-coordinate to the center of the bounding box

      // Draw the lifejacket on top of the torso region
      const lifejacket = personLifejackets[personId];
      ctx.globalAlpha = 1; // Set the opacity to 1 (fully opaque)
      ctx.drawImage(lifejacket, torsoX, torsoY, torsoW, torsoH);
    } else {
      // If the object is not a person, remove any existing lifejacket for this person
      const personId = predictions[i].trackId;
      personLifejackets[personId] = undefined;
    }
  }
}




  

// Start the video stream and detect objects in each frame
async function run() {
  // Get access to the camera
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  // Wait for the video to start playing
  await video.play();

  // Set the canvas size to match the video dimensions
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Load the COCO-SSD model
  const model = await loadModel();

  // Detect objects and draw a random lifejacket in each frame of the video
  setInterval(() => {
    detectObjectsAndDraw(model);
  }, 1000 / 30);
}

run();
