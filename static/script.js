const settingsForm = document.getElementById("settingsForm");
const testContainer = document.getElementById("testContainer");
const questionList = document.getElementById("questionList");
const answerForm = document.getElementById("answerForm");
const resultsDiv = document.getElementById("results");

let currentQuestions = [];
let currentQuestionIndex = 0;
let answers = [];


const modeRadios = document.querySelectorAll('input[name="mode"]');
const questionsInput = document.getElementById("questionsInput");
const timeInput = document.getElementById("timeInput");

let startTime = null;
let timer = null;
let timeLimit = null;
let timeMode = false;
let timerInterval = null;


modeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        if (radio.value === "questions") {
            questionsInput.classList.remove("hidden");
            timeInput.classList.add("hidden");
        } else {
            questionsInput.classList.add("hidden");
            timeInput.classList.remove("hidden");
        }
    });
});


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

    timeMode = document.querySelector('input[name="mode"]:checked').value === "time";
    timeLimit = parseInt(document.getElementById("timeLimit").value);

    startTime = Date.now();
    const timerDisplay = document.getElementById("timerDisplay");

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(1, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    if (timeMode) {
        let remaining = timeLimit;
        timerDisplay.textContent = `⏱ ${formatTime(remaining)}`;
        timerInterval = setInterval(() => {
            remaining--;
            timerDisplay.textContent = `⏱ ${formatTime(remaining)}`;
            if (remaining <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000);
    } else {
        timerDisplay.textContent = `⏱ 0:00`;
        timerInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            timerDisplay.textContent = `⏱ ${formatTime(elapsed)}`;
        }, 1000);
    }


    if (timeMode) {
        timer = setTimeout(() => {
            answerForm.requestSubmit(); // auto-submit
        }, timeLimit * 1000);
    }


    let number_questions;
    if (timeMode) {
        number_questions = Math.ceil(timeLimit * 1.5); // dynamic for Time Challenge
    } else {
        number_questions = parseInt(document.getElementById("numQuestions").value);
    }
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
            <div class="question-label">
                Question ${index + 1}${timeMode ? "" : " of " + currentQuestions.length}
            </div>
            <div class="question-expression">${q.question}</div>
            <input type="text" id="answerInput" class="answer-box" value="${savedAnswer}">
        </div>
        <div class="nav-buttons">
            ${index < currentQuestions.length - 1? '<button type="button" id="nextBtn">Next</button>': '<button type="submit" id="submitBtn">Submit</button>'}
            <button type="button" id="prevBtn" style="visibility: ${index > 0 ? 'visible' : 'hidden'};">Previous</button>
            <button type="button" id="exitBtn">Exit</button>
        </div>
    `;

    const input = document.getElementById("answerInput");
    input.focus();  // Optional: auto-focus input

    input.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();  // 🛑 Don't submit the form

            const nextBtn = document.getElementById("nextBtn");
            const submitBtn = document.getElementById("submitBtn");

            if (nextBtn) {
                nextBtn.click();
            } else if (submitBtn) {
                submitBtn.click();
            }
        }
    });


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

    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000); // in seconds
    if (timer) clearTimeout(timer);
    clearInterval(timerInterval);
    document.getElementById("timerDisplay").textContent = "";



    const res = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
    });

    const data = await res.json();

    let answeredCount = answers.filter(a => a !== "").length

    resultsDiv.innerHTML = `
        <div class="result-card">
            <h2>📊 Test Results</h2>
            <div class="result-item"><strong>Score:</strong> ${data.score}</div>
            <div class="result-item"><strong>Correct:</strong> ${data.correct} / ${timeMode ? answeredCount : data.total}</div>
            <div class="result-item"><strong>Accuracy:</strong> ${data.accuracy}%</div>
            ${timeMode? `<div class="result-item"><strong>Time Limit:</strong> ${timeLimit} sec</div>
            <div class="result-item"><strong>Questions Answered:</strong> ${answeredCount}</div>`: `<div class="result-item"><strong>Time Taken:</strong> ${timeTaken} sec</div>`}
            <button type="button" id="exitAfterResults" class="exit-button">Exit</button>
            <button type="button" id="viewAnswersBtn" class="view-button">View Answers</button>
            <div id="answerReview" class="hidden"></div>
        </div>
    `;

    document.getElementById("viewAnswersBtn").addEventListener("click", () => {
        const container = document.getElementById("answerReview");
        container.classList.remove("hidden");
    
        const limitedResults = data.results.slice(0, answeredCount);
    
        container.innerHTML = limitedResults.map((r, i) => {
            const bgColor = r.status === "correct" ? "lightgreen" : "#f8d0d0";
            return `
                <div class="answer-block" style="background-color: ${bgColor};">
                    <div><strong>Question ${i + 1}:</strong> ${r.question}</div>
                    <div><strong>Your Answer:</strong> ${r.user_answer}</div>
                    <div><strong>Correct Answer:</strong> ${r.correct_answer}</div>
                </div>
            `;
        }).join("");
    });
    
    

    resultsDiv.classList.remove("hidden");
    testContainer.classList.add("hidden");
    document.getElementById("exitAfterResults").addEventListener("click", () => {
        resultsDiv.classList.add("hidden");
        document.getElementById("settingsForm").classList.remove("hidden");
    });
    
});
