// Set up the video stream and detector.
const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
  modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING
});
const video = document.getElementById('video');

// Get the list of available cameras and create options for selection
const cameras = await navigator.mediaDevices.enumerateDevices();
const cameraSelection = document.getElementById('cameraSelection');
for (const camera of cameras) {
  if (camera.kind === 'videoinput') {
    const option = document.createElement('option');
    option.value = camera.deviceId;
    option.text = camera.label || `Camera ${cameraSelection.options.length + 1}`;
    cameraSelection.appendChild(option);
  }
}

// Set up the canvas to display the keypoints and lines.
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Load the lifejacket images.
const lifejacketImgs = [
  { src: 'lifejacket_photos/lifejacket1.png', widthRatio: 1.2 },
  { src: 'lifejacket_photos/lifejacket2.png', widthRatio: 1.4 }
];
const loadedImages = [];
for (const lifejacketImg of lifejacketImgs) {
  const img = new Image();
  img.src = lifejacketImg.src;
  img.widthRatio = lifejacketImg.widthRatio;
  loadedImages.push(img);
}

// Set the default camera selection
let selectedCamera = cameraSelection.value;

// Update the selected camera and video source when the selection changes
cameraSelection.addEventListener('change', async (event) => {
  selectedCamera = event.target.value;
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      deviceId: selectedCamera,
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  });
  video.srcObject = stream;
});

// Continuously estimate poses and update the display.
setInterval(async () => {
  const poses = await detector.estimatePoses(video);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  poses.forEach((pose, i) => {
    const leftShoulder = pose.keypoints[5];
    const rightShoulder = pose.keypoints[6];
    const leftHip = pose.keypoints[11];
    const rightHip = pose.keypoints[12];
    const bboxLeft = Math.min(leftShoulder.x, rightShoulder.x, leftHip.x, rightHip.x);
    const bboxTop = Math.min(leftShoulder.y, rightShoulder.y, leftHip.y, rightHip.y);
    const bboxWidth = Math.max(leftShoulder.x, rightShoulder.x, leftHip.x, rightHip.x) - bboxLeft;
    const bboxHeight = Math.max(leftShoulder.y, rightShoulder.y, leftHip.y, rightHip.y) - bboxTop;
    const lifejacketImg = loadedImages[i % loadedImages.length];
    const lifejacketWidth = bboxWidth * lifejacketImg.widthRatio;
    const lifejacketHeight = bboxHeight;
    const x = bboxLeft * 0.98;
    const y = bboxTop * 0.9;
    ctx.drawImage(lifejacketImg, x, y, lifejacketWidth, lifejacketHeight);
  });
}, 100);
