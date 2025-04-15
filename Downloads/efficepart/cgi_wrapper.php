#!/usr/bin/php
<?php
// Python実行ラッパー
// このスクリプトはPHPからPythonスクリプトを呼び出すためのラッパーです

// ログディレクトリの作成
$log_dir = dirname(__FILE__) . '/logs';
if (!file_exists($log_dir)) {
    mkdir($log_dir, 0755, true);
}

// ログファイルのパス
$log_file = $log_dir . '/cgi_wrapper.log';

// ログ関数
function write_log($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message" . PHP_EOL;
    file_put_contents($log_file, $log_message, FILE_APPEND);
}

// リクエスト開始のログ
write_log("==================== リクエスト開始 ====================");
write_log("リクエストURI: " . $_SERVER['REQUEST_URI']);
write_log("リクエストメソッド: " . $_SERVER['REQUEST_METHOD']);
write_log("リモートアドレス: " . $_SERVER['REMOTE_ADDR']);
write_log("ユーザーエージェント: " . $_SERVER['HTTP_USER_AGENT']);

// セキュリティ設定
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// リクエスト情報の取得
$request_uri = $_SERVER['REQUEST_URI'];
$script_name = $_SERVER['SCRIPT_NAME'];

// リクエストパスの取得とXサーバー環境の対応
$request_path = '/';
if (strpos($request_uri, $script_name) === 0) {
    $path = substr($request_uri, strlen($script_name));
    if (!empty($path)) {
        $request_path = $path;
    }
} else {
    // Xサーバー環境対応：パスを処理
    $path = $request_uri;
    
    // public_html/efficepart/から始まるパスを処理
    if (strpos($path, '/public_html/efficepart/') === 0) {
        $path = substr($path, strlen('/public_html/efficepart/'));
        $request_path = '/' . $path;
    } 
    // efficepart/から始まるパスを処理
    elseif (strpos($path, '/efficepart/') === 0) {
        $path = substr($path, strlen('/efficepart/'));
        $request_path = '/' . $path;
    }
    // static/から始まるパスの特別処理
    elseif (strpos($path, '/static/') === 0) {
        $request_path = $path;  // そのまま保持
    }
    // それ以外のパスはそのまま使用
    else {
        $request_path = $path;
    }
}

write_log("リクエストパス: $request_path (元のURI: $request_uri)");

// Pythonスクリプトのパス設定
$python_script_dir = dirname(__FILE__) . '/python';

// リクエストに応じたスクリプトの選択
if (isset($_GET['script'])) {
    // 従来の方式: script=名前 でスクリプトを選択
    $script_path = basename($_GET['script']);
    $full_script_path = $python_script_dir . '/' . $script_path . '.py';
    write_log("スクリプト指定あり: $script_path");
} elseif (isset($_GET['path']) && strpos($_GET['path'], 'static/') === 0) {
    // 静的ファイルへの直接アクセス
    $path = $_GET['path'];
    write_log("静的ファイル直接アクセス: $path");
    
    // ファイルパス
    $file_path = dirname(__FILE__) . '/' . $path;
    write_log("ファイルパス: $file_path");
    
    if (file_exists($file_path)) {
        // MIMEタイプの判定
        $ext = pathinfo($file_path, PATHINFO_EXTENSION);
        $mime_types = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml'
        ];
        
        $mime_type = isset($mime_types[$ext]) ? $mime_types[$ext] : 'application/octet-stream';
        
        // ヘッダー設定
        header("Content-Type: $mime_type");
        header("Content-Length: " . filesize($file_path));
        
        // ファイル出力
        readfile($file_path);
        write_log("静的ファイル配信完了: $path ($mime_type)");
        exit;
    } else {
        write_log("エラー: 静的ファイルが見つかりません: $file_path");
        header('HTTP/1.0 404 Not Found');
        echo "File not found";
        exit;
    }
} else {
    // 新方式: WSGIアプリケーションを実行
    $full_script_path = $python_script_dir . '/wsgi_app.py';
    write_log("WSGIアプリケーション実行");
}

write_log("スクリプトパス: $full_script_path");

if (!file_exists($full_script_path)) {
    write_log("エラー: スクリプトが見つかりません: $full_script_path");
    header('Content-Type: application/json');
    echo json_encode(['error' => 'スクリプトが見つかりません: ' . $full_script_path]);
    exit;
}

// パラメータの取得
$params = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $params = $_POST;
    write_log("POSTパラメータ: " . json_encode($_POST));
} else {
    $params = $_GET;
    write_log("GETパラメータ: " . json_encode($_GET));
}

// パスを追加
$params['path'] = $request_path;

// リクエストデータの用意
$json_params = json_encode($params);
write_log("JSONパラメータ: $json_params");

// 一時ファイルにリクエストデータを保存
$temp_file = tempnam(sys_get_temp_dir(), 'py_request_');
file_put_contents($temp_file, $json_params);
write_log("一時ファイル作成: $temp_file");

// Pythonの実行パス（シェアードホスティングでは環境変数に注意）
$python_path = '/usr/bin/python3'; // Xサーバーでの一般的なPythonパス

// コマンドの実行
$command = sprintf('%s %s %s 2>&1', $python_path, escapeshellarg($full_script_path), escapeshellarg($temp_file));
write_log("実行コマンド: $command");

$start_time = microtime(true);
$result = shell_exec($command);
$execution_time = microtime(true) - $start_time;

write_log("実行時間: " . round($execution_time * 1000) . "ms");

// 一時ファイルの削除
unlink($temp_file);
write_log("一時ファイル削除: $temp_file");

// レスポンスヘッダーの設定
if (strpos($result, '<!DOCTYPE html>') !== false || strpos($result, '<html') !== false) {
    header('Content-Type: text/html; charset=UTF-8');
    write_log("レスポンスタイプ: HTML");
} else {
    // JSONレスポンスと仮定
    header('Content-Type: application/json; charset=UTF-8');
    write_log("レスポンスタイプ: JSON");
    // JSONデータのログ（短縮版）
    $json_preview = substr($result, 0, 200);
    if (strlen($result) > 200) {
        $json_preview .= '...';
    }
    write_log("レスポンスデータ: $json_preview");
}

// リクエスト完了のログ
write_log("リクエスト完了");
write_log("==================== リクエスト終了 ====================\n");

// 結果の出力
echo $result;
?> 