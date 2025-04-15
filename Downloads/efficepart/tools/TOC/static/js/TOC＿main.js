/**
 * TOC (Table of Contents) 統合JavaScript
 * 目次生成ツールのための統合スクリプト
 */

// グローバルスコープに関数を定義

// 目次生成欄を追加する機能
window.addThreshold = function() {
    const container = document.getElementById('thresholds-container');
    if (!container) return;
    
    const newRow = document.createElement('div');
    newRow.className = 'threshold-row';
    newRow.innerHTML = `
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
    container.insertBefore(newRow, container.querySelector('.add-threshold-btn'));
    
    // 追加後にバリデーションを実行
    window.validateFontSizes();
};

// 目次生成欄を削除する機能
window.removeThreshold = function(button) {
    const container = document.getElementById('thresholds-container');
    if (!container) return;
    
    // 最低1つは残す
    const rows = container.querySelectorAll('.threshold-row');
    if (rows.length <= 1) {
        return; // 最後の1つは削除しない
    }
    
    // ボタンの親要素（行）を削除
    const row = button.closest('.threshold-row');
    if (row) {
        row.remove();
        // 削除後にバリデーションを実行
        window.validateFontSizes();
    }
};

// フォントサイズのバリデーション
window.validateFontSizes = function() {
    const submitButton = document.getElementById('submit-button');
    const fontSizeInputs = document.querySelectorAll('input[name="toc_font_size[]"]');
    const errorElement = document.getElementById('error');
    
    let isValid = true;
    let errorMessage = '';
    
    fontSizeInputs.forEach(input => {
        const value = parseFloat(input.value);
        if (isNaN(value) || value < 0.1 || value > 100.0) {
            isValid = false;
            errorMessage = 'フォントサイズは0.1〜100.0の範囲で入力してください。';
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
        }
    });
    
    if (!isValid) {
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        }
        if (submitButton) {
            submitButton.disabled = true;
        }
    } else {
        // ファイルが選択されていない場合はボタンを無効にする
        const fileInput = document.getElementById('file-upload');
        const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
        
        if (errorElement && errorElement.textContent === errorMessage) {
            errorElement.style.display = 'none';
        }
        
        if (submitButton) {
            submitButton.disabled = !hasFile;
        }
    }
};

// エラーメッセージを表示する関数
window.showError = function(message) {
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // ローディング表示を非表示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
};

// 成功メッセージを表示する関数
window.showSuccess = function(message) {
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.style.backgroundColor = '#d4edda';
        errorElement.style.color = '#155724';
        errorElement.style.borderColor = '#c3e6cb';
        
        // ローディング表示を非表示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
};

// TOCコンテンツを読み込む関数
window.loadTocContent = function() {
    const tocContent = document.getElementById('toc-content');
    if (tocContent) {
        tocContent.style.display = 'block';
    }
};

// TOCコンテンツを閉じる関数
window.closeTocContent = function() {
    const tocContent = document.getElementById('toc-content');
    if (tocContent) {
        tocContent.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // HTML要素の取得
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('file-upload'); // HTMLのidに合わせて変更
    const fileNameElement = document.getElementById('selected-file-name');
    const submitButton = document.getElementById('submit-button');
    const errorElement = document.getElementById('error');
    const thresholdsContainer = document.getElementById('thresholds-container');
    const loadingElement = document.getElementById('loading');

    // ファイル選択時の処理
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                const file = files[0];
                // ファイル名を表示
                fileNameElement.textContent = file.name;
                
                // PPTXファイルかチェック
                if (!file.name.toLowerCase().endsWith('.pptx')) {
                    showError('PPTXファイルのみアップロードできます。');
                    submitButton.disabled = true;
                    return;
                }
                
                // ファイルサイズチェック
                if (file.size > 500 * 1024 * 1024) {  // 500MB
                    showError('ファイルサイズは500MB以下にしてください。');
                    submitButton.disabled = true;
                    return;
                }
                
                // バリデーション成功、ボタンを有効化
                errorElement.style.display = 'none';
                submitButton.disabled = false;
                validateFontSizes(); // フォントサイズのバリデーションも実行
            } else {
                fileNameElement.textContent = 'ファイルが選択されていません';
                submitButton.disabled = true;
            }
        });
    }

    // 目次生成欄を追加する機能
    window.addThreshold = function() {
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
                oninput="validateFontSizes()"
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
            <button type="button" class="remove-threshold-btn" onclick="removeThreshold(this)">削除</button>
        `;
        
        // ボタンの上に新しい行を挿入
        const addButton = thresholdsContainer.querySelector('.add-threshold-btn');
        thresholdsContainer.insertBefore(newThresholdRow, addButton);
        
        // バリデーションを実行
        validateFontSizes();
    };
    
    // 目次生成欄を削除する機能
    window.removeThreshold = function(button) {
        if (!thresholdsContainer) return;
        
        const thresholdRow = button.closest('.threshold-row');
        
        // 行が1つ以上ある場合のみ削除可能
        if (thresholdsContainer.querySelectorAll('.threshold-row').length > 1) {
            thresholdRow.remove();
            validateFontSizes();
        }
    };
    
    // フォントサイズのバリデーション
    window.validateFontSizes = function() {
        const fontSizeInputs = document.querySelectorAll('input[name="toc_font_size[]"]');
        const fontSizes = Array.from(fontSizeInputs).map(input => parseFloat(input.value));
        
        // 入力値が有効な数値かチェック
        const isValid = fontSizes.every(size => !isNaN(size) && size > 0 && size <= 100);
        
        // 送信ボタンの有効/無効を切り替え
        if (submitButton) {
            const fileSelected = fileInput && fileInput.files.length > 0;
            submitButton.disabled = !(isValid && fileSelected);
        }
        
        return isValid;
    };

    // フォームの送信
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                showError('ファイルを選択してください。');
                return;
            }
            
            // フォントサイズのバリデーション
            if (!validateFontSizes()) {
                showError('フォントサイズの入力値を確認してください。');
                return;
            }

        const file = fileInput.files[0];
        const formData = new FormData(uploadForm);
        
        // ローディング表示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) loadingElement.style.display = 'block';
        if (errorElement) errorElement.style.display = 'none';
        
        // 送信ボタンを無効化
        if (submitButton) submitButton.disabled = true;
        
        // リクエストの送信
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadForm.getAttribute('action'), true);
        xhr.setRequestHeader('Accept', 'application/json');

        // アップロード進捗のイベントハンドラは必要に応じて実装

        xhr.onload = async () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.response);
                if (response.success) {
                    // 目次データの表示
                    const tocContainer = document.querySelector('.toc-container');
                    tocContainer.innerHTML = '';
                    
                    const tocTitle = document.createElement('h2');
                    tocTitle.textContent = '生成された目次';
                    tocContainer.appendChild(tocTitle);
                    
                    response.table_of_contents.forEach(item => {
                        const slideSection = document.createElement('div');
                        slideSection.className = 'slide-section';
                        slideSection.innerHTML = `
                            <h4>スライド ${item.slide}</h4>
                            <ul>
                                ${item.contents.map(content => `
                                    <li class="toc-item ${content.style}">
                                        <span class="text">${content.text}</span>
                                        <span class="meta">
                                            <span class="pixels">${content.pixels}px</span>
                                            <span class="position">(${Math.round(content.position[0])}, ${Math.round(content.position[1])})</span>
                                        </span>
                                    </li>
                                `).join('')}
                            </ul>
                        `;
                        tocContainer.appendChild(slideSection);
                    });
                    
                    // ダウンロードボタンの作成
                    const downloadButton = document.createElement('a');
                    downloadButton.href = response.download_url;
                    downloadButton.className = 'download-button';
                    downloadButton.textContent = `修正済みファイルをダウンロード (${response.filename})`;
                    downloadButton.download = response.filename;
                    tocContainer.appendChild(downloadButton);
                    
                    // 成功メッセージの表示
                    showSuccess(response.message);
                } else {
                    showError(response.error || '目次の生成に失敗しました');
                }

                // ローディング表示を非表示
                if (loadingElement) loadingElement.style.display = 'none';
                
                // 送信ボタンを再度有効化
                if (submitButton) submitButton.disabled = false;
            } else {
                // エラーハンドリング
                const errorData = JSON.parse(xhr.responseText);
                showError(errorData.error || 'アップロードに失敗しました。');
            }
        };

        xhr.onerror = () => {
            showError('ネットワークエラーが発生しました。');
        };

        xhr.send(formData);
    });

    function showError(message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.className = 'error';
        } else {
            console.error('Error:', message);
        }
        
        // ローディング表示を非表示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) loadingElement.style.display = 'none';
        
        // 送信ボタンを再度有効化
        if (submitButton) submitButton.disabled = false;
    }

    function showSuccess(message) {
        // ローディング表示を非表示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) loadingElement.style.display = 'none';
        
        // 成功メッセージの表示
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.className = 'success';
            setTimeout(() => {
                errorElement.style.display = 'none';
                errorElement.className = 'error';
            }, 3000);
        } else {
            console.log('Success:', message);
        }
        
        // 送信ボタンを再度有効化
        if (submitButton) submitButton.disabled = false;
    }
    
    // 初期化処理
    window.validateFontSizes();
    
    // フォントサイズ入力欄にバリデーションイベントを追加
    const fontSizeInputs = document.querySelectorAll('input[name="toc_font_size[]"]');
    fontSizeInputs.forEach(input => {
        input.addEventListener('input', window.validateFontSizes);
    });
});
