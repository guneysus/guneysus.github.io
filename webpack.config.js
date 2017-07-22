const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
   devtool: "source-map", // "eval", "source-map"
   
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
       new ManifestPlugin(),
       new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'src/index.html',
        inject: 'body',
        title: '/home/ahmed',
        minify: { // https://github.com/kangax/html-minifier#options-quick-reference
          collapseWhitespace: true,
          removeComments: true,
        },
       }),
        new ExtractTextPlugin({
          filename: 'styles.[hash].css',
          allChunks: true,
        }),
       new webpack.HotModuleReplacementPlugin(),
       // new UglifyJSPlugin({
       //  sourceMap: true,
       // }),  
      new webpack.SourceMapDevToolPlugin({
        filename: '[name].js.map',
        exclude: ['vendor.js']
      })    
  ],

  output: {
    filename: '[name].[hash].js',
    // path: path.resolve(__dirname, 'dist')
    path: path.resolve('/home/ahmed/workspace/web/guneysu.xyz/blog.guneysu.xyz/backend/blog/static')
  },

  devServer: {
    hot: true, // Tell the dev-server we're using HMR
    contentBase: path.resolve(__dirname, '/dist'),
    publicPath: '/'
  }     
}