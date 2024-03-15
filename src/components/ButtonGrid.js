import React from 'react';
import './ButtonGrid.css'; // Adjust the path as necessary


const ButtonGrid = ({ options, onSelectOption, onDeleteLast, onCheckAnswers, disabled, optionStatuses }) => {
    return (
        <div className="gridContainer">
            {options.map((option, index) => (
                <button key={index} onClick={() => onSelectOption(option)} disabled={disabled}
                        className={`button ${optionStatuses[option] || ''}`}>
                    {option}
                </button>
            ))}
            <button className='deleteButton' onClick={onDeleteLast} disabled={disabled}>Delete</button>
            <button className='enterButton' onClick={onCheckAnswers} disabled={disabled}>Enter</button>
        </div>
    );
};



export default ButtonGrid;
