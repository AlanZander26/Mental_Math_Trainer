const settingsForm = document.getElementById("settingsForm");
const testContainer = document.getElementById("testContainer");
const questionList = document.getElementById("questionList");
const answerForm = document.getElementById("answerForm");
const resultsDiv = document.getElementById("results");

let currentQuestions = [];

const opCheckboxes = document.querySelectorAll('input[type="checkbox"][value]');
const opToRangeId = {
    '+': 'range-plus',
    '-': 'range-minus',
    '*': 'range-mult',
    '/': 'range-div'
};

opCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const rangeId = opToRangeId[checkbox.value];
        const rangeDiv = document.getElementById(rangeId);
        if (checkbox.checked) {
            rangeDiv.style.display = 'flex'; // or 'block'
        } else {
            rangeDiv.style.display = 'none';
        }
    });

    // Hide on page load if unchecked
    const rangeId = opToRangeId[checkbox.value];
    const rangeDiv = document.getElementById(rangeId);
    if (!checkbox.checked) {
        rangeDiv.style.display = 'none';
    }
});


settingsForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const number_questions = parseInt(document.getElementById("numQuestions").value);
    const operations = Array.from(settingsForm.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

    const opMap = {
        "+": "plus",
        "-": "minus",
        "*": "mult",
        "/": "div"
    };

    const ranges_by_op = {};
    operations.forEach(op => {
        const prefix = opMap[op];

        const r1_min = parseInt(document.getElementById(`${prefix}_r1_min`).value);
        const r1_max = parseInt(document.getElementById(`${prefix}_r1_max`).value);
        const r2_min = parseInt(document.getElementById(`${prefix}_r2_min`).value);
        const r2_max = parseInt(document.getElementById(`${prefix}_r2_max`).value);

        ranges_by_op[op] = [
            [r1_min, r1_max],
            [r2_min, r2_max]
        ];
    });

    const res = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            number_questions,
            operations,
            ranges_by_op,
            decimals: [0, 0],
            exact_division: true
        })
    });

    const data = await res.json();
    currentQuestions = data.questions;

    // Show questions
    questionList.innerHTML = "";
    currentQuestions.forEach((q, i) => {
        const div = document.createElement("div");
        div.className = "question";
        div.innerHTML = `
            <div class="question-label">Question ${i + 1}:</div>
            <div class="question-expression">${q.pretty || q.question}</div>
            <input type="text" name="answer" data-index="${i}" class="answer-box">
        `;
        questionList.appendChild(div);
    });

    testContainer.classList.remove("hidden");
    resultsDiv.classList.add("hidden");
});

answerForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const answers = Array.from(answerForm.querySelectorAll('input[name="answer"]'))
                         .map(input => input.value.trim());

    const res = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
    });

    const data = await res.json();

    resultsDiv.innerHTML = `
        <h2>Result</h2>
        <p>Score: ${data.score}</p>
        <p>Correct: ${data.correct} / ${data.total} (${data.accuracy}%)</p>
    `;

    resultsDiv.classList.remove("hidden");
});
