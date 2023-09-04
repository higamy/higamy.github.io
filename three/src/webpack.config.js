//npx webpack --config ./three/src/webpack.config.js

const path = require('path');

module.exports = {
    mode: 'development', //production
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    entry: ['./three/src/script.ts'],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../dist'),
    },
    watch: true,
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000,
    }
};