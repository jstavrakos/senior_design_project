import torch
#from handGestureModel import hand_gesture_model
from dummy_model import Net


def main():
  torch_model = Net()
  torch_input = torch.randn(1, 1, 32, 32)
  onnx_program = torch.onnx.dynamo_export(torch_model, torch_input)
  onnx_program.save("my_model.onnx")


if __name__ == '__main__':
  main()
