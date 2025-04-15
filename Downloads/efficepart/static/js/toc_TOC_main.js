// TOCアプリケーション用のJavaScriptファイル

// グローバルスコープで関数を定義
window.addThreshold = function() {
    const thresholdsContainer = document.getElementById('thresholds-container');
    if (!thresholdsContainer) return;
    
    // 新しい行を作成
    const newThresholdRow = document.createElement('div');
    newThresholdRow.className = 'threshold-row';
    
    // 新しい行の内容を設定
    newThresholdRow.innerHTML = `
        <span class="threshold-label">目次抽出のフォントサイズ:</span>
        <input 
            type="number" 
            name="toc_font_size[]" 
            class="setting-input" 
            min="0.1"
            max="100.0"
            step="0.1"
            required
            value="10.0"
            placeholder="フォントサイズを入力（例: 10.0）"
            oninput="window.validateFontSizes()"
        >
        <div style="margin-left: 10px;">
            <input 
                type="checkbox" 
                name="toc_bold[]" 
                class="toc-bold-checkbox"
                value="true"
            >
            <label>太字で表示</label>
        </div>
        <button type="button" class="remove-threshold-btn" onclick="window.removeThreshold(this)">削除</button>
    `;
    
    // ボタンの上に新しい行を挿入
    const addButton = thresholdsContainer.querySelector('.add-threshold-btn');
    thresholdsContainer.insertBefore(newThresholdRow, addButton);
    
    // バリデーションを実行
    window.validateFontSizes();
};

// 目次生成欄を削除する機能
window.removeThreshold = function(button) {
    const thresholdsContainer = document.getElementById('thresholds-container');
    if (!thresholdsContainer) return;
    
    const thresholdRow = button.closest('.threshold-row');
    
    // 行が1つ以上ある場合のみ削除可能
    if (thresholdsContainer.querySelectorAll('.threshold-row').length > 1) {
        thresholdRow.remove();
        window.validateFontSizes();
    }
};

// フォントサイズのバリデーション
window.validateFontSizes = function() {
    const fontSizeInputs = document.querySelectorAll('input[name="toc_font_size[]"]');
    const fontSizes = Array.from(fontSizeInputs).map(input => parseFloat(input.value));
    
    // 入力値が有効な数値かチェック
    const isValid = fontSizes.every(size => !isNaN(size) && size > 0 && size <= 100);
    
    // 送信ボタンの有効/無効を切り替え
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        const fileInput = document.getElementById('file-upload');
        const fileSelected = fileInput && fileInput.files && fileInput.files.length > 0;
        submitButton.disabled = !(isValid && fileSelected);
    }
    
    return isValid;
};

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    console.log('TOC main.js loaded');
    const fileInput = document.getElementById('file-upload');
    const fileNameElement = document.getElementById('selected-file-name');
    const submitButton = document.getElementById('submit-button');
    const errorElement = document.getElementById('error');
    const uploadForm = document.getElementById('uploadForm');
    
    // 要素が見つからない場合のエラーログ
    if (!fileInput) console.warn('file-upload element not found');
    if (!fileNameElement) console.warn('selected-file-name element not found');
    if (!submitButton) console.warn('submit-button element not found');
    if (!errorElement) console.warn('error element not found');
    if (!uploadForm) console.warn('uploadForm element not found');
    
    // ファイル選択時の処理
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            console.log('File input changed');
            const files = e.target.files;
            if (files.length > 0) {
                const file = files[0];
                // ファイル名を表示
                if (fileNameElement) {
                    fileNameElement.textContent = file.name;
                }
                
                // PPTXファイルかチェック
                if (!file.name.toLowerCase().endsWith('.pptx')) {
                    showError('PPTXファイルのみアップロードできます。');
                    if (submitButton) submitButton.disabled = true;
                    return;
                }
                
                // ファイルサイズチェック
                if (file.size > 500 * 1024 * 1024) {  // 500MB
                    showError('ファイルサイズは500MB以下にしてください。');
                    if (submitButton) submitButton.disabled = true;
                    return;
                }
                
                // バリデーション成功、ボタンを有効化
                if (errorElement) errorElement.style.display = 'none';
                if (submitButton) submitButton.disabled = false;
                window.validateFontSizes(); // フォントサイズのバリデーションも実行
            } else {
                if (fileNameElement) fileNameElement.textContent = 'ファイルが選択されていません';
                if (submitButton) submitButton.disabled = true;
            }
        });
    }
    
    // フォーム送信処理
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                showError('ファイルを選択してください。');
                return;
            }
            
            // フォントサイズのバリデーション
            if (!window.validateFontSizes()) {
                showError('フォントサイズの入力値を確認してください。');
                return;
            }
            
            // ここにフォーム送信処理を実装
            // 実際のフォーム送信
            uploadForm.submit();
        });
    }
    
    // エラーメッセージ表示
    function showError(message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            console.error('Error:', message);
        }
    }
    
    // 初期化処理
    window.validateFontSizes();
    
    // フォントサイズ入力欄にバリデーションイベントを追加
    const fontSizeInputs = document.querySelectorAll('input[name="toc_font_size[]"]');
    fontSizeInputs.forEach(input => {
        input.addEventListener('input', window.validateFontSizes);
    });
});