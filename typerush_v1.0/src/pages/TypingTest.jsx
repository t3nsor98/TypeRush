import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../libs/firebase";
import { useAuth } from "../context/AuthContext";

// Sample text for different difficulty levels
const textOptions = {
  easy: [
    "The quick brown fox jumps over the lazy dog. Simple words are often the most powerful ones in our vocabulary.",
    "Learning to type quickly is an essential skill in today's digital world. Practice makes perfect.",
  ],
  medium: [
    "The ability to type without looking at the keyboard is called touch typing. Professional typists can reach speeds of over 100 words per minute.",
    "Developing muscle memory is crucial for typing efficiency. Your fingers should automatically know where each key is located.",
  ],
  hard: [
    "The QWERTY keyboard layout was designed in 1868 by Christopher Latham Sholes. Interestingly, it was created to slow typists down to prevent jamming on mechanical typewriters.",
    "Pneumonoultramicroscopicsilicovolcanoconiosis is one of the longest words in the English dictionary. It refers to a lung disease caused by inhaling very fine silicate or quartz dust.",
  ],
};

const TypingTest = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialDifficulty = searchParams.get("difficulty") || "medium";
  const initialDuration = parseInt(searchParams.get("duration")) || 60;

  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [duration, setDuration] = useState(initialDuration); // in seconds
  const [text, setText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [testActive, setTestActive] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isHighScore, setIsHighScore] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Get random text based on difficulty
  useEffect(() => {
    const options = textOptions[difficulty];
    const randomIndex = Math.floor(Math.random() * options.length);
    setText(options[randomIndex]);
  }, [difficulty]);

  // Timer functionality
  useEffect(() => {
    if (testActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && testActive) {
      endTest();
    }

    return () => clearTimeout(timerRef.current);
  }, [testActive, timeLeft]);

  const startTest = () => {
    setUserInput("");
    setTimeLeft(duration);
    setTestActive(true);
    setTestComplete(false);
    setStartTime(Date.now());
    inputRef.current.focus();
  };

  const endTest = async () => {
    setTestActive(false);
    setTestComplete(true);

    // Calculate WPM
    const elapsedMinutes = (Date.now() - startTime) / 60000;
    const words = userInput.trim().split(/\s+/).length;
    const calculatedWpm = Math.round(words / elapsedMinutes);
    setWpm(calculatedWpm);

    // Calculate accuracy
    const correctChars = userInput
      .split("")
      .filter((char, index) => char === text[index]).length;
    const calculatedAccuracy = Math.round(
      (correctChars / userInput.length) * 100
    );
    setAccuracy(calculatedAccuracy);

    // Save score to Firestore
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      const newScore = {
        wpm: calculatedWpm,
        accuracy: calculatedAccuracy,
        difficulty,
        duration,
        date: new Date().toISOString(),
      };

      // Check if this is a high score
      const highScore =
        userData.scores && userData.scores.length > 0
          ? Math.max(...userData.scores.map((score) => score.wpm))
          : 0;

      if (calculatedWpm > highScore) {
        setIsHighScore(true);
      }

      await updateDoc(userRef, {
        scores: arrayUnion(newScore),
      });
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const handleInputChange = (e) => {
    if (testActive) {
      setUserInput(e.target.value);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Typing Speed Test
      </h1>

      {!testActive && !testComplete && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Test Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 mb-2">Difficulty:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Duration:</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="120">2 minutes</option>
                <option value="300">5 minutes</option>
              </select>
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Test
          </button>
        </div>
      )}

      {testActive && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-2xl font-bold text-center mb-4 text-red-600">
            Time Left: {timeLeft} seconds
          </div>

          <div className="bg-gray-50 p-4 rounded-md mb-4 leading-relaxed text-lg">
            {text.split("").map((char, index) => {
              let className = "";
              if (index < userInput.length) {
                className =
                  userInput[index] === char
                    ? "text-green-600"
                    : "text-red-600 underline";
              }
              return (
                <span key={index} className={className}>
                  {char}
                </span>
              );
            })}
          </div>

          <textarea
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            placeholder="Start typing here..."
            disabled={!testActive}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
          />
        </div>
      )}

      {testComplete && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Test Results
          </h2>

          {isHighScore && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded-md animate-pulse">
              <h3 className="text-xl font-bold text-center text-yellow-800">
                🎉 New High Score! 🎉
              </h3>
              <p className="text-center text-yellow-700">
                Congratulations on your new personal best!
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <span className="block text-gray-500 text-sm">Speed</span>
              <span className="block text-3xl font-bold text-blue-600">
                {wpm} WPM
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-md text-center">
              <span className="block text-gray-500 text-sm">Accuracy</span>
              <span className="block text-3xl font-bold text-blue-600">
                {accuracy}%
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-md text-center md:col-span-1 col-span-2">
              <span className="block text-gray-500 text-sm">Difficulty</span>
              <span className="block text-xl font-bold text-blue-600 capitalize">
                {difficulty}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={startTest}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              View All Scores
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingTest;
