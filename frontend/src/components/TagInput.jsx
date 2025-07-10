import { useState } from 'react';
import { X, Plus, Hash } from 'lucide-react';

const TagInput = ({ 
  label, 
  value = [], 
  onChange, 
  placeholder, 
  maxTags = 10,
  type = 'interests' // 'interests' oder 'hobbies'
}) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Bei Komma oder Enter automatisch hinzufügen
    if (e.target.value.includes(',')) {
      const newTags = e.target.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !value.includes(tag));
      
      if (newTags.length > 0) {
        onChange([...value, ...newTags].slice(0, maxTags));
        setInputValue('');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    }
    
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Letztes Tag entfernen bei Backspace auf leerem Input
      onChange(value.slice(0, -1));
    }
  };

  const addTag = (tag) => {
    if (tag && !value.includes(tag) && value.length < maxTags) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const colorScheme = type === 'interests' 
    ? { bg: 'bg-blue-50', tag: 'bg-blue-100 text-blue-600', border: 'focus:ring-blue-500 focus:border-blue-500' }
    : { bg: 'bg-purple-50', tag: 'bg-purple-100 text-purple-600', border: 'focus:ring-purple-500 focus:border-purple-500' };

  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-2">
        {label}
      </label>
      
      {/* Tags Container */}
      <div className={`min-h-[100px] p-3 bg-card border border-secondary rounded-lg ${colorScheme.bg}`}>
        {/* Current Tags */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {value.map((tag, index) => (
              <span
                key={index}
                className={`inline-flex items-center space-x-2 ${colorScheme.tag} px-3 py-1 rounded-full text-sm transition-all hover:scale-105`}
              >
                {type === 'hobbies' && <Hash size={12} />}
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-current opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Input Field */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={`flex-1 px-3 py-2 border-0 bg-transparent focus:outline-none focus:ring-0 ${colorScheme.border}`}
            placeholder={value.length === 0 
              ? placeholder 
              : `Weitere ${type === 'interests' ? 'Interessen' : 'Hobbys'} hinzufügen...`
            }
            disabled={value.length >= maxTags}
          />
          
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => addTag(inputValue.trim())}
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        
        {/* Help Text */}
        <div className="flex justify-between items-center mt-2 text-sm text-tertiary">
          <span>
            {value.length === 0 
              ? 'Tippe und drücke Enter oder verwende Kommas um mehrere hinzuzufügen'
              : `${value.length}/${maxTags} ${type === 'interests' ? 'Interessen' : 'Hobbys'}`
            }
          </span>
          
          {value.length >= maxTags && (
            <span className="text-orange-500">Maximum erreicht</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagInput;