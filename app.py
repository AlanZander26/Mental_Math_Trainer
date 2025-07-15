from flask import Flask, jsonify, request, render_template
from math_test import Test

app = Flask(__name__)

# We'll store the current test in memory for now
current_test = None

@app.route("/generate", methods=["POST"])
def generate_test():
    global current_test
    data = request.get_json()
    range1 = data.get("range1", [1, 10])
    range2 = data.get("range2", [1, 10])
    number_questions = data.get("number_questions", 5)
    operations = data.get("operations", ["+", "-", "*", "/"])
    current_test = Test(range1=range1, range2=range2, number_questions=number_questions, operations_list=operations)
    questions = current_test.get_questions()
    return jsonify({"questions": questions})


@app.route("/submit", methods=["POST"])
def submit_test():
    global current_test
    if not current_test:
        return jsonify({"error": "No test generated yet"}), 400
    data = request.get_json()
    user_answers = data.get("answers", [])
    result = current_test.grade_test(user_answers)
    return jsonify(result)

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
