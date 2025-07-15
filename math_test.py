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

    def __str__(self):
        return self.operation_str    

    def to_dict(self):
        return {
            "question": self.operation_str,
            "operand1": self.operand1,
            "operand2": self.operand2,
            "operation": self.operation
        }

class Test:
    def __init__(self, range1, range2, number_questions, operations_list=["+", "-", "*", "/"], decimals=(0, 0), exact_division=True):
        self.range1 = range1
        self.range2 = range2
        self.number_questions = number_questions
        self.operations_list = operations_list
        self.questions = self._generate_questions(decimals=decimals, exact_division=exact_division)

    def _generate_questions(self, decimals=(0, 0), exact_division=True):
        numbers1 = np.random.randint(self.range1[0], self.range1[1]+1, self.number_questions)
        numbers2 = np.random.randint(self.range2[0], self.range2[1]+1, self.number_questions)
        operations = np.random.choice(self.operations_list, self.number_questions)
        if exact_division:
            n2div = [np.random.choice(divisors(n1)[1:-1]) if len(divisors(n1)) > 2 else np.random.choice(divisors(n1)) for n1 in numbers1]
            numbers2 = np.where(operations == "/", n2div, numbers2)
        numbers1 = numbers1 * 10.0 ** (-np.random.choice(np.arange(decimals[0] + 1), self.number_questions))
        numbers2 = numbers2 * 10.0 ** (-np.random.choice(np.arange(decimals[1] + 1), self.number_questions))
        return [Question(numbers1[i], numbers2[i], operations[i]) for i in range(self.number_questions)]

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
