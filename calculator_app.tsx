import { useState } from "react";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [resetDisplay, setResetDisplay] = useState(false);

  const handleNumberClick = (number) => {
    if (display === "0" || resetDisplay) {
      setDisplay(number);
      setResetDisplay(false);
    } else {
      setDisplay(display + number);
    }
  };

  const handleOperationClick = (op) => {
    if (previousValue === null) {
      setPreviousValue(parseFloat(display));
    } else if (!resetDisplay) {
      const result = calculate();
      setPreviousValue(result);
      setDisplay(String(result));
    }
    
    setOperation(op);
    setResetDisplay(true);
  };

  const calculate = () => {
    const current = parseFloat(display);
    const previous = parseFloat(previousValue);
    
    switch (operation) {
      case "+":
        return previous + current;
      case "-":
        return previous - current;
      case "×":
        return previous * current;
      case "÷":
        return previous / current;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (previousValue === null || resetDisplay) {
      return;
    }
    
    const result = calculate();
    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setResetDisplay(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setResetDisplay(false);
  };

  const handleDecimal = () => {
    if (resetDisplay) {
      setDisplay("0.");
      setResetDisplay(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleBackspace = () => {
    if (display.length === 1 || (display.length === 2 && display.includes("-"))) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleToggleSign = () => {
    setDisplay(String(-parseFloat(display)));
  };

  const handlePercentage = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-80">
        <div className="bg-gray-700 p-4 rounded mb-4">
          <div className="text-right text-white text-3xl font-mono overflow-hidden">
            {display}
          </div>
          {operation && (
            <div className="text-right text-gray-300 text-sm">
              {previousValue} {operation}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <button 
            className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded text-xl"
            onClick={handleClear}
          >
            C
          </button>
          <button 
            className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded text-xl"
            onClick={handleBackspace}
          >
            ⌫
          </button>
          <button 
            className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded text-xl"
            onClick={handlePercentage}
          >
            %
          </button>
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded text-xl"
            onClick={() => handleOperationClick("÷")}
          >
            ÷
          </button>
          
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("7")}
          >
            7
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("8")}
          >
            8
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("9")}
          >
            9
          </button>
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded text-xl"
            onClick={() => handleOperationClick("×")}
          >
            ×
          </button>
          
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("4")}
          >
            4
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("5")}
          >
            5
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("6")}
          >
            6
          </button>
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded text-xl"
            onClick={() => handleOperationClick("-")}
          >
            -
          </button>
          
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("1")}
          >
            1
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("2")}
          >
            2
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("3")}
          >
            3
          </button>
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded text-xl"
            onClick={() => handleOperationClick("+")}
          >
            +
          </button>
          
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={handleToggleSign}
          >
            +/-
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={() => handleNumberClick("0")}
          >
            0
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-xl"
            onClick={handleDecimal}
          >
            .
          </button>
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded text-xl"
            onClick={handleEquals}
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}