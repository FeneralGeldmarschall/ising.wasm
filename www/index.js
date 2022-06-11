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
    const b_input = document.getElementById("bfield_input");
    temp_input.addEventListener("change", update_temp);
    temp_input.addEventListener("input", update_temp);
    b_input.addEventListener("change", update_bfield);
    b_input.addEventListener("input", update_bfield);
    update_temp();
    update_bfield();

    const grid_change = document.getElementById("gridsize");
    grid_change.addEventListener("change", update_grid);

    const start_btn = document.getElementById("start");
    const stop_btn = document.getElementById("stop");
    start_btn.addEventListener("click", start_simulation);
    stop_btn.addEventListener("click", stop_simulation);

    drawGrid();
    
    start_animation(20);
    //requestAnimationFrame(renderLoop);
}

function start_animation(fps) {
    //fpsInterval = 1000 / fps;
    then = window.performance.now();
    startTime = then;
    console.log(startTime);
    renderLoop();
}

function renderLoop() {
    if (stop) {
        return;
    }
    then = window.performance.now();
    const changed_len = ising.run(1);
    now = window.performance.now();
    update_values();
    elapsed = now - then;
    drawGridToCanvas(changed_len);
    requestAnimationFrame(renderLoop);
}

function drawGrid() {
    let gridsize = ising.get_S();
    const gridPtr = ising.grid_ptr();
    const grid = new Int8Array(memory.buffer, gridPtr, gridsize * gridsize);
    let ctx = canvas.getContext("2d");
    var size = 512/gridsize;
    for (let y = 0; y < gridsize; y++) {
        for (let x = 0; x < gridsize; x++) {
            // Use S to determine how big the ImageData should be
            // if canvas is 512px and we have S = 64 then each "Ising Pixel"
            // Has to be 8x8 in size, so just draw a rectangle of that size
            //console.log(S);
            let spin = grid[y * gridsize + x];//ising.get_Spin_at(x, y);
            ctx.fillStyle = spin == -1 ? "black" : "white";
            ctx.fillRect(x * size, y * size, size, size);
        }
    }
}

function drawGridToCanvas(changed_len) {
    // Get a pointer to the grid an access the spins
    // in the memory directly instead of calling a helper function
    // Should make code a bit faster (?)
    let gridsize = ising.get_S();
    const gridPtr = ising.grid_ptr();
    const grid = new Int8Array(memory.buffer, gridPtr, gridsize * gridsize);
    const changedPtr = ising.changed_ptr();
    const changed = new Uint32Array(memory.buffer, changedPtr, changed_len);
    let ctx = canvas.getContext("2d");
    var size = 512/gridsize;
    for (let i = 0; i < changed_len; i += 2) {
        let idx = changed[i + 1] * gridsize + changed[i];
        let spin = grid[idx];
        ctx.fillStyle = spin == -1 ? "black" : "white";
        ctx.fillRect(changed[i] * size, changed[i + 1] * size, size, size);
    }
    /*for (let y = 0; y < gridsize; y++) {
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
    }*/
}

function update_temp() {
    var inputTemp = parseFloat(document.getElementById('temp_input').value);
    ising.set_T(inputTemp);
    console.log(inputTemp);
    document.getElementById('temp_label').innerHTML = inputTemp.toFixed(5);
}

function update_bfield() {
    var inputB = parseFloat(document.getElementById('bfield_input').value);
    ising.set_B(inputB);
    console.log(inputB);
    document.getElementById('bfield_label').innerHTML = inputB.toFixed(5);
}

function update_values() {
    var steps = document.getElementById("mc_steps");
    var m_avg = document.getElementById("m_avg");
    var u_avg = document.getElementById("u_avg");
    steps.innerHTML = `Steps = ${ising.get_steps()}`;
    m_avg.innerHTML = `M = ${Math.abs(ising.get_M_avg().toFixed(2))}`;
    u_avg.innerHTML = `U = ${ising.get_U_avg().toFixed(2)}`;
    //var xi_mean
}

function update_grid() {
    var newB = ising.get_B();
    var newT = ising.get_T();
    var newS = parseInt(document.getElementById('gridsize').value);
    ising = IsingModell.new(newS, newB, newT, 1, Up, Seed);
    drawGrid();
}

function start_simulation() {
    stop = false;
    init();
}

function stop_simulation() {
    stop = true;
}

window.onload = init();
