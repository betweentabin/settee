document.addEventListener('DOMContentLoaded', () => {
  // ドラッグ&ドロップ機能
  const dragDropContainer = document.querySelector(".drag-drop-container");
  const fileUpload = document.getElementById("file-upload");

  dragDropContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    dragDropContainer.style.borderColor = "#007bff";
  });

  dragDropContainer.addEventListener("dragleave", () => {
    dragDropContainer.style.borderColor = "#ccc";
  });

  dragDropContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDropContainer.style.borderColor = "#ccc";

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileUpload.files = files;
      handleFileUpload(files[0]);
    }
  });

  dragDropContainer.addEventListener("click", () => {
    fileUpload.click();
  });

  function handleFileUpload(file) {
    console.log("アップロードされたファイル:", file);
    // ここにファイルを処理するコードを追加
  }
});