const rules = require('./webpack.rules');
const webpack = require('webpack');

rules.push({
    test: /\.(css|scss)$/,
    use: [
      { 
        loader: 'style-loader' 
      }, 
      { 
        loader: 'css-loader' 
      },
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: function () {
              return [
                require('autoprefixer')
              ];
            }
          }
        }
      },
      { 
        loader: 'sass-loader' 
      },
      
    ],
  },
  {
    test: /\.(png|jpe?g|gif|ico|svg)$/,
    use: [
      {
        loader: "file-loader",
      }
    ]
  }
);

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
};
