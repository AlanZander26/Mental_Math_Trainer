from flask import Flask, jsonify, request, render_template
from math_test import Test

app = Flask(__name__)

current_test = None

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate_test():
    global current_test
    data = request.get_json()

    number_questions = data.get("number_questions", 5)
    operations = data.get("operations", ["+", "-", "*", "/"])
    decimals = data.get("decimals", [0, 0])
    exact_division = data.get("exact_division", True)

    # Expecting a dictionary like { "+": [[1, 10], [1, 10]], "-" : [[5, 20], [0, 10]], ... }
    raw_ranges = data.get("ranges_by_op", {})

    # Convert list-based JSON input to tuple-based Python input
    ranges_by_op = {}
    for op in operations:
        if op not in raw_ranges:
            return jsonify({"error": f"Missing range for operation {op}"}), 400
        try:
            range1 = tuple(raw_ranges[op][0])
            range2 = tuple(raw_ranges[op][1])
            ranges_by_op[op] = (range1, range2)
        except:
            return jsonify({"error": f"Invalid range format for operation {op}"}), 400

    current_test = Test(
        number_questions=number_questions,
        ranges_by_op=ranges_by_op,
        operations_list=operations,
        decimals=tuple(decimals),
        exact_division=exact_division
    )

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

if __name__ == "__main__":
    app.run(debug=True)
