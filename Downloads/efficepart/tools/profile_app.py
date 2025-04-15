import cProfile
import pstats
from memory_profiler import profile
from line_profiler import LineProfiler
import os
import sys

# プロジェクトルートディレクトリをPYTHONPATHに追加
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

def profile_endpoint(endpoint):
    """特定のエンドポイントのパフォーマンスをプロファイリング"""
    profiler = cProfile.Profile()
    profiler.enable()
    
    # テストリクエストを実行
    with app.test_client() as client:
        client.get(endpoint)
    
    profiler.disable()
    stats = pstats.Stats(profiler).sort_stats('cumulative')
    stats.print_stats()

@profile
def memory_profile_endpoint(endpoint):
    """メモリ使用量のプロファイリング"""
    with app.test_client() as client:
        client.get(endpoint)

def line_profile_function(func):
    """特定の関数の行ごとのパフォーマンスをプロファイリング"""
    lp = LineProfiler()
    wrapped = lp(func)
    wrapped()
    lp.print_stats()

if __name__ == '__main__':
    # CPU時間のプロファイリング
    print("=== CPU Profiling ===")
    profile_endpoint('/')
    
    # メモリプロファイリング
    print("\n=== Memory Profiling ===")
    memory_profile_endpoint('/')
    
    # 特定の関数の行ごとのプロファイリング
    print("\n=== Line Profiling ===")
    # 例: secure_filenameのプロファイリング
    from app import secure_filename
    line_profile_function(lambda: secure_filename('test.pdf')) 