mod ising {

use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;
use plotters::prelude::*;
use wasm_bindgen::prelude::*;


#[wasm_bindgen]
pub struct IsingModell {
    S: usize, // Size of Grid row, NxN Spins
    grid: Vec<i8>, // Grid
    B: f32, // external B field
    T: f32, // Temperature
    I: f32, // coppling constant
    U: f32, // Energy
    U_avg: f32,
    M: f32, // Magnetization in absolute units
    M_avg: f32,
    mc_step: u32,
    rng: StdRng
}

#[wasm_bindgen]
impl IsingModell {
    pub fn new(size: usize, b: f32, t: f32, i: f32, up: f64, seed: u64) -> IsingModell {
        //let mut model = IsingModell { N: size, grid: vec![vec![0i8; size]; size], M: (0.0), B: (b), U: (0.0), T: (t), I: (i) , rng: (StdRng::seed_from_u64(seed))};
        let mut rng = StdRng::seed_from_u64(seed);
        let mut vector: Vec<i8> = Vec::with_capacity(size * size);
        let mut m = 0.0;
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

        
        return IsingModell { S: size, grid: (vector), M: (m), M_avg: (0.0), B: (b), U: (- b * b_energy - 0.5 * i * i_energy), 
                             U_avg: (0.0), T: (t), I: (i) , mc_step: (0), rng: (rng)};
    }

    // Runs mc_steps of the Metropolis algorithm
    //pub fn run_

    // Runs mc_steps steps of the Metropolis algorithm
    pub fn run(&mut self, mc_steps: u32) {
        // Create plot directory only if we intend to plot the grid
        for _i in 0..mc_steps {

            // In each MC step we try S*S random flips
            for _j in 0..(self.S*self.S) {
                self.try_random_flip();
            }           
            
            self.M_avg += self.M;//S_squared;
            self.U_avg += self.U;//S_squared;
            
            //if (!silent && i%(mc_steps/100)) { println!("Progress {:3.2}%", (i as f32/mc_steps as f32) * 100.0); }
        }
        self.M_avg = self.M_avg/(mc_steps as f32 * self.S as f32 * self.S as f32);// /= mc_steps as f32;
        self.U_avg = self.U_avg/(mc_steps as f32 * self.S as f32 * self.S as f32);// /= mc_steps as f32;
        self.M_avg = self.M_avg.abs();
        self.mc_step += mc_steps;
    }

    // Plots a single picture of the current spin configuration and saves it as png
    /*pub fn plot_grid(&self, caption: String, path: String) -> Result<(), Box<dyn std::error::Error>> {
        let root = BitMapBackend::new(&path, (1080, 1080)).into_drawing_area();
        root.fill(&WHITE)?;
        let mut chart = ChartBuilder::on(&root)
            .caption(&caption, ("sans-serif", 50i32))
            .margin(5i32)
            .top_x_label_area_size(40i32)
            .y_label_area_size(40i32)
            .build_cartesian_2d(0i32..self.S as i32, self.S as i32..0i32)?;

        chart
            .configure_mesh()
            .x_labels(15usize)
            .y_labels(15usize)
            .x_label_offset(35i32)
            .y_label_offset(25i32)
            .disable_x_mesh()
            .disable_y_mesh()
            .label_style(("sans-serif", 20i32))
            .draw()?;

        chart.draw_series(
            self.grid
                .iter()
                .zip(0..self.S)
                .map(|(it, y)| it.iter().zip(0..self.S).map(move |(value, x)| (value, x as i32, y as i32)))
                .flatten()
                .map(|(value, x, y)| {
                    Rectangle::new(
                        [(x, y), (x + 1, y + 1)],
                        RGBColor(
                            (126 + *value * 126) as u8,
                            (126 + *value * 126) as u8,
                            (126 + *value * 126) as u8
                        )
                        .filled(),
                    )
                }),
        )?;

        return Ok(());
    }*/

    // Picks a random spin to be flipped, calculates energy dU needed to flip it
    // and then, according to the Metropolis algorithm, flips it or not
    // If spin is flipped it updates the Energy
    fn try_random_flip(&mut self) {
        let idx: usize = self.rng.gen_range(0..(self.S * self.S) as u32) as usize;
        let x: usize = (idx - (idx % self.S))/self.S;
        let y: usize = idx % self.S;
        let du: f32 = self.calc_dU(x, y);//, self.grid[x][y] * -1i8);
        // let rng = self.rng.gen_range(0.0..1.0);

        // I dont combine these 2 ifs for better readability
        // Makes the Metroplois step here more clear
        if  du <= 0.0 {
            self.flip_spin(x, y);
            self.U += du;
            //dbg!("Flipping because du {}", du);
        }
        else if self.rng.gen_range(0.0..1.0) <= std::f32::consts::E.powf(-du/self.T) {
            self.flip_spin(x, y);
            self.U += du;
            //dbg!("Flipping because rng {}", rng);
        }
    }

    // Flips spin at x, y and updates M
    fn flip_spin(&mut self, x: usize, y: usize) {
        self.set_spin(x, y, self.grid[self.get_idx(x, y)] * -1i8);
        self.M += (2 * self.grid[self.get_idx(x, y)]) as f32;
    }

    // Sets the spin to value... seems pretty useless, maybe remove later
    fn set_spin(&mut self, x: usize, y: usize, value: i8) {
        let idx: usize = self.get_idx(x, y);
        self.grid[idx] = value;
    }

    // Calculates the Energy of the current configuration
    //fn calc_U(&self) -> f32{
    //    let mut b_energy = 0.0;
    //    let mut i_energy = 0.0;
    //    for x in 0..self.S {
    //        for y in 0..self.S {
    //            b_energy += self.grid[x][y] as f32;
    //            let xp = (x + 1) % self.S;
    //            let yp = (y + 1) % self.S;
    //            let xm = (x + self.S - 1) % self.S;
    //            let ym = (y + self.S - 1) % self.S;
    //            i_energy += (self.grid[x][y] * (self.grid[xp][y] + self.grid[xm][y] + self.grid[x][yp] + self.grid[x][ym])) as f32; 
    //        }
    //    }

    //    return - self.B * b_energy - 0.5 * self.I * i_energy;
    //}

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

    #[inline(always)]
    fn get_idx(&self, x: usize, y: usize) -> usize {
        return y * self.S + x;
    }

    pub fn grid_ptr(&self) -> *const i8 {
        return self.grid.as_ptr();
    }

    pub fn get_M_avg(&self) -> f64 {
        return self.M_avg as f64;
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

    pub fn get_Spin_at(&self, x: usize, y: usize) -> i8 {
        return self.grid[self.get_idx(x, y)];
    }

    pub fn set_T(&mut self, newT: f64) {
        self.T = newT as f32;
    }

    pub fn set_B(&mut self, newB: f64) {
        self.B = newB as f32;
    }
}
}
