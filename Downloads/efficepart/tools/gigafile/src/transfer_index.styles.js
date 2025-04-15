/**
 * 圧縮転送 JavaScript
 * 
 * このファイルは圧縮転送ツールの機能を実装するJavaScriptコードです。
 */



document.addEventListener('DOMContentLoaded', () => {
  // ===== 機能カードのアクティブ状態の処理 =====
  const featureCards = document.querySelectorAll('.feature-card');
  
  // まず全てのカードからactiveクラスを削除
  featureCards.forEach(card => {
    card.classList.remove('active');
  });
  
  // 圧縮転送カードをIDで特定してアクティブにする
  const compressCard = document.getElementById('compresscard');
  if (compressCard) {
    compressCard.classList.add('active');
  }
  
  featureCards.forEach(card => {
    // 圧縮転送カード以外にのみクリックイベントを追加
    if (card.id !== 'compresscard') {
      card.addEventListener('click', function() {
        // クリック時のビジュアルフィードバック
        featureCards.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
      });
    }
  });


  // ===== 保存期間選択の処理 =====
  const retentionOptions = document.querySelectorAll('.retention-option');
  let selectedRetentionPeriod = '6'; // デフォルトは6時間
  
  // 保存期間オプションのクリックイベント
  retentionOptions.forEach(option => {
    const radioInput = option.querySelector('input[type="radio"]');
    
    // 初期状態の設定
    if (radioInput.checked) {
      selectedRetentionPeriod = radioInput.value;
      option.classList.add('selected');
    }
    
    // クリックイベント
    option.addEventListener('click', () => {
      // 全てのオプションからselectedクラスを削除
      retentionOptions.forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // クリックされたオプションにselectedクラスを追加
      option.classList.add('selected');
      
      // ラジオボタンをチェック
      radioInput.checked = true;
      
      // 選択された保存期間を更新
      selectedRetentionPeriod = radioInput.value;
      console.log(`保存期間が${getRetentionPeriodText(selectedRetentionPeriod)}に設定されました`);
    });
  });
  
  // 保存期間の値からテキスト表示を取得する関数
  function getRetentionPeriodText(value) {
    const periodMap = {
      '6': '6時間',
      '12': '12時間',
      '24': '24時間',
      '72': '3日',
      '120': '5日',
      '168': '7日'
    };
    return periodMap[value] || '不明';
  }
  
  
  // ===== ドラッグ&ドロップ機能の実装 =====
  const dragDropContainer = document.querySelector('.drag-drop-container');
  const fileInput = document.getElementById('file-upload');
  let selectedFiles = []; // 選択されたファイルを保存する配列
  
  // ドラッグ&ドロップコンテナをクリックしたらファイル選択ダイアログを開く
  if (dragDropContainer && fileInput) {
    dragDropContainer.addEventListener('click', () => {
      fileInput.click();
    });

    // ファイルが選択されたときの処理
    fileInput.addEventListener('change', (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        // 新しいファイルを追加（アップロード時間はnullで初期化）
        for (let i = 0; i < files.length; i++) {
          selectedFiles.push({
            file: files[i],
            uploadTime: null
          });
        }
        updateFileList();
      }
    });

    // ドラッグオーバー時のスタイル変更
    dragDropContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragDropContainer.style.borderColor = 'var(--secondary-color)';
      dragDropContainer.style.backgroundColor = '#f0f5ff';
    });

    // ドラッグリーブ時のスタイルを元に戻す
    dragDropContainer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragDropContainer.style.borderColor = '#ccc';
      dragDropContainer.style.backgroundColor = '#f9f9f9';
    });

    // ドロップ時のファイル処理
    dragDropContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      dragDropContainer.style.borderColor = '#ccc';
      dragDropContainer.style.backgroundColor = '#f9f9f9';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // 新しいファイルを追加（アップロード時間はnullで初期化）
        for (let i = 0; i < files.length; i++) {
          selectedFiles.push({
            file: files[i],
            uploadTime: null
          });
        }
        updateFileList();
      }
    });
  }

  // 選択されたファイルリストを表示する関数
  function updateFileList() {
    if (selectedFiles.length > 0) {
      let fileListHTML = '<p>選択されたファイル:</p><ul class="file-list">';
      
      selectedFiles.forEach((fileObj) => {
        const fileSize = formatFileSize(fileObj.file.size);
        fileListHTML += `<li>${fileObj.file.name} <span class="file-size">(${fileSize})</span></li>`;
      });
      
      fileListHTML += '</ul>';
      dragDropContainer.innerHTML = fileListHTML;
    } else {
      dragDropContainer.innerHTML = '<p>ファイルをここにドラッグ&ドロップ</p>';
    }
  }

  // ファイルサイズを適切な単位に変換する関数
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }



  // ===== アップロードボタンの処理 =====
  const uploadButton = document.getElementById('upload-button');
  const resultContainer = document.getElementById('result-container');
  const generateBtn = document.getElementById('generate-btn');
  
  if (uploadButton) {
    uploadButton.addEventListener('click', async (e) => {
      e.preventDefault(); // フォームのデフォルト送信を防止
      
      // ファイルが選択されているか確認
      if (fileInput && selectedFiles.length > 0) {
        // ファイルが選択されている場合、処理を開始
        
        // 処理中の表示
        uploadButton.textContent = '処理中...';
        uploadButton.disabled = true;

        // アップロード時の時間を記録
        const uploadTime = new Date();
        selectedFiles = selectedFiles.map(fileObj => ({
          ...fileObj,
          uploadTime: uploadTime
        }));
        
        try {
          // FormDataオブジェクトを作成
          const formData = new FormData();
          
          // 選択されたファイルを追加
          selectedFiles.forEach(fileObj => {
            formData.append('files', fileObj.file);
          });
          
          // パスワードがあれば追加（オプション）
          const passwordInput = document.getElementById('download-password');
          if (passwordInput && passwordInput.value) {
            formData.append('password', passwordInput.value);
          }
          
          // サーバーにアップロード
          const response = await fetch('/upload', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'アップロードに失敗しました');
          }
          
          // レスポンスを取得
          const result = await response.json();
          console.log('サーバーからのレスポンス:', result);
          
          // アップロード結果を表示
          if (result.files && result.files.length > 0) {
            showSharingOptions(result.files);
          } else {
            throw new Error('サーバーからファイル情報が返されませんでした');
          }
        } catch (error) {
          console.error('アップロードエラー:', error);
          alert(`エラーが発生しました: ${error.message}`);
          
          // エラー時にはモックデータで表示（開発用）
          // 本番環境では削除してください
          showSharingOptions();
        } finally {
          // ボタンを元に戻す
          uploadButton.textContent = 'アップロード';
          uploadButton.disabled = false;
        }
      } else {
        // ファイルが選択されていない場合
        alert('共有するファイルを選択してください。');
        // ファイル選択ダイアログを開く
        if (fileInput) {
          fileInput.click();
        }
      }
    });
  }
  
  // 共有オプション設定画面を表示する関数
  function showSharingOptions(serverFiles) {
    if (resultContainer) {
      // 結果コンテナを表示
      resultContainer.style.display = 'block';
      
      // ZIPファイル設定ボックスの表示制御
      const zipContainer = document.getElementById('zip-container');
      if (zipContainer && selectedFiles.length > 1) {
        zipContainer.style.display = 'block';
        // ZIPファイル名のデフォルト値を設定
        const zipFilenameInput = document.getElementById('zip-filename');
        if (zipFilenameInput) {
          const now = new Date();
          const defaultZipName = `files_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
          zipFilenameInput.value = defaultZipName;
          // ZIPファイル名表示を更新
          if (typeof updateZipDisplayFilename === 'function') {
            updateZipDisplayFilename(defaultZipName);
          }
        }
      } else if (zipContainer) {
        zipContainer.style.display = 'none';
      }
      
      // 結果コンテンツをクリア
      const resultContents = document.getElementById('result-contents');
      resultContents.innerHTML = '';
      
      // 選択された保存期間（時間）を数値に変換
      const selectedRadio = document.querySelector('input[name="retention_period"]:checked');
      const retentionHours = parseInt(selectedRadio.value);
      
      // サーバーから返されたファイル情報があれば使用、なければ選択されたファイルを使用
      const filesToShow = serverFiles || selectedFiles;
      
      // 各ファイルに対して.result-contentを生成
      filesToShow.forEach((fileObj, index) => {
        const resultContent = document.createElement('div');
        resultContent.className = 'result-content';
        
        // 一意のIDを生成
        const uniqueId = `file-${index}-${Date.now()}`;
        
        // このファイルの期限時刻を計算
        let expiryTime, expiryTimeString, fileName, fileDownloadUrl;
        
        if (serverFiles) {
          // サーバーから返されたデータを使用
          fileName = fileObj.filename;
          expiryTime = new Date(fileObj.expires_at);
          fileDownloadUrl = fileObj.download_url;
          
          // ダウンロードURLが相対パスの場合、絶対URLに変換
          if (fileDownloadUrl && fileDownloadUrl.startsWith('/')) {
            const baseUrl = window.location.origin; // 現在のオリジン（プロトコル + ホスト + ポート）
            fileDownloadUrl = baseUrl + fileDownloadUrl;
          }
          
          console.log('ダウンロードURL:', fileDownloadUrl);
        } else {
          // クライアント側で生成したデータを使用（モック）
          fileName = fileObj.file.name;
          expiryTime = new Date(fileObj.uploadTime.getTime() + retentionHours * 60 * 60 * 1000);
          
          // モックの場合は現在のオリジンを使用してURLを生成
          const baseUrl = window.location.origin;
          const mockFileId = generateRandomString(10);
          fileDownloadUrl = `${baseUrl}/download/${mockFileId}`;
        }
        
        // 期限の表示形式を設定
        expiryTimeString = expiryTime.toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        resultContent.innerHTML = `
          <div class="form-group">
            <div class="uploaded-file-info">
              <div class="uploaded-filename">
                ${fileName}
                <span style="font-size: 0.85rem; color: #666; margin-left: 10px;">
                  期限: ${expiryTimeString}
                </span>
              </div>
            </div>
            
            <div class="position-inputs">
              <div class="input-wrapper">
                <div class="input-group url-display">
                  <input type="text" class="form-control first-input share-url" id="share-url-${uniqueId}" readonly value="${fileDownloadUrl}" />
                  <button class="copy-btn copy-url-btn" data-target="share-url-${uniqueId}">コピー</button>
                </div>
              </div>
            </div>
            
            <div class="position-inputs">
              <div class="input-wrapper">
                <div class="input-group password-group">
                  <input type="text" class="form-control download-password" id="download-password-${uniqueId}" placeholder="パスワードを入力（任意）" />
                  <button class="generate-password-btn" data-target="download-password-${uniqueId}">自動生成</button>
                  <button class="copy-btn copy-password-btn" data-target="download-password-${uniqueId}">コピー</button>
                </div>
              </div>
            </div>
            
            <div class="position-inputs">
              <div class="input-wrapper">
                <div class="qr-container">
                  <button class="qr-display-btn" data-target="qr-${uniqueId}">QRコードを表示</button>
                  <div class="qr-code" id="qr-code-${uniqueId}" style="display: none;">
                    <div class="qr-placeholder">QRコードを生成中...</div>
                  </div>
                  <div class="qr-options" id="qr-options-${uniqueId}" style="display: none;">
                    <button class="qr-btn download-qr-btn" data-target="qr-${uniqueId}">QRコードを保存</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // 新しい要素をDOMに追加
        resultContents.appendChild(resultContent);
        
        // イベントリスナーを設定
        setupEventListeners(resultContent, uniqueId);
      });
      
      // スムーズにスクロール
      resultContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 各要素のイベントリスナーを設定する関数
  function setupEventListeners(container, uniqueId) {
    // URLコピーボタン
    const copyUrlBtn = container.querySelector('.copy-url-btn');
    copyUrlBtn.addEventListener('click', function() {
      const shareUrlInput = document.getElementById(`share-url-${uniqueId}`);
      copyToClipboard(shareUrlInput, this);
    });

    // パスワード生成ボタン
    const generatePasswordBtn = container.querySelector('.generate-password-btn');
    generatePasswordBtn.addEventListener('click', function() {
      const passwordInput = document.getElementById(`download-password-${uniqueId}`);
      passwordInput.value = generateRandomPassword(8);
      
      // ダウンロードURLを更新
      updateDownloadUrlWithPassword(uniqueId, passwordInput.value);
    });

    // パスワード入力フィールドの変更イベント
    const passwordInput = document.getElementById(`download-password-${uniqueId}`);
    if (passwordInput) {
      passwordInput.addEventListener('input', function() {
        // パスワードが変更されたらダウンロードURLを更新
        updateDownloadUrlWithPassword(uniqueId, this.value);
      });
    }
    
    // パスワードコピーボタン
    const copyPasswordBtn = container.querySelector('.copy-password-btn');
    copyPasswordBtn.addEventListener('click', function() {
      const passwordInput = document.getElementById(`download-password-${uniqueId}`);
      if (passwordInput.value.trim() === '') {
        alert('コピーするパスワードがありません。パスワードを入力するか自動生成してください。');
        return;
      }
      copyToClipboard(passwordInput, this);
    });

    // ダウンロードURLをパスワード付きで更新する関数
    function updateDownloadUrlWithPassword(uniqueId, password) {
      const shareUrlInput = document.getElementById(`share-url-${uniqueId}`);
      if (!shareUrlInput) return;
      
      let url = new URL(shareUrlInput.value);
      
      // パスワードがある場合はURLにパスワードパラメータを追加
      if (password && password.trim() !== '') {
        url.searchParams.set('password', password);
        
        // ダウンロードリンクのテキストを変更
        const downloadLink = document.querySelector(`a[href="${url.pathname}"]`);
        if (downloadLink) {
          downloadLink.textContent = 'パスワード付きダウンロード';
          downloadLink.classList.add('password-protected');
        }
      } else {
        // パスワードがない場合はパラメータを削除
        url.searchParams.delete('password');
        
        // ダウンロードリンクのテキストを元に戻す
        const downloadLink = document.querySelector(`a[href="${url.pathname}"]`);
        if (downloadLink) {
          downloadLink.textContent = 'ダウンロード';
          downloadLink.classList.remove('password-protected');
        }
      }
      
      // 更新したURLを設定
      shareUrlInput.value = url.toString();
    }

    // QRコード表示/非表示ボタン
    const toggleQrBtn = container.querySelector('.qr-display-btn');
    const qrCode = document.getElementById(`qr-code-${uniqueId}`);
    const qrOptions = document.getElementById(`qr-options-${uniqueId}`);
    
    toggleQrBtn.addEventListener('click', function() {
      const isVisible = qrCode.style.display !== 'none';
      
      if (isVisible) {
        qrCode.style.display = 'none';
        qrOptions.style.display = 'none';
        this.textContent = 'QRコードを表示';
        this.classList.remove('active');
      } else {
        qrCode.style.display = 'block';
        qrOptions.style.display = 'flex';
        this.textContent = 'QRコードを非表示';
        this.classList.add('active');
        
        // QRコードを生成
        const shareUrl = document.getElementById(`share-url-${uniqueId}`).value;
        qrCode.innerHTML = `
          <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrl)}&size=120x120" 
               alt="QRコード" width="120" height="120">
        `;
      }
    });

    // QRコードダウンロードボタン
    const downloadQrBtn = container.querySelector('.download-qr-btn');
    downloadQrBtn.addEventListener('click', function() {
      alert('QRコードの画像がダウンロードされました。');
    });
  }

  // クリップボードにコピーする汎用関数
  function copyToClipboard(input, button) {
    input.select();
    document.execCommand('copy');
    
    const originalText = button.textContent;
    button.textContent = 'コピー完了!';
    button.style.backgroundColor = '#28a745';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
    }, 2000);
  }

  // ZIPファイル名を表示する関数
  function updateZipDisplayFilename(filename) {
    const zipDisplayFilename = document.getElementById('zip-display-filename');
    if (zipDisplayFilename) {
      zipDisplayFilename.textContent = `${filename}.zip`;
    }
  }

  // ===== QRコード表示の処理 =====
  const qrCodeContainer = document.getElementById('qr-code');
  const downloadQrBtn = document.getElementById('download-qr-btn');
  const printQrBtn = document.getElementById('print-qr-btn');
  
  // QRコードを生成する関数（実際の実装ではQRコードライブラリを使用）
  function generateQRCode() {
    if (qrCodeContainer) {
      // モック実装：QRコードの代わりに画像を表示
      qrCodeContainer.innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrlInput.value)}&size=120x120" 
             alt="QRコード" width="120" height="120">
      `;
    }
  }
  
  // 共有リンク生成ボタンのイベントリスナー
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      // 処理中の表示
      generateBtn.textContent = '生成中...';
      generateBtn.disabled = true;
      
      // 実際の処理はここに実装（現在はモック）
      setTimeout(() => {
        // 共有URLを生成（実際の実装ではサーバーからのレスポンスを処理）
        const shareUrl = `https://share.example.com/${generateRandomString(10)}`;
        shareUrlInput.value = shareUrl;
        
        // QRコードを生成
        generateQRCode();
        
        // 処理完了のメッセージ
        const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);
        
        let message = `${selectedFiles.length}個のファイルを共有用にアップロードしました。\n`;
        message += `合計サイズ: ${formatFileSize(totalSize)}\n`;
        message += `保存期間: ${getRetentionPeriodText(selectedRetentionPeriod)}\n\n`;
        
        if (downloadPasswordInput.value) {
          message += `パスワード: ${downloadPasswordInput.value}\n`;
          message += `※パスワードは大切に保管してください。`;
        } else {
          message += `共有URLが生成されました。URLをコピーして共有できます。`;
        }
        
        alert(message);
        
        // ボタンを元に戻す
        generateBtn.textContent = '共有リンク生成';
        generateBtn.disabled = false;
      }, 2000);
    });
  }
  
  // ランダムな文字列を生成する関数
  function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  
  // ランダムなパスワードを生成する関数
  function generateRandomPassword(length) {
    const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 紛らわしい文字を除外
    const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz'; // 紛らわしい文字を除外
    const numberChars = '23456789'; // 紛らわしい数字を除外
    const specialChars = '!@#$%^&*()_+';
    
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    
    // 少なくとも各種類の文字を1つ含める
    let password = '';
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // 残りの文字をランダムに生成
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // 文字列をシャッフル
    return shuffleString(password);
  }
  
  // 文字列をシャッフルする関数
  function shuffleString(str) {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }
  
  // QRコードのダウンロードボタンのイベントリスナー
  if (downloadQrBtn) {
    downloadQrBtn.addEventListener('click', () => {
      // 実際の実装ではQRコード画像をダウンロード
      alert('QRコードの画像がダウンロードされました。');
    });
  }
  
  // QRコードの印刷ボタンのイベントリスナー
  if (printQrBtn) {
    printQrBtn.addEventListener('click', () => {
      // 印刷用ウィンドウを開く
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>QRコード印刷</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              h2 { margin-bottom: 20px; }
              .qr-container { margin: 20px auto; }
              .url { margin-top: 20px; word-break: break-all; color: #666; }
              .info { margin-top: 30px; font-size: 0.9rem; color: #888; }
            </style>
          </head>
          <body>
            <h2>共有ファイルQRコード</h2>
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrlInput.value)}&size=200x200" 
                   alt="QRコード" width="200" height="200">
            </div>
            <div class="url">${shareUrlInput.value}</div>
            <div class="info">
              <p>保存期間: ${getRetentionPeriodText(selectedRetentionPeriod)}</p>
              <p>スキャンしてファイルにアクセス</p>
            </div>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });
  }

  // QRコード表示ボタンのイベントリスナー
  const toggleQrBtn = document.getElementById('toggle-qr-btn');
  const qrOptions = document.querySelector('.qr-options');

  if (toggleQrBtn && qrCode && qrOptions) {
    toggleQrBtn.addEventListener('click', () => {
      const isVisible = qrCode.style.display !== 'none';
      
      if (isVisible) {
        // QRコードを非表示にする
        qrCode.style.display = 'none';
        qrOptions.style.display = 'none';
        toggleQrBtn.textContent = 'QRコードを表示';
        toggleQrBtn.classList.remove('active');
      } else {
        // QRコードを表示する
        qrCode.style.display = 'block';
        qrOptions.style.display = 'flex';
        toggleQrBtn.textContent = 'QRコードを非表示';
        toggleQrBtn.classList.add('active');
      }
    });
  }

  // アップロードされたファイルを表示する関数
  function displayUploadedFiles(files) {
    const container = document.querySelector('.uploaded-files-container') || createUploadedFilesContainer();
    const filesList = container.querySelector('.uploaded-files-list') || document.createElement('div');
    filesList.className = 'uploaded-files-list';
    filesList.innerHTML = '';

    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'uploaded-file-item';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';

        // ファイル名（パスワード保護の場合は🔒アイコンを追加）
        const fileName = document.createElement('span');
        fileName.className = `file-name ${file.password_protected ? 'password-protected' : ''}`;
        fileName.textContent = file.filename;

        // ファイルサイズ
        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);

        // 有効期限
        const fileExpires = document.createElement('span');
        fileExpires.className = 'file-expires';
        fileExpires.textContent = `有効期限: ${new Date(file.expires_at).toLocaleString()}`;

        // ダウンロードリンク
        const downloadLink = document.createElement('a');
        downloadLink.href = file.download_url;
        downloadLink.className = 'download-link';
        downloadLink.textContent = 'ダウンロード';
        if (file.password_protected) {
            downloadLink.title = 'このファイルはパスワード保護されています';
        }

        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        fileInfo.appendChild(fileExpires);
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(downloadLink);
        filesList.appendChild(fileItem);
    });

    if (!container.contains(filesList)) {
        container.appendChild(filesList);
    }

    if (!document.body.contains(container)) {
        document.querySelector('.bottom-container').appendChild(container);
    }
  }

  function createUploadedFilesContainer() {
    const container = document.createElement('div');
    container.className = 'uploaded-files-container';
    return container;
  }
});