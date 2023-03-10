mod ising {

#![allow(unused_parens)]
#![allow(non_snake_case)]

use rand::{Rng, SeedableRng};
use rand::rngs::SmallRng;
use wasm_bindgen::prelude::*;


#[wasm_bindgen]
pub struct IsingModell {
    S: usize,               // Size of Grid row, SxS Spins
    grid: Vec<i8>,          // Grid containing the spins; perhaps use a bitvector...
    B: f32,                 // external magnetic (B) field
    T: f32,                 // Temperature
    I: f32,                 // coppling constant; usually 1 but can be variable
    U: f32,                 // Energy of the current configuration
    U_avg: f32,             // Energy average
    M: f32,                 // Magnetization of the current configuration in absolute units
    M_avg: f32,             // normalized, absolute Magnetization average
    mc_step: u32,           // How many Monte Carlo steps the System already did
    rng: SmallRng,          // RNG generator; SmallRng is faster
    changed: Vec<u32>       // list of spins that changed during last Monte Carlo Step; used for faster rendering
}

#[wasm_bindgen]
impl IsingModell {
    pub fn new(size: usize, b: f32, t: f32, i: f32, up: f64, seed: u64) -> IsingModell {
        let mut rng = SmallRng::seed_from_u64(seed);
        let mut vector: Vec<i8> = Vec::with_capacity(size * size);
        let mut m = 0.0;

        // Generate Lattice and populate it
        for _y in 0..size {
            for _x in 0..size {
                let rng_spin = rng.gen_bool(up) as i8 * 2 - 1;
                vector.push(rng_spin);
                m += rng_spin as f32;
            }
        }

        // Calculate U
        let mut b_energy = 0.0;
        let mut i_energy = 0.0;
        for x in 0..size {
            for y in 0..size {
                let y_idx = y * size;
                b_energy += vector[y_idx + x] as f32;
                let xp = (x + 1) % size;
                let yp = (y + 1) % size;
                let xm = (x + size  - 1) % size;
                let ym = (y + size  - 1) % size;
                i_energy += (vector[y_idx + x] * (vector[y_idx + xp] + vector[y_idx + xm] + vector[yp * size + x] + vector[ym * size + x])) as f32; 
            }
        }

        let ch: Vec<u32> = Vec::new();
        return IsingModell { S: size, grid: (vector), M: (m), M_avg: (0.0), B: (b), U: (- b * b_energy - 0.5 * i * i_energy), 
                             U_avg: (0.0), T: (t), I: (i) , mc_step: (0), rng: (rng), changed: (ch)};
    }

    // Runs mc_steps steps of the Metropolis algorithm
    pub fn run(&mut self, mc_steps: u32) -> u32 {
        self.changed.clear();
        let S_squared: f32 = (self.S * self.S) as f32;
        let U_max: f32 = self.I * 2.0; // No / Bmax here coz average would be fucked when changing B field
        self.M_avg *= (self.mc_step as f32 * S_squared);
        self.U_avg *= (self.mc_step as f32 * S_squared);

        for _i in 0..mc_steps {

            // In each MC step we try S*S random flips
            for _j in 0..(self.S*self.S) {
                self.try_random_flip();
            }           
            
            self.M_avg += self.M;
            self.U_avg += self.U/U_max;
        }
        self.mc_step += mc_steps;
        self.M_avg /= (self.mc_step as f32 * S_squared);// /= mc_steps as f32;
        self.U_avg /= (self.mc_step as f32 * S_squared);// /= mc_steps as f32;

        return self.changed.len() as u32;
        //self.M_avg = self.M_avg.abs();
    }

    // Picks a random spin to be flipped, calculates energy dU needed to flip it
    // and then, according to the Metropolis algorithm, flips it or not
    // If spin is flipped it updates the Energy
    fn try_random_flip(&mut self) {
        let idx: usize = self.rng.gen_range(0..(self.S * self.S) as u32) as usize;
        let x: usize = (idx - (idx % self.S))/self.S;
        let y: usize = idx % self.S;
        let dU: f32 = self.calc_dU(x, y);//, self.grid[x][y] * -1i8);

        // I dont combine these 2 ifs for better readability
        // Makes the Metroplois step here more clear
        if  dU <= 0.0 {
            self.flip_spin(x, y);
            self.U += dU;
        }
        else if self.rng.gen_range(0.0..1.0) <= std::f32::consts::E.powf(-dU/self.T) {
            self.flip_spin(x, y);
            self.U += dU;
        }
    }

    // Flips spin at x, y and updates M
    fn flip_spin(&mut self, x: usize, y: usize) {
        self.changed.push(x as u32);
        self.changed.push(y as u32);
        self.set_spin(x, y, self.grid[self.get_idx(x, y)] * -1i8);
        self.M += (2 * self.grid[self.get_idx(x, y)]) as f32;
    }

    // Sets the spin to value... seems pretty useless, maybe remove later
    fn set_spin(&mut self, x: usize, y: usize, value: i8) {
        let idx: usize = self.get_idx(x, y);
        self.grid[idx] = value;
    }

    // Calculates the Energy of the current configuration
    fn calc_U(&self) -> f32{
        let mut b_energy = 0.0;
        let mut i_energy = 0.0;
        for x in 0..self.S {
            for y in 0..self.S {
                b_energy += self.grid[self.get_idx(x, y)] as f32;
                let xp = (x + 1) % self.S;
                let yp = (y + 1) % self.S;
                let xm = (x + self.S - 1) % self.S;
                let ym = (y + self.S - 1) % self.S;
                i_energy += (self.grid[self.get_idx(x, y)] * (self.grid[self.get_idx(xp, y)] 
                                                            + self.grid[self.get_idx(xm, y)] 
                                                            + self.grid[self.get_idx(x, yp)] 
                                                            + self.grid[self.get_idx(x, ym)])) as f32; 
            }
        }

        return - self.B * b_energy - 0.5 * self.I * i_energy;
    }

    // Calculates the Energy you would need to flip the Spin at [x][y]
    fn calc_dU(&self, x: usize, y: usize) -> f32 {
        let xp = (x + 1) % self.S;
        let yp = (y + 1) % self.S;
        let xm = (x + self.S - 1) % self.S;
        let ym = (y + self.S - 1) % self.S;
        return 2.0 * self.B * self.grid[self.get_idx(x, y)] as f32 
             + 2.0 * self.I * self.grid[self.get_idx(x, y)] as f32 * (self.grid[self.get_idx(xp, y)] 
                                                                    + self.grid[self.get_idx(xm, y)] 
                                                                    + self.grid[self.get_idx(x, yp)] 
                                                                    + self.grid[self.get_idx(x, ym)]) as f32;
    }

    // Loads of helper functions here
    #[inline(always)]
    fn get_idx(&self, x: usize, y: usize) -> usize {
        return y * self.S + x;
    }

    pub fn grid_ptr(&self) -> *const i8 {
        return self.grid.as_ptr();
    }

    pub fn changed_ptr(&self) -> *const u32 {
        return self.changed.as_ptr();
    }

    pub fn get_M(&self) -> f64 {
        return self.M as f64;
    }

    pub fn get_M_avg(&self) -> f64 {
        return self.M_avg as f64;
    }

    pub fn get_U(&self) -> f64 {
        return self.U as f64;
    }

    pub fn get_U_avg(&self) -> f64 {
        return self.U_avg as f64;
    }

    pub fn get_T(&self) -> f64 {
        return self.T as f64;
    }

    pub fn get_B(&self) -> f64 {
        return self.B as f64;
    }

    pub fn get_S(&self) -> usize {
        return self.S;
    }

    pub fn get_steps(&self) -> u64 {
        return self.mc_step as u64;
    }

    pub fn get_Spin_at(&self, x: usize, y: usize) -> i8 {
        return self.grid[self.get_idx(x, y)];
    }

    pub fn set_T(&mut self, newT: f64) {
        self.T = newT as f32;
    }

    pub fn set_B(&mut self, newB: f64) {
        self.B = newB as f32;
        self.U = self.calc_U();
    }

    pub fn reset_data(&mut self) {
        self.U = self.calc_U();
        self.reset_avgs();
    }

    pub fn reset_avgs(&mut self) {
        self.U_avg = 0.0;
        self.M_avg = 0.0;
        self.mc_step = 0;
    }

    // Sets all Spins to 1 or -1, depending on the current
    // dominant Spin direction
    pub fn magnetize(&mut self) {
        let spin = if self.M >= 0.0 { 1 } else { -1 };
        for i in 0..self.grid.len() {
            self.grid[i] = spin;
        }
        self.M = spin * self.grid.len();
        self.U = self.calc_U();
        self.mc_step += 1;
    }
}
}
