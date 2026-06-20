import torch
import torch.nn as nn
import torch.nn.functional as F

class BitLinear(nn.Linear):
    """
    BitNet b1.58: 重みを {-1, 0, 1} に制限する線形レイヤー
    """
    def forward(self, x):
        # 重みの量子化 (Deterministic Rounding)
        w = self.weight
        scale = w.abs().mean()
        w_quant = torch.round(w / (scale + 1e-7)).clamp(-1, 1)

        # ストレートスルーエスティメータ (STE)
        w_quant = w + (w_quant - w).detach()

        # 入力の量子化 (8-bit)
        x_quant = torch.clamp(torch.round(x * 127), -128, 127) / 127
        x_quant = x + (x_quant - x).detach()

        return F.linear(x_quant, w_quant, self.bias)

class BitNetExpert(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.dim = config.get('dim', 4096)
        self.layers = nn.ModuleList([
            BitLinear(self.dim, self.dim) for _ in range(config.get('n_layers', 12))
        ])

    def forward(self, x):
        for layer in self.layers:
            x = F.relu(layer(x)) + x # 残差接続
        return x

def create_expert_config(dim=4096, n_layers=12):
    return {'dim': dim, 'n_layers': n_layers}

if __name__ == "__main__":
    config = create_expert_config(dim=512, n_layers=4)
    model = BitNetExpert(config)
    dummy_input = torch.randn(1, 512)
    output = model(dummy_input)
    print(f"Output shape: {output.shape}")
