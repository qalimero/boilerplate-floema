const path = require('path');
const webpack = require('webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const IS_DEVELOPMENT = process.env.NODE_ENV === "dev";

const dirApp = path.join(__dirname, 'app');
const dirAssets = path.join(__dirname, 'assets');
const dirShared = path.join(__dirname, 'shared');
const dirStyles = path.join(__dirname, 'styles');
const dirNode = 'node_modules';

module.exports = {
  entry: [
    path.join(dirApp, 'index.js'),
    path.join(dirStyles, 'index.scss'),
  ],
  resolve: {
    modules: [
      dirApp,
      dirAssets,
      dirShared,
      dirStyles,
      dirNode
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      IS_DEVELOPMENT,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './shared',
          to: ''
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),
    new ImageMinimizerPlugin({
      minimizer: {
        implementation: ImageMinimizerPlugin.imageminMinify,
        options: {
          // Lossless optimization with custom option
          // Feel free to experiment with options for better result for you
          plugins: [
            ["gifsicle", {interlaced: true}],
            ["jpegtran", {progressive: true}],
            ["optipng", {optimizationLevel: 5}]
          ],
        },
      },
    }),
    new CleanWebpackPlugin(),

  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        //Permet d'utiliser babel-loader --> compiler de code js
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: ''
            }
          },
          //faire des import css en javascript
          {
            loader: 'css-loader'
          },
          //Génerer des prefixes automatiquement pour la compatibilité navigateur
          {
            loader: 'postcss-loader'
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        //check tout ces formats
        test: /\.(jpe?g|png|gif|svg|wof2?|fnt|webp)$/,
        //file-loader va déplacer le fichier dans le dossier output et créer le bon chemin pour y accéder
        loader: 'file-loader',
        options: {
          name(file) {
            return '[hash].[ext]'
          }
        }
      },
      {
        test: /\.(jpe?g|png|gif|svg|web)$/i,
        use: [
          {
            loader: ImageMinimizerPlugin.loader,
          },
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        type: "asset",
      },
      {
        test: /\.(glsl|frag|vert)$/,
        loader: 'raw-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(glsl|frag|vert)$/,
        loader: 'glslify-loader',
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
}
