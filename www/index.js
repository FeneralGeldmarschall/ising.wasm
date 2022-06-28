import { IsingModell } from "ising-webcanvas";
import { memory } from "ising-webcanvas/ising_webcanvas_bg";
//import "./style.css"

var canvasSize;
var S = 128;
var B = 0.0;
var I = 1.0;
var T = 0;
var Up = 0.5;
var Seed = BigInt(123456789);
var ising = IsingModell.new(S, B, T, I, Up, Seed);
const canvas = document.getElementById("grid");

var stop = false;
var reset_on_t_change = true;
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
    // Setting all Event listeners up
    canvasSize = document.getElementById('grid').width;

    const temp_input = document.getElementById("temp_input");
    const b_input = document.getElementById("bfield_input");
    temp_input.addEventListener("change", function() { update_temp("temp_input"); });
    temp_input.addEventListener("input", function() { update_temp("temp_input"); });
    b_input.addEventListener("change", function() { update_bfield("bfield_input"); });
    b_input.addEventListener("input", function() { update_bfield("bfield_input"); });

    const temp_input_label = document.getElementById("temp_input_label");
    const bfield_input_label = document.getElementById("bfield_input_label");
    temp_input_label.addEventListener("keyup", function(event) { update_temp("temp_input_label", event); });
    bfield_input_label.addEventListener("keyup", function(event) { update_bfield("bfield_input_label", event); });
    update_temp("temp_input");
    update_bfield("bfield_input");

    const grid_change = document.getElementById("gridsize");
    grid_change.addEventListener("change", update_grid);

    const start_btn = document.getElementById("start");
    const step_btn = document.getElementById("step");
    const stop_btn = document.getElementById("stop");
    const reset_btn = document.getElementById("reset_data");
    start_btn.addEventListener("click", start_simulation);
    step_btn.addEventListener("click", step_simulation);
    stop_btn.addEventListener("click", stop_simulation);
    reset_btn.addEventListener("click", reset_data);

    const t_change = document.getElementById("t_change_reset");
    t_change.addEventListener("change", t_change_reset);

    drawGrid();

    update_values();
    //var steps = document.getElementById("mc_steps");
    //var m_avg = document.getElementById("m_avg");
    //var u_avg = document.getElementById("u_avg");
    //steps.innerHTML = `Steps = ${ising.get_steps()}`;
    //m_avg.innerHTML = `M = ${Math.abs(ising.get_M_avg().toFixed(2))}`;
    //u_avg.innerHTML = `U = ${parseFloat(ising.get_U_avg()).toFixed(2)}`;
    
    
    startAnimation();
    //requestAnimationFrame(renderLoop);
}

function reset() {
    drawGrid();
    var steps = document.getElementById("mc_steps");
    var m_avg = document.getElementById("m_avg");
    var u_avg = document.getElementById("u_avg");
    steps.innerHTML = "Steps = 0";
    m_avg.innerHTML = `M_avg = 0\tM = ${parseFloat(ising.get_M()).toFixed(2)}`;
    u_avg.innerHTML = `U_avg = 0\tU = ${parseFloat(ising.get_U()).toFixed(2)}`;
}

function startAnimation() {
    //fpsInterval = 1000 / fps;
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
    var size = canvasSize/gridsize;
    console.log(canvasSize);
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
    var size = canvasSize/gridsize;
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

function update_temp(id, event) {
    if (id == "temp_input") {
        var inputTemp = parseFloat(document.getElementById('temp_input').value); 
    }
    else if (id == "temp_input_label") {
        if (event.key != "Enter") { return };
        var inputTemp = parseFloat(document.getElementById('temp_input_label').value);
    }
    if (inputTemp > Math.pow(10, document.getElementById('temp_input').max)) { 
        document.getElementById('temp_input_label').value = parseFloat(Math.pow(10, document.getElementById('temp_input').value)).toFixed(5);
        return; 
    }

    var min = document.getElementById('temp_input').min;
    var val= inputTemp <= min ? 0 : Math.pow(10, inputTemp);
    ising.set_T(val);
    if (reset_on_t_change) {
        ising.reset_avgs();
    }
    //console.log(inputTemp);
    document.getElementById('temp_input_label').value = val.toFixed(5);
    document.getElementById('temp_input').value = inputTemp.toFixed(5);
}

function update_bfield(id, event) {
    if (id == "bfield_input") {
        var inputB = parseFloat(document.getElementById('bfield_input').value); 
    }
    else if (id == "bfield_input_label") {
        if (event.key != "Enter") { return };
        var inputB = parseFloat(document.getElementById('bfield_input_label').value);
    }
    if (inputB > document.getElementById('bfield_input').max) { 
        document.getElementById('bfield_input_label').value = parseFloat(document.getElementById('bfield_input').value).toFixed(5);
        return; 
    }
    ising.set_B(inputB);
    //console.log(inputTemp);
    document.getElementById('bfield_input_label').value = inputB.toFixed(5);
    document.getElementById('bfield_input').value = inputB.toFixed(5);}

function update_values() {
    var steps = document.getElementById("mc_steps");
    var m_avg = document.getElementById("m_avg");
    var u_avg = document.getElementById("u_avg");
    //console.log(ising.get_U_avg());
    //console.log(ising.get_M_avg());
    steps.innerHTML = `Steps = ${ising.get_steps()}`;
    m_avg.innerHTML = `M_avg = ${Math.abs(ising.get_M_avg().toFixed(2))}\tM = ${parseFloat(ising.get_M()).toFixed(2)}`;
    u_avg.innerHTML = `U_avg = ${parseFloat(ising.get_U_avg()).toFixed(2)}\tU = ${parseFloat(ising.get_U()).toFixed(2)}`;
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
    reset();
    startAnimation();
}

function step_simulation() {
    ising.run(1);
    update_values();
    drawGrid();
}

function stop_simulation() {
    stop = true;
}

function reset_data() {
    ising.reset_data();
    reset();
    //steps.innerHTML = `Steps = 0`;
    //m_avg.innerHTML = `M_avg = 0.00\tM = 0.00`;
    //u_avg.innerHTML = `U_avg = 0.00\tU = 0.00`;
}

function t_change_reset() {
    console.log("Test");
    const checkbox = document.querySelector("#t_change_reset");
    console.log(checkbox.checked);
    if (checkbox.checked) {
        reset_on_t_change = true;
    }
    else {
        reset_on_t_change = false;
    }
}

window.onload = init();
