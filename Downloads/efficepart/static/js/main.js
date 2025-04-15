// DOM要素
const originalTextElement = document.getElementById('original-text');
const proofreadButton = document.getElementById('proofread-button');
const clearButton = document.getElementById('clear-button');
const resultTextElement = document.getElementById('result-text');
const suggestionsContainer = document.getElementById('suggestions-container');
const applyAllButton = document.getElementById('apply-all-button');
const rejectAllButton = document.getElementById('reject-all-button');
const copyResultButton = document.getElementById('copy-result-button');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const historyContainer = document.getElementById('history-container');
const statusCount = document.querySelector('.status-count strong');
const indicatorBar = document.querySelector('.indicator-bar');

// ドラッグ＆ドロップ関連の要素
const dropOverlay = document.querySelector('.file-drop-overlay');
const dropZone = document.querySelector('.drop-zone');
const textArea = document.getElementById('original-text');

// グローバル変数
let currentCorrections = [];
let appliedCorrections = new Set();
let rejectedCorrections = new Set();
let originalText = '';
let correctedText = '';

// 許可するファイル拡張子
const ALLOWED_EXTENSIONS = [
    'txt', 'doc', 'docx', 'pdf', 'xls', 'xlsx',
    'ppt', 'pptx', 'odt', 'ods', 'odp'
];

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    proofreadButton.addEventListener('click', handleProofreadRequest);
    clearButton.addEventListener('click', clearTextAndResults);
    uploadArea.addEventListener('submit', handleFileUpload);
    applyAllButton.addEventListener('click', applyAllSuggestions);
    rejectAllButton.addEventListener('click', rejectAllSuggestions);
    copyResultButton.addEventListener('click', copyResultToClipboard);
    
    // 同期スクロール機能
    setupSyncScroll();
    
    // 履歴を読み込み
    loadProofreadingHistory();
    setupDragAndDrop();
});

// 同期スクロール機能のセットアップ
function setupSyncScroll() {
    let isScrolling = false;
    
    // 元のテキストエリアがスクロールされたとき
    originalTextElement.addEventListener('scroll', () => {
        if (!isScrolling) {
            isScrolling = true;
            
            // スクロール位置の割合を計算
            const scrollPercentage = originalTextElement.scrollTop / 
                (originalTextElement.scrollHeight - originalTextElement.clientHeight);
            
            // 結果エリアのスクロール位置を同期
            if (resultTextElement.scrollHeight > resultTextElement.clientHeight) {
                resultTextElement.scrollTop = scrollPercentage * 
                    (resultTextElement.scrollHeight - resultTextElement.clientHeight);
            }
            
            setTimeout(() => {
                isScrolling = false;
            }, 50);
        }
    });
    
    // 結果エリアがスクロールされたとき
    resultTextElement.addEventListener('scroll', () => {
        if (!isScrolling) {
            isScrolling = true;
            
            // スクロール位置の割合を計算
            const scrollPercentage = resultTextElement.scrollTop / 
                (resultTextElement.scrollHeight - resultTextElement.clientHeight);
            
            // 元のテキストエリアのスクロール位置を同期
            if (originalTextElement.scrollHeight > originalTextElement.clientHeight) {
                originalTextElement.scrollTop = scrollPercentage * 
                    (originalTextElement.scrollHeight - originalTextElement.clientHeight);
            }
            
            // ハイライト表示コンテナがあれば、そのスクロール位置も同期
            const highlightContainer = document.getElementById('highlighted-text-container');
            if (highlightContainer && highlightContainer.scrollHeight > highlightContainer.clientHeight) {
                highlightContainer.scrollTop = scrollPercentage * 
                    (highlightContainer.scrollHeight - highlightContainer.clientHeight);
            }
            
            setTimeout(() => {
                isScrolling = false;
            }, 50);
        }
    });
}

// 文章を校正するAPI呼び出し
async function handleProofreadRequest() {
    const text = originalTextElement.value.trim();
    if (!text) {
        showMessage('校正するテキストを入力してください', 'error');
        return;
    }
    
    proofreadButton.disabled = true;
    proofreadButton.textContent = '校正中...';
    
    try {
        const response = await fetch('/proofread', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });
        
        if (!response.ok) {
            throw new Error('APIエラー: ' + response.statusText);
        }
        
        const data = await response.json();
        displayProofreadingResult(data);
        
        // 履歴を更新
        loadProofreadingHistory();
    } catch (error) {
        console.error('校正処理エラー:', error);
        showMessage('校正処理中にエラーが発生しました: ' + error.message, 'error');
    } finally {
        proofreadButton.disabled = false;
        proofreadButton.textContent = '校正する';
    }
}

// 校正結果を表示する
function displayProofreadingResult(data) {
    // エラーチェック
    if (data.error) {
        showMessage(data.error, 'error');
        originalTextElement.value = data.original || originalTextElement.value;
        return;
    }
    
    // 結果の格納
    originalText = data.original || '';
    correctedText = data.original || ''; // 初期値は原文と同じ
    currentCorrections = data.suggestions || [];
    appliedCorrections = new Set();
    rejectedCorrections = new Set();
    
    // ハイライト表示コンテナを削除して元のテキストエリアを表示
    const highlightContainer = document.getElementById('highlighted-text-container');
    if (highlightContainer) {
        highlightContainer.remove();
    }
    
    // 原文を表示
    originalTextElement.style.display = 'block';
    if (originalTextElement.value !== originalText) {
        originalTextElement.value = originalText;
    }
    
    // 校正箇所の数を表示
    statusCount.textContent = currentCorrections.length;
    
    // インジケーターバーを更新
    if (currentCorrections.length > 0) {
        indicatorBar.style.width = '100%';
    } else {
        indicatorBar.style.width = '0%';
    }
    
    // 校正箇所がなければそのまま表示
    if (currentCorrections.length === 0) {
        resultTextElement.innerHTML = '<p class="no-corrections">校正箇所は見つかりませんでした。</p>';
        suggestionsContainer.innerHTML = '<p>校正箇所は見つかりませんでした。</p>';
        applyAllButton.disabled = true;
        rejectAllButton.disabled = true;
        copyResultButton.disabled = false;
        return;
    }
    
    // 位置順にソート
    const sortedCorrections = [...currentCorrections].sort((a, b) => a.position - b.position);
    
    // 校正箇所だけを抽出して表示
    const correctionsList = document.createElement('div');
    correctionsList.className = 'corrections-list';
    correctionsList.style.maxHeight = '100%';
    correctionsList.style.overflowY = 'auto';
    
    sortedCorrections.forEach((correction, index) => {
        const position = correction.position;
        const length = correction.length || 1;
        const contextBefore = originalText.substring(Math.max(0, position - 20), position);
        const highlightedText = originalText.substring(position, position + length);
        const contextAfter = originalText.substring(position + length, Math.min(originalText.length, position + length + 20));
        
        const correctionItem = document.createElement('div');
        correctionItem.className = `correction-item ${correction.color}`;
        correctionItem.id = `correction-item-${index}`;
        
        correctionItem.innerHTML = `
            <div class="correction-context">
                <span class="context-before">${escapeHtml(contextBefore)}</span>
                <span class="highlighted-text">${escapeHtml(highlightedText)}</span>
                <span class="context-after">${escapeHtml(contextAfter)}</span>
            </div>
            <div class="correction-details">
                <div class="correction-reason">${correction.reason}</div>
                <div class="correction-suggestion">
                    <span class="suggestion-label">提案:</span> 
                    <span class="suggestion-text">${correction.suggestion}</span>
                </div>
                <div class="correction-actions">
                    <button class="apply-correction-button primary-button" data-index="${index}">適用</button>
                    <button class="reject-correction-button secondary-button" data-index="${index}">無視</button>
                </div>
            </div>
        `;
        
        correctionsList.appendChild(correctionItem);
    });
    
    // 既存の内容をクリアして新しい校正リストを追加
    resultTextElement.innerHTML = '';
    resultTextElement.appendChild(correctionsList);
    
    // 結果パネルのスタイルを設定
    resultTextElement.style.flex = '1';
    resultTextElement.style.display = 'block';
    resultTextElement.style.overflow = 'auto';
    
    // スクロールを一番上に戻す
    resultTextElement.scrollTop = 0;
    
    // ボタンを有効化
    applyAllButton.disabled = false;
    rejectAllButton.disabled = false;
    copyResultButton.disabled = false;
    
    // 適用・無視ボタンにイベントリスナーを追加
    document.querySelectorAll('.apply-correction-button').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            applySuggestion(index);
        });
    });
    
    document.querySelectorAll('.reject-correction-button').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            rejectSuggestion(index);
        });
    });
    
    // 左側のテキストを校正マーカー付きで表示
    displayOriginalTextWithMarkers(sortedCorrections);
}

// HTMLエスケープ関数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 校正提案リストを表示
function displaySuggestionsList(suggestions) {
    suggestionsContainer.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestionsContainer.innerHTML = '<p>校正箇所は見つかりませんでした。</p>';
        return;
    }
    
    const typeLabels = {
        'red': '誤字脱字',
        'blue': '文法ミス',
        'yellow': '表現改善'
    };
    
    suggestions.forEach((suggestion, index) => {
        const suggestionType = typeLabels[suggestion.color] || '校正提案';
        const positionInText = suggestion.position;
        const originalPhrase = originalText.substring(positionInText, positionInText + (suggestion.length || 1));
        
        const suggestionItem = document.createElement('div');
        suggestionItem.className = `suggestion-item ${suggestion.color}`;
        suggestionItem.id = `suggestion-${index}`;
        suggestionItem.innerHTML = `
            <div class="suggestion-header">
                <div class="suggestion-type">${suggestionType}</div>
                <div class="suggestion-buttons">
                    <button class="apply-button primary-button" data-index="${index}">適用</button>
                    <button class="reject-button secondary-button" data-index="${index}">無視</button>
                </div>
            </div>
            <div class="suggestion-text">
                <span class="original-phrase">${originalPhrase}</span> → 
                <span class="suggested-phrase">${suggestion.suggestion}</span>
            </div>
            <div class="suggestion-reason">${suggestion.reason}</div>
        `;
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    // 適用・無視ボタンにイベントリスナーを追加
    document.querySelectorAll('.apply-button').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            applySuggestion(index);
        });
    });
    
    document.querySelectorAll('.reject-button').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            rejectSuggestion(index);
        });
    });
}

// 提案を適用
function applySuggestion(index) {
    const correction = currentCorrections[index];
    appliedCorrections.add(index);
    
    // 校正項目のスタイルを変更
    const correctionItem = document.getElementById(`correction-item-${index}`);
    if (correctionItem) {
        correctionItem.classList.add('applied');
        
        const applyButton = correctionItem.querySelector('.apply-correction-button');
        // 適用ボタンのみ無効化
        if (applyButton) applyButton.disabled = true;
        // 無視ボタンは無効化しない
    }
    
    // 提案項目を更新
    const suggestionItem = document.getElementById(`suggestion-${index}`);
    if (suggestionItem) {
        suggestionItem.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
        suggestionItem.style.borderColor = '#2ecc71';
        
        const applyButton = suggestionItem.querySelector('.apply-button');
        // 適用ボタンのみ無効化
        if (applyButton) applyButton.disabled = true;
        // 無視ボタンは無効化しない
    }
    
    // 適用/無視状態を更新
    if (rejectedCorrections.has(index)) {
        rejectedCorrections.delete(index);
    }
    
    // 元のテキストのハイライト表示を適用済みスタイルに変更
    updateHighlightStyle(index, 'applied');
    
    updateCorrectedText();
}

// ハイライトスタイルを更新する関数
function updateHighlightStyle(index, status) {
    const container = document.getElementById('highlighted-text-container');
    if (!container) return;
    
    const correction = currentCorrections[index];
    if (!correction) return;
    
    // 該当する位置のハイライト要素を探す
    const highlightElements = container.querySelectorAll('.text-marker');
    
    for (const element of highlightElements) {
        // テキスト内容と位置で一致するハイライト要素を特定
        const text = element.textContent;
        if (text === originalText.substring(correction.position, correction.position + (correction.length || 1))) {
            if (status === 'applied') {
                // 適用済みスタイルに変更
                element.classList.add('applied');
                element.classList.remove('rejected');
                
                // マーカー（背景色）を削除し、下線だけ残す
                element.style.backgroundColor = 'transparent';
                // 下線はそのまま残す（border-bottomは変更しない）
                
                // 取り消し線を追加
                element.style.textDecoration = 'line-through';
                
                // 適用後のテキストをツールチップに追加
                element.title = `${correction.reason}: "${text}" → "${correction.suggestion}"（適用済み）`;
                
                // 適用後のテキストを下に小さく表示
                const appliedText = document.createElement('span');
                appliedText.className = 'applied-text';
                appliedText.textContent = correction.suggestion;
                appliedText.style.display = 'block';
                appliedText.style.fontSize = '0.85em';
                appliedText.style.color = 'var(--success-color)';
                appliedText.style.fontWeight = 'bold';
                appliedText.style.marginTop = '2px';
                
                // 既に適用テキストが表示されていない場合のみ追加
                if (!element.nextElementSibling || !element.nextElementSibling.classList.contains('applied-text')) {
                    element.parentNode.insertBefore(appliedText, element.nextSibling);
                }
            } else if (status === 'rejected') {
                // 適用済みクラスを削除
                element.classList.remove('applied');
                element.classList.add('rejected');
                
                // 背景色を薄くする
                element.style.backgroundColor = 'rgba(200, 200, 200, 0.2)';
                element.style.borderBottom = '1px dotted #999';
                element.style.textDecoration = 'none';
                
                // ツールチップを更新
                element.title = `${correction.reason}: "${text}" → "${correction.suggestion}"（無視）`;
                
                // 適用テキストが表示されていれば削除
                const nextElement = element.nextElementSibling;
                if (nextElement && nextElement.classList.contains('applied-text')) {
                    nextElement.remove();
                }
            }
        }
    }
}

// 提案を無視
function rejectSuggestion(index) {
    rejectedCorrections.add(index);
    
    // 校正項目のスタイルを変更
    const correctionItem = document.getElementById(`correction-item-${index}`);
    if (correctionItem) {
        correctionItem.classList.add('rejected');
        // 適用済みクラスがあれば削除
        correctionItem.classList.remove('applied');
        
        // 無視ボタンのみ無効化
        const rejectButton = correctionItem.querySelector('.reject-correction-button');
        if (rejectButton) rejectButton.disabled = true;
        // 適用ボタンは既に無効化されている場合があるので、そのままにする
    }
    
    // 提案項目を更新
    const suggestionItem = document.getElementById(`suggestion-${index}`);
    if (suggestionItem) {
        suggestionItem.style.opacity = '0.5';
        // 適用済みのスタイルをリセット
        suggestionItem.style.backgroundColor = '';
        suggestionItem.style.borderColor = '';
        
        // 無視ボタンのみ無効化
        const rejectButton = suggestionItem.querySelector('.reject-button');
        if (rejectButton) rejectButton.disabled = true;
        // 適用ボタンは既に無効化されている場合があるので、そのままにする
    }
    
    // 適用/無視状態を更新
    if (appliedCorrections.has(index)) {
        appliedCorrections.delete(index);
    }
    
    // 元のテキストのハイライト表示を無視スタイルに変更
    updateHighlightStyle(index, 'rejected');
    
    updateCorrectedText();
}

// 校正テキストを更新
function updateCorrectedText() {
    // 現在の校正状態に基づいて修正後のテキストを生成
    // 実際のアプリケーションでは、より複雑なテキスト置換処理が必要になる場合があります
}

// すべての提案を適用
function applyAllSuggestions() {
    // すべての未適用・未拒否の提案を適用
    currentCorrections.forEach((_, index) => {
        if (!appliedCorrections.has(index) && !rejectedCorrections.has(index)) {
            applySuggestion(index);
        }
    });
}

// すべての提案を無視
function rejectAllSuggestions() {
    currentCorrections.forEach((_, index) => {
        if (!appliedCorrections.has(index) && !rejectedCorrections.has(index)) {
            rejectSuggestion(index);
        }
    });
}

// 結果をクリップボードにコピー
function copyResultToClipboard() {
    // 最終的に修正したテキストをクリップボードにコピー
    // 実際のアプリケーションでは、修正を適用したテキストを生成する処理が必要
    
    // 仮のテキスト（実際の実装ではより複雑になる）
    const textToCopy = correctedText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showMessage('テキストをクリップボードにコピーしました', 'success');
    }).catch(err => {
        console.error('クリップボードへのコピーが失敗しました', err);
        showMessage('コピーに失敗しました', 'error');
    });
}

// ドラッグ＆ドロップイベントの設定
function setupDragAndDrop() {
    // ファイル選択ボタンのイベント
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(e);
        }
    });

    // アップロードボタンのクリックイベント
    const uploadButton = document.querySelector('.upload-button');
    if (uploadButton) {
        uploadButton.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }

    // ドラッグオーバー時の処理
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });

    // ドラッグ離脱時の処理
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });

    // ドロップ時の処理
    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // ドロップされたファイルをfileInputに設定
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(files[0]);
            fileInput.files = dataTransfer.files;
            
            // ファイルアップロード処理を実行
            handleFileUpload(e);
        }
    });
}

// ファイルアップロード処理
async function handleFileUpload(event) {
    event.preventDefault();
    
    const file = fileInput.files[0];
    if (!file) {
        showMessage('ファイルを選択してください', 'error');
        return;
    }

    // ファイルサイズチェック（500MB以下）
    if (file.size > 500 * 1024 * 1024) {
        showMessage('ファイルサイズは500MB以下にしてください', 'error');
        return;
    }

    // ファイル形式チェック
    const fileName = file.name;
    const fileExtension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
    
    if (!fileExtension) {
        showMessage('ファイルに拡張子がありません。拡張子付きのファイルを選択してください。', 'error');
        return;
    }
    
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        showMessage('対応していないファイル形式です。以下の形式のファイルをアップロードしてください：\n' +
                   ALLOWED_EXTENSIONS.join(', '), 'error');
        return;
    }

    // アップロード中の表示
    const uploadButton = document.querySelector('.upload-button');
    uploadButton.disabled = true;
    uploadButton.textContent = 'アップロード中...';
    
    // プログレスバーの表示
    const progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress';
    progressContainer.innerHTML = `
        <div class="progress-text">ファイル「${file.name}」を処理中...</div>
        <div class="progress-bar-container">
            <div class="progress-bar" style="width: 0%"></div>
        </div>
    `;
    uploadArea.appendChild(progressContainer);
    
    // プログレスバーのアニメーション
    const progressBar = progressContainer.querySelector('.progress-bar');
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += 5;
            progressBar.style.width = `${progress}%`;
        }
    }, 300);

    try {
        // FormDataの作成
        const formData = new FormData();
        formData.append('file', file);

        // アップロードリクエスト
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        // レスポンスのチェック
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'アップロードエラー: ' + response.statusText);
        }

        // プログレスバーを100%にする
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        
        const data = await response.json();
        
        // プログレスバーを削除
        setTimeout(() => {
            progressContainer.remove();
        }, 500);
        
        // 抽出されたテキストを表示
        if (data.original) {
            originalTextElement.value = data.original;
            displayProofreadingResult(data);
            
            // ファイル名を表示
            const fileInfoElement = document.createElement('div');
            fileInfoElement.className = 'file-info';
            fileInfoElement.innerHTML = `
                <span class="file-icon">📄</span> 
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${formatFileSize(file.size)})</span>
            `;
            
            // ハイライトコンテナがある場合はその前に、なければテキストエリアの前に挿入
            const highlightContainer = document.getElementById('highlighted-text-container');
            if (highlightContainer) {
                highlightContainer.parentNode.insertBefore(fileInfoElement, highlightContainer);
            } else {
                originalTextElement.parentNode.insertBefore(fileInfoElement, originalTextElement);
            }
            
            // テキストが長い場合はスクロールバーを表示
            if (data.original.length > 5000) {
                // スクロール可能であることを示すヒントを表示
                const scrollHint = document.createElement('div');
                scrollHint.className = 'scroll-hint';
                scrollHint.innerHTML = '<span class="scroll-icon">↕️</span> スクロールしてテキストを確認できます';
                
                // ハイライトコンテナがある場合はその後に、なければテキストエリアの後に挿入
                if (highlightContainer) {
                    highlightContainer.parentNode.insertBefore(scrollHint, highlightContainer.nextSibling);
                } else {
                    originalTextElement.parentNode.insertBefore(scrollHint, originalTextElement.nextSibling);
                }
                
                // 3秒後にヒントを消す
                setTimeout(() => {
                    scrollHint.style.opacity = '0';
                    setTimeout(() => {
                        scrollHint.remove();
                    }, 500);
                }, 3000);
            }

            // 履歴を更新
            loadProofreadingHistory();
        } else {
            throw new Error('テキストの抽出に失敗しました');
        }

        // ファイル入力をリセット
        fileInput.value = '';
    } catch (error) {
        // プログレスバーを停止して削除
        clearInterval(progressInterval);
        progressContainer.remove();
        
        console.error('ファイルアップロードエラー:', error);
        showMessage('ファイルのアップロードに失敗しました: ' + error.message, 'error');
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = 'ファイルをアップロード';
    }
}

// ファイルサイズをフォーマットする関数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 校正履歴を読み込む
async function loadProofreadingHistory() {
    try {
        const response = await fetch('/history');
        if (!response.ok) {
            throw new Error('履歴の取得に失敗しました');
        }
        
        const data = await response.json();
        displayHistory(data.history);
    } catch (error) {
        console.error('履歴読み込みエラー:', error);
    }
}

// 履歴を表示
function displayHistory(history) {
    historyContainer.innerHTML = '';
    
    if (!history || history.length === 0) {
        historyContainer.innerHTML = '<p class="no-history">履歴はありません</p>';
        return;
    }
    
    history.forEach(item => {
        const date = new Date(item.timestamp);
        const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        const preview = item.original.length > 50 
            ? item.original.substring(0, 50) + '...' 
            : item.original;
        
        const itemTitle = item.filename 
            ? `ファイル: ${item.filename}` 
            : `テキスト校正 #${history.indexOf(item) + 1}`;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = item.id;
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-title">${itemTitle}</div>
                <div class="history-item-date">${formattedDate}</div>
            </div>
            <div class="history-item-preview">${preview}</div>
        `;
        
        historyItem.addEventListener('click', () => {
            loadHistoryItem(item);
        });
        
        historyContainer.appendChild(historyItem);
    });
}

// 履歴項目を読み込む
function loadHistoryItem(item) {
    originalTextElement.value = item.original;
    displayProofreadingResult(item);
}

// テキストと結果をクリア
function clearTextAndResults() {
    originalTextElement.value = '';
    resultTextElement.innerHTML = '';
    suggestionsContainer.innerHTML = '';
    
    // ハイライト表示コンテナを削除
    const highlightContainer = document.getElementById('highlighted-text-container');
    if (highlightContainer) {
        highlightContainer.remove();
        originalTextElement.style.display = 'block';
    }
    
    // ファイル情報表示を削除
    const fileInfo = document.querySelector('.file-info');
    if (fileInfo) {
        fileInfo.remove();
    }
    
    // アップロードエリアを再表示
    uploadArea.style.display = 'block';
    
    applyAllButton.disabled = true;
    rejectAllButton.disabled = true;
    copyResultButton.disabled = true;
    
    currentCorrections = [];
    appliedCorrections = new Set();
    rejectedCorrections = new Set();
    
    // 校正箇所の数とインジケーターバーをリセット
    statusCount.textContent = '0';
    indicatorBar.style.width = '0%';
}

// エラーや成功メッセージを表示する関数
function showMessage(message, type) {
    console.log(`${type}: ${message}`);
    // 実際のUIにメッセージを表示する処理は省略
    // アラートで代用
    alert(message);
}

// 提案にスクロール
function scrollToSuggestion(index) {
    const element = document.getElementById(`correction-item-${index}`);
    if (element) {
        // 結果パネルを取得
        const resultPanel = document.querySelector('.result-panel');
        if (resultPanel) {
            // 結果パネル内での要素の相対位置を計算
            const panelRect = resultPanel.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const relativeTop = elementRect.top - panelRect.top;
            
            // 結果パネルをスクロール
            resultPanel.scrollTo({
                top: resultPanel.scrollTop + relativeTop - panelRect.height / 4,
                behavior: 'smooth'
            });
        } else {
            // 結果パネルが見つからない場合は要素自体をスクロール
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // ハイライト効果を追加
        element.classList.add('highlight-suggestion');
        setTimeout(() => {
            element.classList.remove('highlight-suggestion');
        }, 2000);
    }
}

// 左側のテキストを校正マーカー付きで表示
function displayOriginalTextWithMarkers(corrections) {
    // テキストエリアの内容をハイライト表示用のdivに変換
    const textContainer = document.createElement('div');
    textContainer.id = 'highlighted-text-container';
    textContainer.className = 'highlighted-text-container';
    
    // テキストエリアを非表示にして、代わりにハイライト表示用のdivを表示
    originalTextElement.style.display = 'none';
    originalTextElement.parentNode.insertBefore(textContainer, originalTextElement);
    
    // テキストを処理して校正マーカーを追加
    if (corrections.length === 0) {
        textContainer.textContent = originalText;
        return;
    }
    
    // 位置情報でソート（逆順）
    const sortedCorrections = [...corrections].sort((a, b) => b.position - a.position);
    
    // テキストをコピー
    let markedText = originalText;
    
    // 各校正箇所にマーカーを追加（後ろから処理して位置ずれを防ぐ）
    sortedCorrections.forEach((correction, i) => {
        const index = sortedCorrections.length - 1 - i;
        const position = correction.position;
        const length = correction.length;
        const prefix = markedText.substring(0, position);
        const marked = markedText.substring(position, position + length);
        const suffix = markedText.substring(position + length);
        
        // 校正状態に応じてスタイルを変更
        let status = 'pending';
        if (appliedCorrections.has(index)) {
            status = 'applied';
        } else if (rejectedCorrections.has(index)) {
            status = 'rejected';
        }
        
        // マーカー付きのテキストに置換
        markedText = `${prefix}<span class="text-marker ${correction.color} ${status}" data-index="${index}">${marked}</span>${suffix}`;
    });
    
    // HTMLとして挿入
    textContainer.innerHTML = markedText;
    
    // マーカーにイベントリスナーを追加
    document.querySelectorAll('.text-marker').forEach(marker => {
        marker.addEventListener('click', () => {
            const index = parseInt(marker.getAttribute('data-index'));
            scrollToSuggestion(index);
        });
    });
    
    // ハイライト表示コンテナと結果パネル間の同期スクロール
    setupSyncScrollForHighlightedText(textContainer);
}

// ハイライト表示コンテナと結果パネル間の同期スクロール
function setupSyncScrollForHighlightedText(container) {
    let isScrolling = false;
    
    // ハイライト表示用のdivがスクロールされたとき
    container.addEventListener('scroll', () => {
        if (!isScrolling) {
            isScrolling = true;
            
            // スクロール位置の割合を計算
            const scrollPercentage = container.scrollTop / 
                (container.scrollHeight - container.clientHeight);
            
            // 結果エリアのスクロール位置を同期
            if (resultTextElement.scrollHeight > resultTextElement.clientHeight) {
                resultTextElement.scrollTop = scrollPercentage * 
                    (resultTextElement.scrollHeight - resultTextElement.clientHeight);
            }
            
            setTimeout(() => {
                isScrolling = false;
            }, 50);
        }
    });
}