import cv2
import numpy as np
import onnxruntime as ort
import os
import torch

def preprocess(image_path):
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) 
    image = np.array(image) / 255.0 # normalize
    image = image.transpose(2, 0, 1) # switch from (480, 480, 3) to (3, 480, 480)
    image = np.expand_dims(image, axis=0) # make (1, 3, 480, 480)
    return image


def postprocess(output, yolo_classes):
        outputs = np.transpose(np.squeeze(output[0]))
        rows = outputs.shape[0]
        highest_probs = dict()

        for i in range(rows):
            classes_scores = outputs[i][4:]
            max_score = np.amax(classes_scores)

            if( max_score < 0.5 ):
                continue

            class_id = np.argmax(classes_scores)
            label = yolo_classes[class_id]
            if( (label not in highest_probs.keys()) or max_score > highest_probs[label]):
                highest_probs[label] = max_score

        sorted_keys = sorted(highest_probs, key=highest_probs.get, reverse=True)

        return sorted_keys

yolo_classes = ['one', 'two', 'three', 'four', 'five']
onnx_path = 'src/custom.onnx'
ort_session = ort.InferenceSession(onnx_path)
answer_key = ['four', 'two', 'two', 'three', 'one', 'four', 'three', 'one', 'five', 'five']

for i in range(1, 11):
    image_path = f"test/test_images/test_img_{i}.jpeg"
    image_data = preprocess(image_path)
    outputs = ort_session.run(None, {'images': image_data.astype(np.float32)})
    detections = postprocess(outputs, yolo_classes)
    print(f"prediction for img {i}: {detections[0]}")

