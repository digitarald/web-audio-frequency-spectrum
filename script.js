'use strict';

// Un-prefix
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame

var audioContext = new AudioContext();

var FFT_SIZE = 2048;

var gumStream = null;
var sourceNode = null;
var analyserNode = audioContext.createAnalyser();
analyserNode.smoothingTimeConstant = 0.0;
analyserNode.fftSize = FFT_SIZE;
var bufferLength = analyserNode.frequencyBinCount;
var frequencyData = new Uint8Array(bufferLength);
var activeBuffer = Math.round(bufferLength * 0.4);

navigator.getUserMedia(
	{
		audio: true
	},
	function streamReady(stream) {
		gumStream = stream;
		sourceNode = audioContext.createMediaStreamSource(stream);
		sourceNode.connect(analyserNode);
		// analyserNode.connect(scriptNode);
	},
	function streamError(err) {
		alert('getUserMedia: ' + err.name);
	}
);

// Interface

var displayHeight = 0;
var displayWidth = 0;

var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');

function fit() {
	displayHeight = window.innerHeight;
	displayWidth = window.innerWidth;
	canvas.width = displayWidth;
	canvas.height = displayHeight;
}
fit();

var colors = ['black', 'red', 'white'];
var colorScale = chroma.scale(colors).domain([0, 255]);
var logScale = true;
var running = true;

function tick(time) {
	requestAnimationFrame(tick);

	if (!gumStream || !running) {
		return;
	}
	ctx.drawImage(canvas, -1, 0);

	analyserNode.getByteFrequencyData(frequencyData);
	var x = displayWidth - 1;
	for (var y = 0; y < displayHeight; y++) {
		var relative = y / displayHeight;
		if (logScale) {
			relative = Math.log(relative * (Math.E - 1) + 1);
		}
		var index = Math.round(relative * activeBuffer);
		var freq = frequencyData[activeBuffer - index];
		ctx.fillStyle = colorScale(freq).css();
		ctx.fillRect(x, y, 1, 1);
	}
}

document.addEventListener('keydown', function(evt) {
	if (evt.keyCode == 32) {
		running = !running;
	} else if (evt.keyCode == 76) {
		logScale = !logScale;
	} else {
		return;
	}
	evt.preventDefault();
});

document.addEventListener('dblclick', function(evt) {
	running = !running;
	evt.preventDefault();
});

document.addEventListener('mousemove', function(evt) {
	var y = evt.screenY;
	canvas.title = y + ' Hz';
});

window.addEventListener('resize', fit);

tick();
