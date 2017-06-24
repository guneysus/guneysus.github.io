var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');

module.exports = {
    entry: './src/index.js',
   module: {
       loaders: [
       {
           test: /\.css/,
           loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
      }
       ],
   },
   plugins: [
       // output extracted CSS to a file
       new ExtractTextPlugin('[name].[chunkhash].css')
   ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
     },   
}