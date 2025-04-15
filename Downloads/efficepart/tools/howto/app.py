from flask import Flask, render_template, send_from_directory
import os

# テンプレートとスタティックファイルのパスを設定
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'templates', 'pages'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'static'))

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

@app.route('/')
def index():
    return render_template('howto_index.html')

@app.route('/api/howto/content/<path:page>')
def get_content(page):
    try:
        return render_template(f'{page}.html')
    except:
        return "Page not found", 404

if __name__ == '__main__':
    app.run(debug=True, port=5004) 