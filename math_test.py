import numpy as np
import time
from sympy import divisors


class Question:
    _supported_operations = ["+", "-", "*", "/"]

    def __init__(self, operand1, operand2, operation):
        if operation not in self._supported_operations:
            raise ValueError(f"Invalid operation: {operation}. Supported operations are {', '.join(self._supported_operations)}.")
        self.operand1 = operand1
        self.operand2 = operand2
        self.operation = operation
        self.operation_str = f"{operand1} {operation} {operand2}"
        self.answer = float(eval(self.operation_str))    

    def to_dict(self):
        def format_number(n):
            return str(int(n)) if n == int(n) else str(n)

        op_symbols = {
            "+": "+",
            "-": "−",
            "*": "×",
            "/": "÷"
        }

        pretty = f"{format_number(self.operand1)} {op_symbols[self.operation]} {format_number(self.operand2)}"

        return {
            "operand1": self.operand1,
            "operand2": self.operand2,
            "operation": self.operation,
            "question": pretty  
        }
    
    def __str__(self):
        return self.to_dict()["question"]



class Test:

    def __init__(self, number_questions, ranges_by_op, operations_list=["+", "-", "*", "/"], decimals=(0, 0), exact_division=True):
            self.number_questions = number_questions
            self.ranges_by_op = ranges_by_op
            self.operations_list = operations_list
            self.questions = self._generate_questions(decimals=decimals, exact_division=exact_division)

    def _generate_questions(self, decimals=(0, 0), exact_division=True):
        questions = []
        for _ in range(self.number_questions):
            op = np.random.choice(self.operations_list)
            r1, r2 = self.ranges_by_op[op]
            n1 = np.random.randint(r1[0], r1[1]+1)
            n2 = np.random.randint(r2[0], r2[1]+1)
            if exact_division and op == "/":
                divs = divisors(n1)
                if len(divs) > 2:
                    filtered_divs = [d for d in divs if r2[0] <= d <= r2[1] and d != 1 and d != n1]
                    n2 = np.random.choice(filtered_divs)
                elif divs:
                    n2 = np.random.choice(divs)
            n1 = n1 * 10.0 ** (-np.random.choice(np.arange(decimals[0] + 1)))
            n2 = n2 * 10.0 ** (-np.random.choice(np.arange(decimals[1] + 1)))
            questions.append(Question(n1, n2, op))
        return questions


    def get_questions(self):
        return [q.to_dict() for q in self.questions]

    def grade_test(self, user_answers, rating=[1, -2, -3]):
        result = 0
        correct = 0
        results = []
        for q, user_answer in zip(self.questions, user_answers):
            try:
                user_answer = float(user_answer)
                if user_answer == q.answer:
                    result += rating[0]
                    correct += 1
                    status = "correct"
                else:
                    result += rating[2]
                    status = "wrong"
            except:
                result += rating[1]
                status = "invalid"
            results.append({
                "question": str(q),
                "correct_answer": q.answer,
                "user_answer": user_answer,
                "status": status
            })
        return {
            "score": result,
            "correct": correct,
            "total": self.number_questions,
            "accuracy": round(100 * correct / self.number_questions, 2),
            "results": results
        }
