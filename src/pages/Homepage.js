import { useEffect, useState } from "react";
import ButtonGrid from "../components/ButtonGrid";
import AnswerGrid from "../components/AnswerGrid";
import "./Homepage.css"; // Ensure you have homepage.css in the correct path


const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }

const processQuestion = (question) => {
  // Detect the position where numbering starts, assuming "1)" is the start.
  const splitPosition = question.indexOf("1)");
  
  // If "1)" is not found or at the very start, return the question as is
  if (splitPosition <= 0) {
    return [question];
  }

  // Separate the introductory text from the rest
  const intro = question.substring(0, splitPosition).trim();
  const items = question.substring(splitPosition);

  // Split the items part into individual questions
  const splitItems = items.split(/\s*(?=\d\))/).map(item => item.trim()).filter(Boolean);

  // Combine the intro with the split, numbered items
  return [intro, ...splitItems];
};

  
  
  
const Homepage = () => {

    const [processedQuestion, setProcessedQuestion] = useState([]); // To store processed questions
    const [options, setOptions] = useState([]);
    // Correct answer expected to be an array of values
    const [correctAnswer, setCorrectAnswer] = useState([]);
    const [displayResult, setDisplayResult] = useState('');
    // Attempts now include status along with the value
    const [attempts, setAttempts] = useState(Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ({ value: '', status: '' }))));
    const [currentAttemptIndex, setCurrentAttemptIndex] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    // Add history state to track submitted guesses
    const [history, setHistory] = useState([]);
    const [optionStatuses, setOptionStatuses] = useState({});
    const [revealFinalAnswer, setRevealFinalAnswer] = useState(false);



    useEffect(() => {
        fetch('https://raw.githubusercontent.com/isaiahasanchez/trizzle-db/main/db.json')
            .then(res => res.json())
            .then(json => {
                if (json.questions && json.questions.length > 0) {
                    // Randomly select a question
                    const randomIndex = Math.floor(Math.random() * json.questions.length);
                    const randomQuestion = json.questions[randomIndex];
    

                    const processed = processQuestion(randomQuestion.text);
                    setProcessedQuestion(processed);
                    // Optionally shuffle options
                    const shuffledOptions = shuffleArray([...randomQuestion.options]);
                    setOptions(shuffledOptions);
                    setCorrectAnswer(randomQuestion.answer.map(answer => ({ value: answer, status: '' })));
                    // Reset the game state for a new game
                    setAttempts(Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ({ value: '', status: '' }))));
                    setCurrentAttemptIndex(0);
                    setGameOver(false);
                    setHistory([]);
                    setOptionStatuses({});
                }
            });
    }, []); // Dependency array is empty, meaning this effect runs once when the component mounts.
    

    

    const handleSelectOption = (option) => {
        if (!gameOver) {
            const currentAttempt = attempts[currentAttemptIndex];
            const filledGuesses = currentAttempt.filter(guess => guess.value !== '');
    
            // Check if the current attempt already contains the selected option
            if (filledGuesses.find(guess => guess.value === option)) {
                setDisplayResult('You have already selected this guess in the current attempt.');
                return; // Prevent adding the guess if it's already in the current attempt
            }
    
            // Ensure the attempt is not full before adding the new guess
            if (filledGuesses.length < 5) {
                // Deep copy to avoid direct state mutation
                const newAttempts = attempts.map(attempt => attempt.map(guess => ({ ...guess })));
                const optionIndex = newAttempts[currentAttemptIndex].findIndex(guess => guess.value === '');
    
                if (optionIndex !== -1) {
                    newAttempts[currentAttemptIndex][optionIndex] = { value: option, status: '' };
                    setAttempts(newAttempts);
                    setDisplayResult(''); // Reset display message
                }
            } else {
                // Optional: Provide feedback if the attempt is full and user tries to add more guesses
                setDisplayResult('Current attempt is full. Submit your guess or delete a guess to change it.');
            }
        }
    };
    

    const handleDeleteLast = () => {
        if (!gameOver) {
            // Deep copy to avoid direct state mutation
            const newAttempts = attempts.map(attempt => attempt.map(guess => ({ ...guess })));
            
            // Get the current attempt
            const currentAttempt = newAttempts[currentAttemptIndex];
            
            // Find the last filled guess in the current attempt
            for (let i = currentAttempt.length - 1; i >= 0; i--) {
                if (currentAttempt[i].value !== '') {
                    // Reset the last filled guess
                    currentAttempt[i] = { value: '', status: '' };
                    break; // Exit after finding and resetting the last filled guess
                }
            }
            
            // Update state with the new attempts array
            setAttempts(newAttempts);
        }
    };
    

    const handleCheckAnswers = () => {
        const currentAttempt = attempts[currentAttemptIndex];
        const guessString = currentAttempt.map(guess => guess.value).join('');
    
        if (currentAttempt.filter(guess => guess.value !== '').length === 5) {
            if (history.includes(guessString)) {
                setDisplayResult('You already used that guess.');
                return;
            }
    
            setHistory([...history, guessString]);
    
            const evaluation = currentAttempt.map((guess, index) => {
                if (guess.value === correctAnswer[index].value) {
                    return { ...guess, status: 'green' };
                } else if (correctAnswer.some(answer => answer.value === guess.value)) {
                    return { ...guess, status: 'yellow' };
                } else {
                    return { ...guess, status: 'gray' };
                }
            });
    
            const newOptionStatuses = { ...optionStatuses };
            evaluation.forEach(guess => {
                if (!newOptionStatuses[guess.value] || guess.status === 'green' || (guess.status === 'yellow' && newOptionStatuses[guess.value] !== 'green')) {
                    newOptionStatuses[guess.value] = guess.status;
                }
            });
            setOptionStatuses(newOptionStatuses);
    
            attempts[currentAttemptIndex] = evaluation;
            setAttempts([...attempts]);
    
            if (evaluation.every(guess => guess.status === 'green')) {
                setDisplayResult('Correct sequence!');
                setGameOver(true);
                // Apply flash animation class to signal game over successfully
            } else if (currentAttemptIndex === 4) {
                setTimeout(() => {
                    const correctAttempt = correctAnswer.map(answer => ({ value: answer.value, status: 'green' }));
                    setAttempts([...attempts, correctAttempt]);
                    setRevealFinalAnswer(true); // Trigger the reveal with fade-in after delay
                    setDisplayResult('Game over. The correct sequence was:');
                }, 3000); // 3-second delay
                setGameOver(true);
            } else {
                setCurrentAttemptIndex(currentAttemptIndex + 1);
                setDisplayResult('Incorrect sequence, try again.');
            }
        } else {
            setDisplayResult('Each guess must be exactly 5 answers long.');
        }
    };
    

    return (
        <div className="App">
            <h1>Trizzle</h1>
            <div className="questionContainer">
                {processedQuestion.length > 0 && (
                    <div className="question">
                        {processedQuestion.map((line, index) => (
                            <div key={index}>{line}</div>
                        ))}
                    </div>
                )}
                <section style={{margin: "15px"}} className={gameOver ? "flash" : ""}>{displayResult}</section>
            </div>
            <div className="contentWrapper">
                <div className="questionAndAnswerContainer">
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
            <div>
                ___________________________________________________
            </div>
            <div>Trizzle is an engaging trivia and puzzle game that challenges your knowledge and problem-solving skills! Here's how to play:</div>
            <div>
                .
            </div>
            <div>
Start the Game: Each round presents you with a unique trivia question, ranging from general knowledge, match-the-following, to ranking questions and more.  
            </div>
            <div>
                .
            </div>
            <div>
            Answer the Question: For standard trivia, select your answer from the options provided. For match-the-following or ranking questions, arrange your answers in the correct order. Use the on-screen buttons to input your choices. You have five attempts to get the right answer!
            </div>
            <div>
                .
            </div>
            <div>

            Submit Your Guess: Once you're confident with your answer, hit the "Submit" button to check your accuracy. The game will provide immediate feedback. Correct answers are highlighted in green, partially correct answers in yellow, and incorrect answers in gray.
            </div>
            <div>
                .
            </div>
            <div>
            Learn and Improve: If your first attempt isn't completely correct, use the feedback to adjust your answers. The goal is to find the correct sequence or answer before you run out of attempts.

            </div>
            <div>
                .
            </div>
            <div>
            Advance Through Questions: Successfully solving a question takes you to the next challenge, offering endless fun and learning. If you're stuck, don't worry! The "Next Question" button lets you move forward anytime.
            </div>

            <div>
                .
            </div>
            <div>

Enjoy and Expand Your Knowledge: Trizzle is designed to be both entertaining and educational. Whether you're testing your general knowledge or learning new facts, there's always something new to discover. 
            </div>
        </div>
    );
    
    
};

export default Homepage;
