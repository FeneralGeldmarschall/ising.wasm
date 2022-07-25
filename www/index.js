import { IsingModell } from "ising-webcanvas";
import { memory } from "ising-webcanvas/ising_webcanvas_bg";

var canvasSize;
var S = 128;                  // Ising Gridsize
var B = 0.0;                  // External magnetic field
var I = 1.0;                  // Coupling Constant
var T = 0;                    // Temperature
var Up = 0.5;                 // Probability of newly generated Spin to be up
var Seed = BigInt(123456789); // Seed for the RNG Generator
var ising = IsingModell.new(S, B, T, I, Up, Seed);
const canvas = document.getElementById("grid");

var stop = true;
var reset_on_t_change = true;

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

    const start_btn = document.getElementById("start_stop");
    const step_btn = document.getElementById("step");
    const reset_btn = document.getElementById("reset_data");
    const magnetize = document.getElementById("magnetize");
    const reset_grid = document.getElementById("reset_grid");
    start_btn.addEventListener("click", start_stop);
    step_btn.addEventListener("click", step_simulation);
    reset_btn.addEventListener("click", reset_data);
    magnetize.addEventListener("click", magnetize_grid);
    reset_grid.addEventListener("click", reset_model);

    const t_change = document.getElementById("t_change_reset");
    t_change.addEventListener("change", t_change_reset);

    drawEntireGrid();
    update_values();
    startAnimation();
}

function reset() {
    drawEntireGrid();
    var steps = document.getElementById("mc_steps");
    var m_avg = document.getElementById("m_avg");
    var u_avg = document.getElementById("u_avg");
    steps.innerHTML = "Steps = 0";
    m_avg.innerHTML = `M_avg = 0\tM = ${parseFloat(ising.get_M()).toFixed(2)}`;
    u_avg.innerHTML = `U_avg = 0\tU = ${parseFloat(ising.get_U()).toFixed(2)}`;
}

function startAnimation() {
    renderLoop();
}

function renderLoop() {
    if (stop) {
        return;
    }
    const changed_len = ising.run(1);
    update_values();
    drawChangedPixels(changed_len);
    requestAnimationFrame(renderLoop);
}

function drawEntireGrid() {
    let gridsize = ising.get_S();
    const gridPtr = ising.grid_ptr();
    const grid = new Int8Array(memory.buffer, gridPtr, gridsize * gridsize);
    let ctx = canvas.getContext("2d");
    var size = canvasSize/gridsize;
    for (let y = 0; y < gridsize; y++) {
        for (let x = 0; x < gridsize; x++) {
            // Use S (Gridsize of the Ising Model) to determine how big the ImageData should be
            // if canvas is 512px and we have S = 64 then each "Ising Pixel"
            // Has to be 8x8 in size, so just draw a rectangle of that size
            let spin = grid[y * gridsize + x];
            ctx.fillStyle = spin == -1 ? "black" : "white";
            ctx.fillRect(x * size, y * size, size, size);
        }
    }
}

function drawChangedPixels(changed_len) {
    // Get a pointer to the grid an access the changed spins
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
}

function update_temp(id, event) {
    var val;
    var exp;
    if (id == "temp_input") {
        var inputTemp = parseFloat(document.getElementById('temp_input').value);
        var min = document.getElementById('temp_input').min;
        val = inputTemp <= min ? 0 : Math.pow(10, inputTemp);
        exp = inputTemp;
    }
    else if (id == "temp_input_label") {
        if (event.key != "Enter") return;
        var inputTemp = parseFloat(document.getElementById('temp_input_label').value);
        if (inputTemp < 0) {
            document.getElementById('temp_input_label').value = (0).toFixed(5);
            return;
        }
        exp = Math.log(inputTemp) / Math.log(10);
        val = inputTemp;
    }
    if (inputTemp > Math.pow(10, document.getElementById('temp_input').max)) { 
        document.getElementById('temp_input_label').value = parseFloat(Math.pow(10, document.getElementById('temp_input').max)).toFixed(5);
        return; 
    }

    ising.set_T(val);
    if (reset_on_t_change) {
        ising.reset_avgs();
    }

    document.getElementById('temp_input_label').value = val.toFixed(5);
    document.getElementById('temp_input').value = exp.toFixed(5);
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

    document.getElementById('bfield_input_label').value = inputB.toFixed(5);
    document.getElementById('bfield_input').value = inputB.toFixed(5);}

function update_values() {
    var steps = document.getElementById("mc_steps");
    var m_avg = document.getElementById("m_avg");
    var u_avg = document.getElementById("u_avg");

    steps.innerHTML = `Steps = ${ising.get_steps()}`;
    m_avg.innerHTML = `M_avg = ${Math.abs(ising.get_M_avg().toFixed(2))}\tM = ${parseFloat(ising.get_M()).toFixed(2)}`;
    u_avg.innerHTML = `U_avg = ${parseFloat(ising.get_U_avg()).toFixed(2)}\tU = ${parseFloat(ising.get_U()).toFixed(2)}`;
}

function update_grid() {
    var newB = ising.get_B();
    var newT = ising.get_T();
    var newS = parseInt(document.getElementById('gridsize').value);
    ising = IsingModell.new(newS, newB, newT, 1, Up, Seed);
    drawEntireGrid();
}

function start_stop() {
    stop = !stop;
    if (!stop) {

        document.getElementById("start_stop").value = "Stop";
        startAnimation();
    }
    else {
        document.getElementById("start_stop").value = "Start";
    }
}

function step_simulation() {
    ising.run(1);
    update_values();
    drawEntireGrid();
}

function reset_data() {
    ising.reset_data();
    reset();
}

function reset_model() {
    var newB = ising.get_B();
    var newT = ising.get_T();
    var newS = parseInt(document.getElementById('gridsize').value);

    ising = IsingModell.new(newS, newB, newT, 1, 0.5, BigInt(Math.floor(Math.random() * 100000)));
    drawEntireGrid();
    update_values();
}

function magnetize_grid() {
    ising.magnetize();
    drawEntireGrid();
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
