from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    # 这里可以根据实际情况填充台架、版本和航线的选项
    test_stands = ['K4.5', 'K5.0']
    routes = ['航线1', '航线2', '航线3']
    return render_template('index.html', test_stands=test_stands, routes=routes)

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0',port=1234)