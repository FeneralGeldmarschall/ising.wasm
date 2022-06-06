import { IsingModell } from "ising-webcanvas";


var S = 64;
var B = 0.0;
var I = 1.0;
var T = 2.27;
var Up = 0.5;
var Seed = BigInt(123456789);
var ising = IsingModell.new(S, B, T, I, Up, Seed);
const canvas = document.getElementById("grid");

var stop = false;
var frameCount = 0;
var fps, fpsInterval, startTime, now, then, elapsed;

//test_box.innerHTML = ising.get_M_avg();

/*function init() {
    let ising = IsingModell.new(S, B, T, I, Up, Seed);
    while (true) {
        ising.run(32);
        drawGridToCanvas(ising);
        //console.log(ising.get_M_avg());
        //console.log(ising.get_U_avg());
        //sleep(2000);
    }
}*/

function init() {
    start_animation(20);
    //requestAnimationFrame(renderLoop);
}

function start_animation(fps) {
    fpsInterval = 1000 / fps;
    then = window.performance.now();
    startTime = then;
    console.log(startTime);
    renderLoop();
}

const renderLoop = function() {
    if (stop) {
        return;
    }

    requestAnimationFrame(renderLoop);
    now = window.performance.now();
    elapsed = now - then;

    if (elapsed > fpsInterval) {

        // Get ready for next frame by setting then=now, but...
        // Also, adjust for fpsInterval not being multiple of 16.67
        then = now - (elapsed % fpsInterval);

        // draw stuff here


        // TESTING...Report #seconds since start and achieved fps.
        var sinceStart = now - startTime;
        var currentFps = Math.round(1000 / (sinceStart / ++frameCount) * 100) / 100;
        console.log(currentFps);
        ising.run(16);
        drawGridToCanvas();
    }

    //let ising = IsingModell.new(S, B, T, I, Up, Seed);
    //ising.run(16);
    //drawGridToCanvas(ising);
    //requestAnimationFrame(renderLoop);
}

function drawGridToCanvas() {
    let ctx = canvas.getContext("2d");
    //var data = ImageData(S, S, "srgb");
    //let array = new Uint8ClampedArray(S * S * 4);
    for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
            // Use S to determine how big the ImageData should be
            // if canvas is 512px and we have S = 64 then each "Ising Pixel"
            // Has to be 8x8 in size, so just draw a rectangle of that size
            //console.log(S);
            var size = 512/S;
            //var id = new ImageData(size, size);
            //var data = id.data;
            let spin = ising.get_Spin_at(x, y);
            ctx.fillStyle = spin == -1 ? "black" : "white";
            ctx.fillRect(x * size, y * size, size, size);
            //console.log(spin);
            //if (spin == -1) {
            //    data[0] = 0;
            //    data[1] = 0;
            //    data[2] = 0;
            //}
            //else {
            //    data[0] = 255;
            //    data[1] = 255;
            //    data[2] = 255;
            //}
            //data[3] = 255;
            /*let idx = y * S + x;
            array[idx] = spin < 0 ? 0 : 255;
            array[idx + 1] = spin < 0 ? 0 : 255;
            array[idx + 2] = spin < 0 ? 0 : 255;
            array[idx + 3] = 255;*/
            //ctx.putImageData(id, x, y);
        }
    }
    //let imgData = new ImageData(array, S, S);
    //ctx.putImageData(imgData, 0, 0);
    //setTimeout(1000);
}

window.onload = init();
