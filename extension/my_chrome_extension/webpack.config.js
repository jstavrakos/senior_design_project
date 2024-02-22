const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index.tsx',
        // options: './src/options.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        chunkFilename: '[name].[chunkhash].js',
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx|tsx)$/,  // Include .tsx for TypeScript files
                exclude: /node_modules/,
                use: 'ts-loader'
            },
            {
                test: /\.css$/i,
                include: path.resolve(__dirname, 'src'),
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
            {
                test: /\.svg$/i,
                use: [
                    {
                        loader: 'svg-url-loader',
                        options: {
                            limit: 10000,
                        },
                    },
                ],
            }

        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'popup.html',
        }),
        // new HtmlWebpackPlugin({
        //     template: './public/options.html', // Path to your options.html template
        //     filename: 'options.html', // Output filename for options page
        // }),
        new CopyPlugin({
            patterns: [
                {from: './public/hand.png', to: 'hand.png'},
                {from: './public/manifest.json', to: 'manifest.json'},
                {from: './src/mvp_model.onnx', to: 'mvp_model.onnx'},
            ],
        }),
    ],
};
