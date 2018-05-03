var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './public/index.babel.js',

    output: { path: path.join(__dirname, 'public'), filename: 'index.js' },
    module: {
        rules: [
            {
                test: /.babel.js$/,
                use: ['babel-loader'],
                exclude: /node_modules/
            }
        ]
    }
}