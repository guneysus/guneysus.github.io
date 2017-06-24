const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
   devtool: "inline-source-map",
   
   entry: ['./src/index.js', './src/sass/styles.sass' ],
   
   module: {
    rules: [
      /*
      your other rules for JavaScript transpiling go in here
      */
      { // regular css files
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: 'css-loader?importLoaders=1',
        }),
      },
      { // sass / scss loader for webpack
        test: /\.(sass|scss)$/,
        use: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
      }
    ]
   },

   plugins: [
       new webpack.HotModuleReplacementPlugin(),
        new ExtractTextPlugin({
          filename: 'styles.css',
          allChunks: true,
        }),
  ],

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },

  devServer: {
    hot: true, // Tell the dev-server we're using HMR
    contentBase: path.resolve(__dirname),
    publicPath: '/'
  }     
}