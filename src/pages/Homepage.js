import { useEffect, useState } from "react";
import ButtonGrid from "../components/ButtonGrid";
import AnswerGrid from "../components/AnswerGrid";
import CategorySelector from "../components/CategorySelector"; // <-- new component
import "./Homepage.css"; // existing stylesheet

const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

const processQuestion = (question) => {
  // Detect position where numbering starts (assuming "1)" is the start).
  const splitPosition = question.indexOf("1)");
  if (splitPosition <= 0) {
    return [question];
  }
  const intro = question.substring(0, splitPosition).trim();
  const items = question.substring(splitPosition);
  const splitItems = items
    .split(/\s*(?=\d\))/)
    .map((item) => item.trim())
    .filter(Boolean);
  return [intro, ...splitItems];
};

const Homepage = () => {
  // -- Data states
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // -- Category filtering states
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // -- Question detail states
  const [processedQuestion, setProcessedQuestion] = useState([]);
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState([]);

  // -- Game states
  const [displayResult, setDisplayResult] = useState("");
  const [attempts, setAttempts] = useState(
    Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => ({ value: "", status: "" }))
    )
  );
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [optionStatuses, setOptionStatuses] = useState({});
  const [revealFinalAnswer, setRevealFinalAnswer] = useState(false);

  // ---------------------------------------------------------------------------
  // 1) FETCH ENTIRE QUESTIONS LIST
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/isaiahasanchez/trizzle-db/main/db.json")
      .then((res) => res.json())
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setAllQuestions(data.questions);

          // Also build a unique list of categories
          const categoriesSet = new Set();
          data.questions.forEach((q) => {
            if (q.categories && Array.isArray(q.categories)) {
              q.categories.forEach((cat) => categoriesSet.add(cat));
            }
          });
          // Convert Set -> Array
          const uniqueCategories = Array.from(categoriesSet);
          setAllCategories(uniqueCategories);

          // For now, assume no filter => all questions
          setFilteredQuestions(data.questions);
        }
      })
      .catch((err) => console.error("Error fetching questions:", err));
  }, []);

  // ---------------------------------------------------------------------------
  // 2) WHENEVER FILTERS CHANGE => UPDATE filteredQuestions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (selectedCategories.length === 0) {
      // No categories chosen => show all
      setFilteredQuestions(allQuestions);
      setCurrentQuestionIndex(0);
    } else {
      // Filter only questions that have at least one matching category
      const subset = allQuestions.filter((q) =>
        q.categories?.some((cat) => selectedCategories.includes(cat))
      );
      setFilteredQuestions(subset);
      setCurrentQuestionIndex(0);
    }
  }, [selectedCategories, allQuestions]);

  // ---------------------------------------------------------------------------
  // 3) LOAD CURRENT QUESTION (whenever filteredQuestions or currentQuestionIndex changes)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (filteredQuestions.length > 0) {
      const questionObj = filteredQuestions[currentQuestionIndex];
      loadQuestion(questionObj);
    } else {
      // If no questions available in filtered set, clear the UI
      setProcessedQuestion([]);
      setOptions([]);
      setCorrectAnswer([]);
      setDisplayResult("No questions for the selected categories.");
    }
  }, [filteredQuestions, currentQuestionIndex]);

  const loadQuestion = (questionObj) => {
    // Process text
    const processed = processQuestion(questionObj.text);
    setProcessedQuestion(processed);

    // Shuffle or not:
    const shuffledOptions = shuffleArray([...questionObj.options]);
    setOptions(shuffledOptions);

    // Prepare correct answer
    setCorrectAnswer(questionObj.answer.map((ans) => ({ value: ans, status: "" })));

    // Reset game states for each new question
    setAttempts(
      Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () => ({ value: "", status: "" }))
      )
    );
    setCurrentAttemptIndex(0);
    setGameOver(false);
    setHistory([]);
    setOptionStatuses({});
    setRevealFinalAnswer(false);
    setDisplayResult("");
  };

  // ---------------------------------------------------------------------------
  // 4) NEXT QUESTION
  // ---------------------------------------------------------------------------
  const handleNextQuestion = () => {
    if (filteredQuestions.length === 0) {
      // nothing to do
      return;
    }
    setCurrentQuestionIndex((prevIndex) =>
      (prevIndex + 1) % filteredQuestions.length
    );
  };

  // ---------------------------------------------------------------------------
  // CATEGORY MODAL / CHECKBOX LOGIC
  // ---------------------------------------------------------------------------
  const handleToggleCategory = (cat) => {
    // If cat is in selectedCategories, remove it; else add it
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // ---------------------------------------------------------------------------
  // REMAINING GAME LOGIC (your original code with minimal changes)
  // ---------------------------------------------------------------------------
  const handleSelectOption = (option) => {
    if (!gameOver) {
      const currentAttempt = attempts[currentAttemptIndex];
      const filledGuesses = currentAttempt.filter((guess) => guess.value !== "");

      // check for duplicates
      if (filledGuesses.find((guess) => guess.value === option)) {
        setDisplayResult(
          "You have already selected this guess in the current attempt."
        );
        return;
      }

      // if not full, add new guess
      if (filledGuesses.length < 5) {
        const newAttempts = attempts.map((attempt) =>
          attempt.map((guess) => ({ ...guess }))
        );
        const optionIndex = newAttempts[currentAttemptIndex].findIndex(
          (guess) => guess.value === ""
        );
        if (optionIndex !== -1) {
          newAttempts[currentAttemptIndex][optionIndex] = {
            value: option,
            status: "",
          };
          setAttempts(newAttempts);
          setDisplayResult("");
        }
      } else {
        setDisplayResult(
          "Current attempt is full. Submit your guess or delete a guess to change it."
        );
      }
    }
  };

  const handleDeleteLast = () => {
    if (!gameOver) {
      const newAttempts = attempts.map((attempt) =>
        attempt.map((guess) => ({ ...guess }))
      );
      const currentAttempt = newAttempts[currentAttemptIndex];
      for (let i = currentAttempt.length - 1; i >= 0; i--) {
        if (currentAttempt[i].value !== "") {
          currentAttempt[i] = { value: "", status: "" };
          break;
        }
      }
      setAttempts(newAttempts);
    }
  };

  const handleCheckAnswers = () => {
    const currentAttempt = attempts[currentAttemptIndex];
    const guessString = currentAttempt.map((guess) => guess.value).join("");

    if (currentAttempt.filter((guess) => guess.value !== "").length === 5) {
      if (history.includes(guessString)) {
        setDisplayResult("You already used that guess.");
        return;
      }

      setHistory([...history, guessString]);

      const evaluation = currentAttempt.map((guess, index) => {
        if (guess.value === correctAnswer[index].value) {
          return { ...guess, status: "green" };
        } else if (
          correctAnswer.some((answer) => answer.value === guess.value)
        ) {
          return { ...guess, status: "yellow" };
        } else {
          return { ...guess, status: "gray" };
        }
      });

      const newOptionStatuses = { ...optionStatuses };
      evaluation.forEach((guess) => {
        const existingStatus = newOptionStatuses[guess.value];
        if (
          !existingStatus ||
          guess.status === "green" ||
          (guess.status === "yellow" && existingStatus !== "green")
        ) {
          newOptionStatuses[guess.value] = guess.status;
        }
      });
      setOptionStatuses(newOptionStatuses);

      // update attempts
      attempts[currentAttemptIndex] = evaluation;
      setAttempts([...attempts]);

      // check if correct
      if (evaluation.every((guess) => guess.status === "green")) {
        setDisplayResult("Correct sequence!");
        setGameOver(true);
      } else if (currentAttemptIndex === 4) {
        // out of attempts
        setTimeout(() => {
          const correctAttempt = correctAnswer.map((answer) => ({
            value: answer.value,
            status: "green",
          }));
          setAttempts([...attempts, correctAttempt]);
          setRevealFinalAnswer(true);
          setDisplayResult("Game over. The correct sequence was:");
        }, 3000);
        setGameOver(true);
      } else {
        setCurrentAttemptIndex(currentAttemptIndex + 1);
        setDisplayResult("Incorrect sequence, try again.");
      }
    } else {
      setDisplayResult("Each guess must be exactly 5 answers long.");
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="App">
      <h1 className="trizzle">Trizzle</h1>
  
      {/* Container that holds QUESTION (left 2/3) and FILTER BUTTONS (right 1/3) */}
      <div className="questionFilterContainer">
        {/* Left side: Question Text */}
        <div className="questionContent">
          {processedQuestion.length > 0 && (
            <div>
              {processedQuestion.map((line, index) => (
                <div key={index} className="question">
                  {line}
                </div>
              ))}
            </div>
          )}
          <section className={gameOver ? "flash" : ""}>{displayResult}</section>
        </div>
  
        {/* Right side: Filter & Next Buttons */}
        <div className="filterButtonsContainer">
          <button
            className="filterButton"
            onClick={() => setShowCategoryModal(true)}
          >
            Filter by Categories
          </button>
          <button className="filterButton" onClick={handleNextQuestion}>
            Next Question
          </button>
        </div>
      </div>
  
      {showCategoryModal && (
        <CategorySelector
          allCategories={allCategories}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
  
      <div className="contentWrapper">
        <div className="answerGridContainerAnswerContainer">
          <AnswerGrid attempts={attempts} fadeIn={revealFinalAnswer} />
        </div>
  
        <div className="buttonGridContainer">
          <ButtonGrid
            options={options}
            onSelectOption={handleSelectOption}
            onDeleteLast={handleDeleteLast}
            onCheckAnswers={handleCheckAnswers}
            disabled={gameOver}
            optionStatuses={optionStatuses}
          />
        </div>
      </div>
  
      <div>___________________________________________________</div>
      <div>
        Trizzle is an engaging trivia and puzzle game that challenges your
        knowledge and problem-solving skills! Here's how to play:
      </div>
      <div>.</div>
      <div>
        Start the Game: Each round presents you with a unique trivia question,
        ranging from general knowledge, match-the-following, to ranking
        questions and more.
      </div>
      <div>.</div>
      <div>
        Answer the Question: For standard trivia, select your answer from the
        options provided. For match-the-following or ranking questions, arrange
        your answers in the correct order. Use the on-screen buttons to input
        your choices. You have five attempts to get the right answer!
      </div>
      <div>.</div>
      <div>
        Submit Your Guess: Once you're confident with your answer, hit the
        "Submit" button to check your accuracy. The game will provide immediate
        feedback. Correct answers are highlighted in green, partially correct
        answers in yellow, and incorrect answers in gray.
      </div>
      <div>.</div>
      <div>
        Learn and Improve: If your first attempt isn't completely correct, use
        the feedback to adjust your answers. The goal is to find the correct
        sequence or answer before you run out of attempts.
      </div>
      <div>.</div>
      <div>
        Advance Through Questions: Successfully solving a question takes you to
        the next challenge, offering endless fun and learning. If you're stuck,
        don't worry! The "Next Question" button lets you move forward anytime.
      </div>
      <div>.</div>
      <div>
        Enjoy and Expand Your Knowledge: Trizzle is designed to be both
        entertaining and educational. Whether you're testing your general
        knowledge or learning new facts, there's always something new to
        discover.
      </div>
    </div>
  );
  
};

export default Homepage;
