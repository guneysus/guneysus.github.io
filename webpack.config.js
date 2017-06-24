const path = require('path');

const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
    filename: "[name].[contenthash].css"
    // disable: process.env.NODE_ENV === "development"
});

module.exports = {
   entry: ['./src/index.js', './src/sass/main.sass'],
   module: {
    rules: [
      /*
      your other rules for JavaScript transpiling go in here
      */
      { // regular css files
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          loader: 'css-loader?importLoaders=1',
        }),
      },
      { // sass / scss loader for webpack
        test: /\.(sass|scss)$/,
        loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
      }
    ]
   },
   plugins: [
       // output extracted CSS to a file
       // new ExtractTextPlugin('[name].[chunkhash].css'),
       // new ExtractTextPlugin('[name].css'),
        new ExtractTextPlugin({ // define where to save the file
          filename: '[name].css',
          allChunks: true,
        }),
   ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
     },   
}