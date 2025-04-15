from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 2.5)  # ユーザーは1-2.5秒の間隔でタスクを実行

    @task(1)
    def index_page(self):
        self.client.get("/")

    @task(2)
    def toc_page(self):
        self.client.get("/toc")

    @task(3)
    def static_resources(self):
        self.client.get("/static/css/style.css")
        self.client.get("/static/js/main.js")

    def on_start(self):
        """ユーザーセッション開始時の処理"""
        # ログインが必要な場合はここで実行
        pass 