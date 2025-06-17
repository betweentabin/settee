// ニュースデータの管理
class NewsManager {
  constructor() {
    this.storageKey = 'unionix_news_data';
    this.loadNewsData();
  }

  // LocalStorageからニュースデータを読み込み
  loadNewsData() {
    const storedData = localStorage.getItem(this.storageKey);
    if (storedData) {
      this.newsData = JSON.parse(storedData);
    } else {
      // 初期データ
      this.newsData = [
        {
          id: 1,
          date: '2025/06/01',
          title: 'コーポレートサイト公開のお知らせ',
          url: '#',
          isNew: true
        },
        {
          id: 2,
          date: '2025/05/01',
          title: '新しい店舗オープンのお知らせ',
          url: '#',
          isNew: false
        },
        {
          id: 3,
          date: '2025/05/01',
          title: '新しい店舗オープンのお知らせ',
          url: '#',
          isNew: false
        }
      ];
      this.saveNewsData();
    }
  }

  // LocalStorageにニュースデータを保存
  saveNewsData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.newsData));
  }

  // ニュースを追加
  addNews(newsItem) {
    const newId = this.newsData.length > 0 ? Math.max(...this.newsData.map(item => item.id)) + 1 : 1;
    const newNews = {
      id: newId,
      date: newsItem.date,
      title: newsItem.title,
      url: newsItem.url || '#',
      isNew: newsItem.isNew || false
    };
    this.newsData.unshift(newNews);
    this.saveNewsData();
    this.renderNews();
    return newNews;
  }

  // ニュースを削除
  deleteNews(id) {
    this.newsData = this.newsData.filter(item => item.id !== id);
    this.saveNewsData();
    this.renderNews();
    
    // 管理画面が開いている場合はリストを更新
    const adminPanel = document.getElementById('news-admin-panel');
    if (adminPanel) {
      this.renderAdminNewsList();
    }
  }

  // ニュースを更新
  updateNews(id, updatedData) {
    const index = this.newsData.findIndex(item => item.id === id);
    if (index !== -1) {
      this.newsData[index] = { ...this.newsData[index], ...updatedData };
      this.saveNewsData();
      this.renderNews();
    }
  }

  // ニュース項目のHTMLを生成
  createNewsItemHTML(newsItem, index) {
    return `
      <div class="flex-row-1" data-news-id="${newsItem.id}">
        <div class="date mulish-medium-thunder-13px">${newsItem.date}</div>
        <div class="text-2-1 notosansjp-medium-thunder-14px">${newsItem.title}</div>
        <div class="x102462">
          <img class="x2${index > 0 ? '-' + index : ''}" src="/src/assets/img/----2-4.svg" alt="2" />
        </div>
      </div>
      <img class="x528" src="/src/assets/img/--528-9.svg" alt="528" />
    `;
  }

  // ニュースを画面に表示
  renderNews() {
    const firstNewsContainer = document.querySelector('.x102463');
    const otherNewsContainer = document.querySelector('.x-container-1');

    if (!firstNewsContainer || !otherNewsContainer) {
      console.error('ニュースコンテナが見つかりません');
      return;
    }

    // 最初のニュース項目
    if (this.newsData[0]) {
      firstNewsContainer.innerHTML = this.createNewsItemHTML(this.newsData[0], 0);
    }

    // その他のニュース項目
    const otherNews = this.newsData.slice(1);
    otherNewsContainer.innerHTML = '';
    
    otherNews.forEach((newsItem, index) => {
      const newsElement = document.createElement('div');
      newsElement.className = 'x10246';
      newsElement.innerHTML = this.createNewsItemHTML(newsItem, index + 1);
      otherNewsContainer.appendChild(newsElement);
    });

    // クリックイベントを追加
    this.addClickEvents();
  }

  // ニュース項目のクリックイベントを追加
  addClickEvents() {
    const newsItems = document.querySelectorAll('[data-news-id]');
    newsItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const newsId = parseInt(e.currentTarget.dataset.newsId);
        const newsItem = this.newsData.find(news => news.id === newsId);
        if (newsItem && newsItem.url !== '#') {
          window.open(newsItem.url, '_blank');
        }
      });
    });
  }

  // 管理画面を表示
  showAdminPanel() {
    const adminHTML = `
      <div id="news-admin-panel" style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        width: 400px;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <h3 style="margin-top: 0; color: #333;">ニュース管理</h3>
        
        <div style="margin-bottom: 20px;">
          <h4>新しいニュースを追加</h4>
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">日付:</label>
            <input type="date" id="news-date" style="width: 100%; padding: 5px;">
          </div>
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">タイトル:</label>
            <input type="text" id="news-title" placeholder="ニュースタイトル" style="width: 100%; padding: 5px;">
          </div>
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">URL (オプション):</label>
            <input type="url" id="news-url" placeholder="https://..." style="width: 100%; padding: 5px;">
          </div>
          <button id="add-news-btn" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          ">追加</button>
        </div>

        <div>
          <h4>既存のニュース</h4>
          <div id="news-list"></div>
        </div>

        <button id="close-admin-btn" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        ">閉じる</button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', adminHTML);
    this.setupAdminEvents();
    this.renderAdminNewsList();
  }

  // 管理画面のイベントを設定
  setupAdminEvents() {
    const addBtn = document.getElementById('add-news-btn');
    const closeBtn = document.getElementById('close-admin-btn');

    addBtn.addEventListener('click', () => {
      const date = document.getElementById('news-date').value;
      const title = document.getElementById('news-title').value;
      const url = document.getElementById('news-url').value;

      if (date && title) {
        // 日付をYYYY/MM/DD形式に変換
        const formattedDate = date.replace(/-/g, '/');
        
        this.addNews({
          date: formattedDate,
          title: title,
          url: url
        });

        // フォームをクリア
        document.getElementById('news-date').value = '';
        document.getElementById('news-title').value = '';
        document.getElementById('news-url').value = '';

        this.renderAdminNewsList();
      } else {
        alert('日付とタイトルは必須です');
      }
    });

    closeBtn.addEventListener('click', () => {
      document.getElementById('news-admin-panel').remove();
    });
  }

  // 管理画面のニュースリストを表示
  renderAdminNewsList() {
    const newsList = document.getElementById('news-list');
    if (!newsList) return;

    newsList.innerHTML = this.newsData.map(news => `
      <div style="
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 4px;
      ">
        <div><strong>${news.date}</strong></div>
        <div>${news.title}</div>
        <div style="margin-top: 5px;">
          <button onclick="newsManager.deleteNews(${news.id})" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">削除</button>
        </div>
      </div>
    `).join('');
  }
}

// グローバルインスタンスを作成
const newsManager = new NewsManager();

// ページ読み込み時にニュースを表示
document.addEventListener('DOMContentLoaded', () => {
  newsManager.renderNews();
});

// 管理画面を開くためのキーボードショートカット (Ctrl+Alt+N)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.altKey && e.key === 'n') {
    e.preventDefault();
    newsManager.showAdminPanel();
  }
});

export default NewsManager; 