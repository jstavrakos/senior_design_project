const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index.tsx',
        options: './src/options.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        chunkFilename: '[id].bundle_[chunkhash].js',
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx|tsx|ts)$/,  // Include .tsx|.ts for TypeScript files
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
            chunks: ['index'],
        }),
        new HtmlWebpackPlugin({
            template: './public/options.html',
            filename: 'options.html',
            chunks: ['options'],
        }),
        new CopyPlugin({
            patterns: [
                // {from: './public/options.html', to: 'options.html'},
                // {from: './src/options.js', to: 'options.js'},
                {from: './public/hand.png', to: 'hand.png'},
                {from: './public/manifest.json', to: 'manifest.json'},
                {from: './src/mvp_model.onnx', to: 'mvp_model.onnx'},
                {from: './node_modules/onnxruntime-web/dist/*.wasm', to: '[name][ext]'}
            ],
        }),
    ],
};
