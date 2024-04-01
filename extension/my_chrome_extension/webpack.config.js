const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: {
        index: './src/index.tsx',
        options: './src/options.tsx',
        background: './src/background.ts',
        content: './src/content.tsx',
        off_screen: './src/off_screen.tsx',
    },
    target: ['web'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        chunkFilename: '[id].bundle_[chunkhash].js',
        libraryTarget: 'umd',
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(tsx|ts)$/,
                exclude: /node_modules/,
                use: 'ts-loader'
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: 'babel-loader'
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
            },
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
        new HtmlWebpackPlugin({
            template: './public/off_screen.html',
            filename: 'off_screen.html',
            chunks: ['off_screen'],
        }),
        new CopyPlugin({
            patterns: [
                // {from: './public/options.html', to: 'options.html'},
                // {from: './src/options.js', to: 'options.js'},
                {from: './public/hand.png', to: 'hand.png'},
                {from: './public/manifest.json', to: 'manifest.json'},
                //{from: './src/mvp_model.onnx', to: 'mvp_model.onnx'},
                {from: './src/yolov8n.onnx', to: 'yolov8n.onnx'},
                {from: './node_modules/onnxruntime-web/dist/*.wasm', to: '[name][ext]'}
            ],
        }),
        // new BundleAnalyzerPlugin()
    ],
};