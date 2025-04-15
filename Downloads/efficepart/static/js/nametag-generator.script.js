document.addEventListener('DOMContentLoaded', () => {
  // タブ切り替え機能
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      // デフォルトのボタン動作を無効化
      event.preventDefault();
      
      // すべてのタブから 'active' クラスを削除
      tabs.forEach(t => t.classList.remove('active'));
      // クリックされたタブに 'active' クラスを追加
      tab.classList.add('active');
      
      // すべてのコンテンツから 'active' クラスを削除
      tabContents.forEach(content => content.classList.remove('active'));
      // 対応するコンテンツに 'active' クラスを追加
      const target = tab.getAttribute('data-tab');
      const activeContent = document.getElementById(target);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    });
  });
  
  // 他の処理はそのまま
});