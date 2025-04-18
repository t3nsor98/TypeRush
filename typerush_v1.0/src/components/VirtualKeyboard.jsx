import { useEffect, useState } from "react";

const VirtualKeyboard = ({ currentKey }) => {
  const [highlightedKey, setHighlightedKey] = useState(null);

  const keyboardLayout = [
    [
      "`",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "-",
      "=",
      "Backspace",
    ],
    ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
    ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
    ["Ctrl", "Win", "Alt", "Space", "Alt", "Menu", "Ctrl"],
  ];

  useEffect(() => {
    setHighlightedKey(currentKey?.toLowerCase());
  }, [currentKey]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-6">
      <h3 className="text-lg font-medium text-gray-700 mb-3">
        Virtual Keyboard
      </h3>
      <div className="keyboard-container">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center mb-2">
            {row.map((key, keyIndex) => {
              let width = "w-10";
              if (key === "Space") width = "w-64";
              else if (
                key === "Backspace" ||
                key === "Tab" ||
                key === "Caps" ||
                key === "Enter"
              )
                width = "w-16";
              else if (key === "Shift") width = "w-20";

              return (
                <div
                  key={keyIndex}
                  className={`${width} h-10 mx-1 flex items-center justify-center rounded border ${
                    key.toLowerCase() === highlightedKey
                      ? "bg-blue-500 text-white border-blue-600"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  } text-sm font-medium`}
                >
                  {key}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
