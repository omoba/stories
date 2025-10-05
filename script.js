document.addEventListener("DOMContentLoaded", () => {
  let currentStoryIndex = null;
  let stories = [];
  let hadiths = [];
  let quizzes = [];
  let completedStories = new Set(JSON.parse(localStorage.getItem("completedStories") || "[]"));

  const storyPanel = document.getElementById("story-panel");
  const hadithPanel = document.getElementById("hadith-panel");
  const coverPage = document.getElementById("cover-page");
  const coverImage = document.getElementById("cover-image");
  const coverReadBtn = document.getElementById("cover-read-btn");

  fetch("stories.json")
    .then(res => res.json())
    .then(data => {
      stories = data.stories;
      hadiths = data.hadith;
      loadHomepage();
    });

  fetch("quiz.json")
    .then(res => res.json())
    .then(data => {
      quizzes = data;
    });

  // ------------------ HOMEPAGE ------------------
  function loadHomepage() {
    document.body.classList.add("homepage-active");
    hadithPanel.style.display = "none";
    storyPanel.innerHTML = "";

    const grid = document.createElement("div");
    grid.classList.add("story-grid");

    stories.forEach((story, idx) => {
      const tile = document.createElement("div");
      tile.classList.add("story-tile");
      tile.dataset.index = idx;

      const imageSrc = `images/${story.title}.jpeg`;
      tile.innerHTML = `
        <img src="${imageSrc}" alt="${story.title}" class="tile-image" onerror="this.style.display='none'">
        <h3>${story.title}</h3>
      `;

      if (completedStories.has(idx)) {
        const imprint = document.createElement("div");
        imprint.classList.add("read-imprint");
        imprint.textContent = "READ";
        tile.appendChild(imprint);
      }

      tile.addEventListener("click", () => {
        // SHOW COVER PAGE
        coverImage.src = imageSrc;
        coverPage.style.display = "flex";
        hadithPanel.style.display = "none";
        storyPanel.style.display = "none";

        // Remove previous listener if any
        coverReadBtn.replaceWith(coverReadBtn.cloneNode(true));
        const newReadBtn = document.getElementById("cover-read-btn");

        newReadBtn.addEventListener("click", () => {
          coverPage.style.display = "none";
          hadithPanel.style.display = "block";
          storyPanel.style.display = "block";
          document.body.classList.remove("homepage-active");
          loadStory(idx);
        });
      });

      grid.appendChild(tile);
    });

    storyPanel.appendChild(grid);
  }

  // ------------------ STORY PAGE ------------------
  function loadStory(index) {
    currentStoryIndex = index;
    document.body.classList.remove("homepage-active");
    hadithPanel.style.display = "block";
    storyPanel.innerHTML = "";

    const story = stories[index];
    const hadith = hadiths[story.hadithIndex];

    hadithPanel.innerHTML = `<h2>Hadith</h2><p>${hadith.text}</p>`;

    const storyDiv = document.createElement("div");
    storyDiv.classList.add("story");
    storyDiv.innerHTML = `
      <h2>${story.title}</h2>
      ${story.text}
      <div class="btn-row">
        <button id="doneBtn">DONE READING</button>
        <button id="homeBtn">BACK TO HOMEPAGE</button>
      </div>
    `;
    storyPanel.appendChild(storyDiv);

    document.getElementById("doneBtn").addEventListener("click", () => {
      displayStoryLeftPanel(story);
      loadQuiz(index);
    });

    document.getElementById("homeBtn").addEventListener("click", () => {
      loadHomepage();
    });
  }

  // ------------------ DISPLAY STORY IN LEFT PANEL ------------------
  function displayStoryLeftPanel(story) {
    hadithPanel.innerHTML = `
      <h2>${story.title}</h2>
      ${story.text}
    `;
  }

  // ------------------ QUIZ PAGE ------------------
  function loadQuiz(storyId) {
    storyPanel.innerHTML = "";
    const quiz = quizzes.find(q => q.storyId === storyId);
    if (!quiz) {
      storyPanel.innerHTML = "<p>No quiz available for this story.</p>";
      return;
    }

    const header = document.createElement("h2");
    header.textContent = "READING COMPREHENSION";
    header.classList.add("quiz-header");
    storyPanel.appendChild(header);

    const quizDiv = document.createElement("div");
    quizDiv.classList.add("quiz");

    quiz.questions.forEach((q, idx) => {
      const questionBlock = document.createElement("div");
      questionBlock.classList.add("question-block");

      let optionsHTML = "";
      q.options.forEach(opt => {
        optionsHTML += `
          <label>
            <input type="radio" name="q${idx}" value="${opt}">
            ${opt}
          </label><br>
        `;
      });

      questionBlock.innerHTML = `
        <p><strong>${idx + 1}. ${q.question}</strong></p>
        ${optionsHTML}
        <p class="feedback" style="font-weight:bold;"></p>
      `;
      quizDiv.appendChild(questionBlock);
    });

    const btnRow = document.createElement("div");
    btnRow.classList.add("btn-row");

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Submit Answers";

    const homeBtn = document.createElement("button");
    homeBtn.textContent = "Return to Homepage";

    const scoreDisplay = document.createElement("p");
    scoreDisplay.style.fontWeight = "bold";

    submitBtn.addEventListener("click", () => {
      let score = 0;
      quiz.questions.forEach((q, idx) => {
        const selected = quizDiv.querySelector(`input[name="q${idx}"]:checked`);
        const feedback = quizDiv.querySelectorAll(".feedback")[idx];

        if (selected) {
          if (selected.value === q.answer) {
            score++;
            feedback.textContent = "Correct!";
            feedback.style.color = "green";
          } else {
            feedback.textContent = `Incorrect! Correct: ${q.answer}`;
            feedback.style.color = "red";
          }
        } else {
          feedback.textContent = `No answer! Correct: ${q.answer}`;
          feedback.style.color = "red";
        }
      });
      scoreDisplay.textContent = `You scored ${score} out of ${quiz.questions.length}`;
    });

    homeBtn.addEventListener("click", () => {
      completedStories.add(storyId);
      localStorage.setItem("completedStories", JSON.stringify([...completedStories]));
      loadHomepage();
      animateReadStamp(storyId);
    });

    btnRow.appendChild(submitBtn);
    btnRow.appendChild(homeBtn);
    quizDiv.appendChild(btnRow);
    quizDiv.appendChild(scoreDisplay);
    storyPanel.appendChild(quizDiv);
  }

  // ------------------ "READ" STAMP ------------------
  function animateReadStamp(storyId) {
    const tile = document.querySelector(`.story-tile[data-index='${storyId}']`);
    if (tile) {
      let stampImprint = tile.querySelector(".read-imprint");
      if (!stampImprint) {
        const tempStamp = document.createElement("div");
        tempStamp.classList.add("stamp-temp");
        tempStamp.textContent = "READ";
        tile.appendChild(tempStamp);

        setTimeout(() => {
          tempStamp.remove();
          stampImprint = document.createElement("div");
          stampImprint.classList.add("read-imprint");
          stampImprint.textContent = "READ";
          tile.appendChild(stampImprint);
        }, 700);
      }
    }
  }
});
