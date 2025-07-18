const settingsForm = document.getElementById("settingsForm");
const testContainer = document.getElementById("testContainer");
const questionList = document.getElementById("questionList");
const answerForm = document.getElementById("answerForm");
const resultsDiv = document.getElementById("results");

let currentQuestions = [];
let currentQuestionIndex = 0;
let answers = [];

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
        rangeDiv.style.display = checkbox.checked ? 'flex' : 'none';
    });

    // Initial hide on page load if unchecked
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

    const pointsCorrect = parseInt(document.getElementById("pointsCorrect").value);
    const pointsBlank = parseInt(document.getElementById("pointsBlank").value);
    const pointsWrong = parseInt(document.getElementById("pointsWrong").value);

    const res = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            number_questions,
            operations,
            ranges_by_op,
            decimals: [0, 0],
            exact_division: true,
            rating: [pointsCorrect, pointsBlank, pointsWrong]
        })
    });

    const data = await res.json();
    currentQuestions = data.questions;
    answers = Array(currentQuestions.length).fill("");
    currentQuestionIndex = 0;

    testContainer.classList.remove("hidden");
    settingsForm.classList.add("hidden");
    resultsDiv.classList.add("hidden");

    renderQuestion(currentQuestionIndex);
});

function renderQuestion(index) {
    const q = currentQuestions[index];
    const savedAnswer = answers[index] || "";

    questionList.innerHTML = `
        <div class="question">
            <div class="question-label">Question ${index + 1} of ${currentQuestions.length}</div>
            <div class="question-expression">${q.question}</div>
            <input type="text" id="answerInput" class="answer-box" value="${savedAnswer}">
        </div>
        <div class="nav-buttons">
            <button type="button" id="exitBtn">Exit</button>
            <button type="button" id="prevBtn" style="visibility: ${index > 0 ? 'visible' : 'hidden'};">Previous</button>
            ${index < currentQuestions.length - 1? '<button type="button" id="nextBtn">Next</button>': '<button type="submit" id="submitBtn">Submit</button>'}
        </div>
    `;

    if (index > 0) {
        document.getElementById("prevBtn").addEventListener("click", () => {
            answers[index] = document.getElementById("answerInput").value.trim();
            currentQuestionIndex--;
            renderQuestion(currentQuestionIndex);
        });
    }

    if (index < currentQuestions.length - 1) {
        document.getElementById("nextBtn").addEventListener("click", () => {
            answers[index] = document.getElementById("answerInput").value.trim();
            currentQuestionIndex++;
            renderQuestion(currentQuestionIndex);
        });
    }

    document.getElementById("exitBtn").addEventListener("click", () => {
        if (confirm("Are you sure you want to exit the test? All progress will be lost.")) {
            // Reset the test view
            testContainer.classList.add("hidden");
            resultsDiv.classList.add("hidden");
            document.getElementById("settingsForm").classList.remove("hidden");
        }
    });
    
}

answerForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    answers[currentQuestionIndex] = document.getElementById("answerInput").value.trim();

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
        <button type="button" id="exitAfterResults">Exit</button>
    `;

    resultsDiv.classList.remove("hidden");
    testContainer.classList.add("hidden");
    document.getElementById("exitAfterResults").addEventListener("click", () => {
        resultsDiv.classList.add("hidden");
        document.getElementById("settingsForm").classList.remove("hidden");
    });
    
});
