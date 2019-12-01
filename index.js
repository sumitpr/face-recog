//import * as faceapi from "face-api.js";
const video = document.querySelector(".video");
const canvas = document.querySelector(".canvas");
const btn = document.querySelector(".btn-capture");
const image = document.querySelector(".op-image");
const width = 320;
let height = 0;
let streaming = false;
let persons = {};
let fullFaceDescriptions = [];
let detections = {};
let descriptors = {};
let faceMatcher = {};

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
			//let fullFaceDescriptions = await faceapi.detectSingleFace(image, options).withFaceLandmarks(true).withFaceDescriptors();
			//let fullFaceDescriptions = await faceapi.detectSingleFace(image, options).withFaceLandmarks(true).withFaceDescriptor();
			fullFaceDescriptions = await faceapi.detectAllFaces(image, options).withFaceLandmarks(true).withFaceDescriptors();
			console.log(fullFaceDescriptions);
			faceapi.draw.drawDetections(canvas, fullFaceDescriptions);	
			faceapi.draw.drawFaceLandmarks(canvas, fullFaceDescriptions);

			// returns a new FaceMatcher object
			faceMatcher = await createMatcher(persons);
			await recognizeDetections();
			
		} catch(err) {
			console.log(err);
		}
		
	} else {
		clearphoto();
	}
}

async function loadmodels() {

	//Promise.all([faceapi.nets.ssdMobilenetv1.loadFromUri('/models'), faceapi.nets.faceLandmark68Net.loadFromUri('/models'), faceapi.nets.faceRecognitionNet.loadFromUri('/models')]).then(streamVideo);

	try {
		await faceapi.loadTinyFaceDetectorModel('/models');
		//await faceapi.loadSsdMobilenetv1Model('/models');
		//await faceapi.loadFaceLandmarkModel('/models');
		await faceapi.loadFaceLandmarkTinyModel('/models');
		await faceapi.loadFaceRecognitionModel('/models');
		console.log("Models ready");
	} catch(err) {
		console.log(err);
	}
}

async function loadPersons() {
	try {
		const response = await fetch('descriptors/persons.json');
		persons = await response.json();
		console.log(persons);
	} catch(err) {
		console.log("Cannot parse reference models");
	}
}

async function createMatcher(referenceProfile) {
	const maxDescriptorDistance = 0.5;
	// Create labeled descriptors of member from profile
	let members = Object.keys(referenceProfile);
	let labeledDescriptors = members.map(
		member =>
		new faceapi.LabeledFaceDescriptors(
			referenceProfile[member].name,
			referenceProfile[member].descriptors.map(
				descriptor => new Float32Array(descriptor)
				)
			)
		);

	// Create face matcher (maximum descriptor distance is 0.5)
	let faceMatcher = new faceapi.FaceMatcher(
		labeledDescriptors,
		maxDescriptorDistance
		);
	return faceMatcher;
}

async function recognizeDetections() {
	if (!!fullFaceDescriptions) {
		detections =  fullFaceDescriptions.map(fd => fd.detection);
		descriptors = fullFaceDescriptions.map(fd => fd.descriptor);
	}

	if (!!descriptors && !!faceMatcher) {
		let match = await descriptors.map(descriptor =>
			faceMatcher.findBestMatch(descriptor)
			);
		console.log(match);
	}
};

async function init() {
	// start streaming video from webcam
	streamVideo();
	
	// load detection and descriptor models
	await loadmodels();
	// loads persons reference data into persons
	await loadPersons();
}

window.onload = function() {
	init();
};
