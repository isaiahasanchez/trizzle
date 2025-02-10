import React from 'react';
import './CategorySelector.css'; // We'll add some basic styling in a moment

const CategorySelector = ({
  allCategories = [],
  selectedCategories = [],
  onToggleCategory,
  onClose
}) => {
  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <h2>Select Categories</h2>
        <div className="checkboxContainer">
          {allCategories.map((cat) => {
            const isChecked = selectedCategories.includes(cat);
            return (
              <label key={cat} className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleCategory(cat)}
                />
                {" "}
                {cat}
              </label>
            );
          })}
        </div>
        <button onClick={onClose} className="closeButton">
          Close
        </button>
      </div>
    </div>
  );
};

export default CategorySelector;
