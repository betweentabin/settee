# test_code.py - Claude レビュー用テストコード
def calculate_sum(numbers):
    total = 0
    for i in range(len(numbers)):
        total = total + numbers[i]
    return total

def divide_numbers(a, b):
    return a / b  # ゼロ除算エラーの可能性

class User:
    def __init__(self, name, password):
        self.name = name
        self.password = password  # 平文パスワード保存（セキュリティ問題）
    
    def authenticate(self, input_password):
        if self.password == input_password:
            return True
        return False

# グローバル変数（良くない実装）
user_data = []

def add_user(name, password):
    global user_data
    user_data.append(User(name, password))
