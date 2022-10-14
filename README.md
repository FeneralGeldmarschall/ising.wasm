<!--<div align="center">-->

## About

A 2D Ising Simulation written in Rust and rendered in JS. Combined through the power of <a href="https://webassembly.org/">Webassembly</a>.
<br>
Rendering part is heavily inspired by mattbierbaum's <a href="https://github.com/mattbierbaum/ising.js">ising.js</a>

Click <a href="https://ising.dasobereviertel.duckdns.org">here</a> for live demo.

## Usage

 1. Build with `wasm-pack build`

 2. Change to `www` directory

 3. Install npm dependencies with `npm install`

 4. Run local server with `npm run start`

 5. Access via browser on `localhost:8080`

### Or use Docker!

Just run `docker-compose up`
and then access via browser on `localhost:8080`
