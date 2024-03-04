from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
@app.route('/index')
def show_index():
    # 这里可以根据实际情况填充台架、版本和航线的选项
    test_stands = ['K4.5', 'K5.0']
    routes = ['航线1', '航线2', '航线3']
    return render_template('index.html', test_stands=test_stands, routes=routes)

#测试报告页面
@app.route('/test_reports')
def show_test_reports():
    return render_template('test_reports.html')

@app.route('/test_results')
def show_test_results():
    return render_template('test_results.html')


if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0',port=1234)