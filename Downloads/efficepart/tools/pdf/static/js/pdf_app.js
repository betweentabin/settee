let currentSplitPoints = new Set();
let totalPagesCount = 0;
let pdfGroups = [];
let selectedDeletePages = new Set();
let selectedExtractPages = new Set();

function updatePdfGroups() {
    const points = Array.from(currentSplitPoints).sort((a, b) => a - b);
    pdfGroups = [];
    let start = 1;
    
    points.forEach(point => {
        pdfGroups.push({
            start: start,
            end: point
        });
        start = point + 1;
    });

    if (start <= totalPagesCount) {
        pdfGroups.push({
            start: start,
            end: totalPagesCount
        });
    }

    // 分割情報の表示を更新
    const splitInfo = document.querySelector('.split-info');
    if (pdfGroups.length > 1) {
        splitInfo.innerHTML = '<p>分割後のPDF:</p>' + pdfGroups.map((group, index) => 
            `<div class="group-info">PDF ${index + 1}: ${group.start}ページ目 ～ ${group.end}ページ目</div>`
        ).join('');
    } else {
        splitInfo.innerHTML = '';
    }

    // ページグループのスタイルを更新
    document.querySelectorAll('.pdf-page').forEach(page => {
        const pageNum = parseInt(page.dataset.pageNumber);
        page.classList.remove('group-start', 'group-end');
        
        pdfGroups.forEach(group => {
            if (pageNum === group.start) page.classList.add('group-start');
            if (pageNum === group.end) page.classList.add('group-end');
        });
    });
}

async function renderPage(pdf, pageNumber, container) {
    const page = await pdf.getPage(pageNumber);
    const scale = 0.3;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const pageDiv = document.createElement('div');
    pageDiv.className = 'pdf-page';
    pageDiv.dataset.pageNumber = pageNumber;
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;
    
    const previewContent = document.createElement('div');
    previewContent.className = 'preview-content';
    previewContent.appendChild(canvas);
    pageDiv.appendChild(previewContent);

    const pageInfo = document.createElement('div');
    pageInfo.className = 'file-info';
    
    const pageLabel = document.createElement('div');
    pageLabel.className = 'file-name';
    pageLabel.textContent = `ページ ${pageNumber}`;
    pageInfo.appendChild(pageLabel);
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    previewContainer.appendChild(pageDiv);
    previewContainer.appendChild(pageInfo);
    
    container.appendChild(previewContainer);

    // 分割線コンテナを追加（最後のページ以外）
    if (pageNumber < totalPagesCount) {
        const splitLineContainer = document.createElement('div');
        splitLineContainer.className = 'split-line-container';
        splitLineContainer.dataset.afterPage = pageNumber;
        
        splitLineContainer.addEventListener('click', function() {
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                currentSplitPoints.delete(pageNumber);
            } else {
                this.classList.add('active');
                currentSplitPoints.add(pageNumber);
            }
            updatePdfGroups();
        });
        
        container.appendChild(splitLineContainer);
    }
}

// PDF結合用の関数
const pdfList = [];

async function renderPdfPreview(file, container) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
    const page = await pdf.getPage(1); // 最初のページ（表紙）のみ
    
    const scale = 0.3;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;
    
    const previewDiv = document.createElement('div');
    previewDiv.className = 'pdf-preview-item';
    
    const previewContent = document.createElement('div');
    previewContent.className = 'preview-content';
    previewContent.appendChild(canvas);
    
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.title = file.name;
    fileName.textContent = file.name;
    
    const pageCount = document.createElement('div');
    pageCount.className = 'page-count';
    pageCount.textContent = `${pdf.numPages}ページ`;
    
    fileInfo.appendChild(fileName);
    fileInfo.appendChild(pageCount);
    
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-pdf';
    removeButton.textContent = '×';
    removeButton.onclick = () => {
        const index = pdfList.indexOf(file);
        if (index > -1) {
            pdfList.splice(index, 1);
            const containerChildren = Array.from(container.children);
            const previewContainerIndex = containerChildren.indexOf(previewContainer);
            
            // 前の+記号を削除
            if (previewContainerIndex > 0) {
                container.removeChild(containerChildren[previewContainerIndex - 1]);
            }
            // 次の+記号を削除（最後の要素でない場合）
            if (previewContainerIndex < containerChildren.length - 1 && 
                containerChildren[previewContainerIndex + 1].classList.contains('combine-plus')) {
                container.removeChild(containerChildren[previewContainerIndex + 1]);
            }
            
            previewContainer.remove();
            updateCombineButton();

            // ファイル入力をリセット
            document.getElementById('pdfUpload').value = '';
        }
    };
    
    previewDiv.appendChild(previewContent);
    previewDiv.appendChild(removeButton);
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    previewContainer.appendChild(previewDiv);
    previewContainer.appendChild(fileInfo);
    
    if (container.children.length > 0) {
        const plusIcon = document.createElement('div');
        plusIcon.className = 'combine-plus';
        container.appendChild(plusIcon);
    }
    
    container.appendChild(previewContainer);
}

function updatePdfCount() {
    const countElement = document.getElementById('pdfCount');
    countElement.textContent = pdfList.length;
    document.getElementById('pdfPreview').style.display = pdfList.length > 0 ? 'block' : 'none';
}

function updateCombineButton() {
    const submitButton = document.querySelector('#combineForm button[type="submit"]');
    submitButton.disabled = pdfList.length < 2;
    document.getElementById('pdfPreview').style.display = pdfList.length > 0 ? 'block' : 'none';
}

// PDF削除用の関数
let deleteTotalPagesCount = 0;

async function renderDeletePage(pdf, pageNumber, container) {
    const page = await pdf.getPage(pageNumber);
    const scale = 0.3;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const pageDiv = document.createElement('div');
    pageDiv.className = 'pdf-page';
    pageDiv.dataset.pageNumber = pageNumber;
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;
    
    const previewContent = document.createElement('div');
    previewContent.className = 'preview-content';
    previewContent.appendChild(canvas);

    const deleteIcon = document.createElement('div');
    deleteIcon.className = 'page-delete-icon';
    deleteIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    previewContent.appendChild(deleteIcon);
    
    pageDiv.appendChild(previewContent);

    const pageInfo = document.createElement('div');
    pageInfo.className = 'file-info';
    
    const pageLabel = document.createElement('div');
    pageLabel.className = 'file-name';
    pageLabel.textContent = `ページ ${pageNumber}`;
    pageInfo.appendChild(pageLabel);
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    previewContainer.appendChild(pageDiv);
    previewContainer.appendChild(pageInfo);
    
    // クリックイベントを追加
    pageDiv.addEventListener('click', function() {
        if (this.classList.contains('page-selected')) {
            this.classList.remove('page-selected');
            selectedDeletePages.delete(pageNumber);
        } else {
            this.classList.add('page-selected');
            selectedDeletePages.add(pageNumber);
        }
        updateDeleteInfo();
    });
    
    container.appendChild(previewContainer);
}

function updateDeleteInfo() {
    const deleteInfo = document.querySelector('.delete-info');
    if (selectedDeletePages.size > 0) {
        const sortedPages = Array.from(selectedDeletePages).sort((a, b) => a - b);
        deleteInfo.innerHTML = '<p>選択したページ: ' + sortedPages.join(', ') + '</p>';
        document.querySelector('#deleteForm button[type="submit"]').disabled = false;
    } else {
        deleteInfo.innerHTML = '';
        document.querySelector('#deleteForm button[type="submit"]').disabled = true;
    }
}

// 抽出情報の更新
function updateExtractInfo() {
    const selectedPages = document.querySelectorAll('#extractPageContainer .page-selected');
    const extractInfo = document.querySelector('.extract-info');
    
    if (selectedPages.length > 0) {
        const pageNumbers = Array.from(selectedPages).map(page => page.dataset.page);
        extractInfo.textContent = `選択したページ: ${pageNumbers.length}ページ`;
    } else {
        extractInfo.textContent = '';
    }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', function() {
    // PDF分割機能
    document.getElementById('pdfFile').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('pdf_file', file);

        try {
            const response = await fetch('/preview', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.error) {
                alert(data.error);
                return;
            }

            totalPagesCount = data.num_pages;
            document.getElementById('totalPages').textContent = totalPagesCount;
            document.getElementById('pagePreview').style.display = 'block';

            // PDFプレビューの表示
            const pageContainer = document.getElementById('pageContainer');
            pageContainer.innerHTML = '';
            currentSplitPoints.clear();
            pdfGroups = [];

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            
            for (let i = 1; i <= pdf.numPages; i++) {
                await renderPage(pdf, i, pageContainer);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('エラーが発生しました');
        }
    });

    document.getElementById('resetSplits').addEventListener('click', function() {
        const splitLines = document.querySelectorAll('.split-line-container.active');
        splitLines.forEach(line => line.classList.remove('active'));
        currentSplitPoints.clear();
        updatePdfGroups();
    });

    document.getElementById('splitForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (currentSplitPoints.size === 0) {
            alert('少なくとも1つの分割位置を選択してください');
            return;
        }

        const splitPoints = Array.from(currentSplitPoints).sort((a, b) => a - b);
        const formData = new FormData(this);
        splitPoints.forEach(point => {
            formData.append('split_points[]', point);
        });

        fetch('/split', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.blob();
            }
            throw new Error('分割処理に失敗しました');
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'split_pdfs.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    });

    // PDF結合機能
    document.getElementById('pdfUpload').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('PDFファイルのみアップロード可能です');
            this.value = '';
            return;
        }

        pdfList.push(file);
        await renderPdfPreview(file, document.querySelector('.pdf-list'));
        updateCombineButton();
        this.value = ''; // 入力をリセット
    });

    document.getElementById('combineForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (pdfList.length < 2) {
            alert('少なくとも2つのPDFファイルを選択してください');
            return;
        }

        const formData = new FormData();
        pdfList.forEach(file => {
            formData.append('pdf_files', file);
        });

        fetch('/combine', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.blob();
            }
            throw new Error('結合処理に失敗しました');
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'combined.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    });

    // PDF削除機能
    document.getElementById('deleteFile').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('PDFファイルのみアップロード可能です');
            this.value = '';
            return;
        }

        try {
            const formData = new FormData();
            formData.append('pdf_file', file);
            const response = await fetch('/preview', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.error) {
                alert(data.error);
                return;
            }

            deleteTotalPagesCount = data.num_pages;
            document.getElementById('deleteTotalPages').textContent = `${deleteTotalPagesCount}ページ`;
            document.getElementById('deletePreview').style.display = 'block';

            const pageContainer = document.getElementById('deletePageContainer');
            pageContainer.innerHTML = '';
            selectedDeletePages.clear();

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            
            for (let i = 1; i <= pdf.numPages; i++) {
                await renderDeletePage(pdf, i, pageContainer);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('エラーが発生しました');
        }
    });

    document.getElementById('resetDelete').addEventListener('click', function() {
        const selectedPages = document.querySelectorAll('.pdf-page.page-selected');
        selectedPages.forEach(page => page.classList.remove('page-selected'));
        selectedDeletePages.clear();
        updateDeleteInfo();
    });

    document.getElementById('deleteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (selectedDeletePages.size === 0) {
            alert('削除するページを選択してください');
            return;
        }

        const deletePages = Array.from(selectedDeletePages).sort((a, b) => a - b);
        const formData = new FormData(this);
        deletePages.forEach(page => {
            formData.append('delete_pages[]', page);
        });

        fetch('/delete', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.blob();
            }
            throw new Error('削除処理に失敗しました');
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'modified.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    });

    // PDF抽出機能
    document.getElementById('extractFile').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('pdf_file', file);

            try {
                const response = await fetch('/preview', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.error) {
                    alert(data.error);
                    return;
                }

                document.getElementById('extractPreview').style.display = 'block';
                document.getElementById('extractTotalPages').textContent = `${data.num_pages}ページ`;

                const container = document.getElementById('extractPageContainer');
                container.innerHTML = '';

                // PDFをレンダリング
                const pdfBytes = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({data: pdfBytes}).promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const scale = 0.5;
                    const viewport = page.getViewport({scale: scale});

                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'pdf-page';
                    pageDiv.dataset.page = i;

                    const previewContent = document.createElement('div');
                    previewContent.className = 'preview-content';

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    previewContent.appendChild(canvas);
                    pageDiv.appendChild(previewContent);

                    // ページ番号を追加
                    const pageNumber = document.createElement('div');
                    pageNumber.className = 'page-number';
                    pageNumber.textContent = `${i}ページ`;
                    pageDiv.appendChild(pageNumber);

                    // クリックイベントを追加
                    pageDiv.addEventListener('click', function() {
                        this.classList.toggle('page-selected');
                        updateExtractInfo();
                    });

                    container.appendChild(pageDiv);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('PDFの読み込み中にエラーが発生しました');
            }
        }
    });

    document.getElementById('resetExtract').addEventListener('click', function() {
        const selectedPages = document.querySelectorAll('#extractPageContainer .page-selected');
        selectedPages.forEach(page => page.classList.remove('page-selected'));
        updateExtractInfo();
    });

    document.getElementById('extractForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const selectedPages = document.querySelectorAll('#extractPageContainer .page-selected');
        if (selectedPages.length === 0) {
            alert('ページを選択してください');
            return;
        }

        const formData = new FormData(this);
        const pageNumbers = Array.from(selectedPages).map(page => page.dataset.page);
        pageNumbers.forEach(page => formData.append('extract_pages[]', page));

        try {
            const response = await fetch('/extract', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'extracted.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                alert('PDFの抽出中にエラーが発生しました');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('PDFの抽出中にエラーが発生しました');
        }
    });

    // 全選択機能
    document.getElementById('selectAllSplit').addEventListener('click', function() {
        const splitLineContainers = document.querySelectorAll('.split-line-container');
        splitLineContainers.forEach(container => {
            const pageNumber = parseInt(container.dataset.afterPage);
            container.classList.add('active');
            currentSplitPoints.add(pageNumber);
        });
        updatePdfGroups();
    });

    document.getElementById('selectAllDelete').addEventListener('click', function() {
        const pages = document.querySelectorAll('#deletePageContainer .pdf-page');
        pages.forEach(page => {
            const pageNumber = parseInt(page.dataset.pageNumber);
            page.classList.add('page-selected');
            selectedDeletePages.add(pageNumber);
        });
        updateDeleteInfo();
    });

    document.getElementById('selectAllExtract').addEventListener('click', function() {
        const pages = document.querySelectorAll('#extractPageContainer .pdf-page');
        pages.forEach(page => {
            page.classList.add('page-selected');
        });
        updateExtractInfo();
    });
}); 