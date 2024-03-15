import React from 'react';
import './AnswerGrid.css'; // Make sure this path is correct
const AnswerGrid = ({ attempts, gameOver, revealCorrect }) => {
    return (
        <div className="answerGridContainer">
            <div className="labelRow"> {/* Add this row for the numbers */}
                {[1, 2, 3, 4, 5].map(number => (
                    <div key={number} className="labelBox">{number}</div>
                ))}
            </div>
            {attempts.map((attempt, attemptIndex) => (
                <div key={attemptIndex} className="attemptRow">
                    {attempt.map((item, index) => (
                        <div key={index} className={`answerBox ${item.status} ${gameOver && (item.status === 'green' || (revealCorrect && attemptIndex === attempts.length - 1)) ? 'flash' : ''}`}>
                            {item.value}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};




export default AnswerGrid;
