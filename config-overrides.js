// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
const path = require('path')
    , webpack = require('webpack')
    // See https://medium.com/@trekinbami/using-environment-variables-in-react-6b0a99d83cf5
    , dotenv = require('dotenv')
    ;


const {override} = require("customize-cra");
const env = dotenv.config().parsed
    , envKeys = Object.keys(env).reduce((prev, next) => {
        prev[`process.env.${next}`] = JSON.stringify(env[next]);
        return prev;
      }, {}
    );


function myOverrides(config) {
/*
    config.module.rules.unshift (
          {
            test: /\.rawraw$/i,
            loader: 'raw-loader',
          }
    )
*/


    config.module.rules.unshift (
        {
            test: /\.hbs$/i,
            loader: 'handlebars-loader',
            options: {
                helperDirs: path.join(__dirname, 'src/lib/langTemplates/helpers'),
                precompileOptions: {knownHelpersOnly: false}
            }
        }
    )

    config.plugins.push (new webpack.DefinePlugin(envKeys))

    return config;
}

module.exports = override(
    myOverrides
);
  