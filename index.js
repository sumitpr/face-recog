//import * as faceapi from "face-api.js";
const video = document.querySelector(".video");
const canvas = document.querySelector(".canvas");
const btn = document.querySelector(".btn-capture");
const image = document.querySelector(".op-image");
const width = 320;
let height = 0;
let streaming = false;

async function streamVideo() {
	try {
		clearphoto();
		const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
		video.srcObject = stream;
		video.play();

	} catch(err) {
		console.log("Camera not available or permission denied" + err);
	}

	video.addEventListener('canplay', function(ev){
		if (!streaming) {
			height = video.videoHeight / (video.videoWidth/width);

			if (isNaN(height)) {
				height = width / (4/3);
			}

			video.setAttribute('width', width);
			video.setAttribute('height', height);
			canvas.setAttribute('width', width);
			canvas.setAttribute('height', height);
			streaming = true;
		}
	}, false);

	btn.addEventListener("click", function(e) {
		e.preventDefault();
		takepicture();
	});

}

function clearphoto() {
	var context = canvas.getContext('2d');
	context.fillStyle = "rgba(0,0,0,0.1)";
	context.fillRect(0, 0, canvas.width, canvas.height);

	var data = canvas.toDataURL('image/png');
	image.setAttribute('src', data);
}


const loadmodels = async () => {

	//Promise.all([faceapi.nets.ssdMobilenetv1.loadFromUri('/models'), faceapi.nets.faceLandmark68Net.loadFromUri('/models'), faceapi.nets.faceRecognitionNet.loadFromUri('/models')]).then(streamVideo);


	try {
		await faceapi.loadTinyFaceDetectorModel('/models');
		//await faceapi.loadSsdMobilenetv1Model('/models');
		//await faceapi.loadFaceLandmarkModel('/models');
		//await faceapi.loadFaceRecognitionModel('/models');
		console.log("Models ready");
	} catch(err) {
		console.log(err);
	}
}

async function takepicture() {
	var context = canvas.getContext('2d');
	if (width && height) {
		canvas.width = width;
		canvas.height = height;
		context.drawImage(video, 0, 0, width, height);

		var data = canvas.toDataURL('image/png');
		image.setAttribute('src', data);

		const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320 });

		try {
			//let fullFaceDescriptions = await faceapi.detectSingleFace(image, options).withFaceLandmarks();
			let fullFaceDescriptions = await faceapi.detectAllFaces(image, options);
			console.log(fullFaceDescriptions);
			faceapi.draw.drawDetections(canvas, fullFaceDescriptions);	
			//faceapi.draw.drawFaceLandmarks(canvas, fullFaceDescriptions);	
		} catch(err) {
			console.log(err);
		}
		
	} else {
		clearphoto();
	}
}

const MODEL_URL = '/models';

window.onload = function() {
	streamVideo();
	//console.log("video loaded");
	loadmodels();
};
