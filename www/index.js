import { IsingModell } from "ising-webcanvas";
import { memory } from "ising-webcanvas/ising_webcanvas_bg";


var S = 128;
var B = 0.0;
var I = 1.0;
var T = 0;
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
    const temp_input = document.getElementById("temp_input");
    temp_input.addEventListener("change", update_temp);
    temp_input.addEventListener("input", update_temp);
    update_temp();
    start_animation(20);
    //requestAnimationFrame(renderLoop);
}

function start_animation(fps) {
    fpsInterval = 1000 / fps;
    then = window.performance.now();
    startTime = then;
    //console.log(startTime);
    renderLoop();
}

function renderLoop() {
    if (stop) {
        return;
    }
    then = window.performance.now();
    ising.run(1);
    now = window.performance.now();
    elapsed = now - then;
    drawGridToCanvas();
    requestAnimationFrame(renderLoop);
}

function drawGridToCanvas() {
    // Get a pointer to the grid an access the spins
    // in the memory directly instead of calling a helper function
    // Should make code a bit faster (?)
    let gridsize = ising.get_S();
    const gridPtr = ising.grid_ptr();
    const grid = new Int8Array(memory.buffer, gridPtr, gridsize * gridsize);
    let ctx = canvas.getContext("2d");
    for (let y = 0; y < gridsize; y++) {
        for (let x = 0; x < gridsize; x++) {
            // Use S to determine how big the ImageData should be
            // if canvas is 512px and we have S = 64 then each "Ising Pixel"
            // Has to be 8x8 in size, so just draw a rectangle of that size
            //console.log(S);
            var size = 512/gridsize;
            let spin = grid[y * gridsize + x];//ising.get_Spin_at(x, y);
            ctx.fillStyle = spin == -1 ? "black" : "white";
            ctx.fillRect(x * size, y * size, size, size);
        }
    }
}

function update_temp() {
    var inputTemp = parseFloat(document.getElementById('temp_input').value);
    ising.set_T(inputTemp);
    console.log(inputTemp);
    document.getElementById('temp_label').innerHTML = inputTemp.toFixed(5);
}

window.onload = init();
