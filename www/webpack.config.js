const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
    entry: "./bootstrap.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bootstrap.js",
    },
    mode: "development",
    plugins: [
        new CopyWebpackPlugin(['index.html'])
    ],
    //module: {
    //    rules: [
    //        {
    //            test: /\.css$/i,
    //            use: ["style-loader", "css-loader"],
    //        },
    //    ],
    //},
    //resolve: {
    //    alias: {
    //    'styles': path.join(__dirname, 'styles'),
    //    },
    //    extensions: ['', '.js', '.jsx', '.css']
    //},
    //module: {
    //    loaders: [{
    //        test: /\.css?$/,
    //        loaders: [ 'style-loader', 'css-loader' ],
    //        include: __dirname
    //    },]
    //},
};
