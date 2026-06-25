import torch
import torch.nn as nn
import torch.nn.functional as F

class MoERouter(nn.Module):
    """
    1T性能を実現するための司令塔 (Router)
    入力クエリに応じて25個のエキスパートから最適なものを選択する
    """
    def __init__(self, input_dim=4096, num_experts=25):
        super().__init__()
        self.router = nn.Linear(input_dim, num_experts)
        self.num_experts = num_experts

    def forward(self, x):
        # ゲートスコアの計算 (Top-kルーティング)
        logits = self.router(x)

        # 1T性能を模した「深い文脈理解」のためのソフトマックス
        probs = F.softmax(logits, dim=-1)

        # 最も関連性の高いエキスパートのインデックスと重みを取得
        top_k_probs, top_k_indices = torch.topk(probs, k=2, dim=-1)

        return top_k_indices, top_k_probs

    def get_expert_id_for_query(self, query_vector):
        """
        特定のクエリ（ベクトル）に対して、ロードすべきエキスパートIDを1つ返す
        """
        with torch.no_grad():
            indices, _ = self.forward(query_vector)
            return indices[0][0].item()

if __name__ == "__main__":
    router = MoERouter(input_dim=512, num_experts=25)
    dummy_query = torch.randn(1, 512)
    expert_id = router.get_expert_id_for_query(dummy_query)
    print(f"Recommended Expert ID: {expert_id}")
