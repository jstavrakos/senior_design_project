# Manus Webcam Utility

## Team Members
1. Jack Stavrakos
2. Nahush Walvekar
3. Warren Xiong

## Project Overview
Our extension aims to make gesture recognition technology more accessible. Packaged as a Chrome Extension, we have created a lightweight solution will lower barriers to entry than many VR/AR or wearable tech options. Requiring only a webcam, we leverage ONNX Runtime Web to perform browser side inference on your device. 

Using a fine-tuned YOLOv8 model, we use Computer Vision to map hand symbols to keyboard shortcuts. We support 5 hand symbols. Please refer to "user_manual.md" for more detail on examples of classes and actions.

## How to Test
Please follow the instructions below to test on your own device.

### 1. Clone the Repository
Begin by cloning the main branch: ```git clone https://github.com/jstavrakos/senior_design_project.git```

### 2. Install Depedencies
Navigate to the repository. Then install packages by using the following command: ```npm install```

### 3. Build 'dist' Folder
Run ```npm run build```

On a successful run, the 'dist' folder will appear in your top level directory.

### 4. Load Unpacked Extension
Open a Chrome window and navigate to Extensions > Manage Extensions > Load Unpacked

Select the 'dist' folder created in the previous step. The extension will now be available in your Chrome Extensions.

### 5. Run Tests
Refer to "user_manual.md" for the currently supported actions. Additional information can be seen using Chrome Developer Tools. If you add any additional code that you would like to test, repeat steps 3-5.

## Our Model
link Roboflow page when finished

