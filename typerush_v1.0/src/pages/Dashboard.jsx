import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { currentUser, userDetails } = useAuth();
  const [recentScores, setRecentScores] = useState([]);
  const [highScore, setHighScore] = useState(0);
  const [averageWpm, setAverageWpm] = useState(0);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          if (userData.scores && userData.scores.length > 0) {
            // Sort scores by date (newest first)
            const sortedScores = [...userData.scores].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            );

            // Get recent scores (last 5)
            setRecentScores(sortedScores.slice(0, 5));

            // Calculate high score
            const highestWpm = Math.max(
              ...sortedScores.map((score) => score.wpm)
            );
            setHighScore(highestWpm);

            // Calculate average WPM
            const totalWpm = sortedScores.reduce(
              (sum, score) => sum + score.wpm,
              0
            );
            setAverageWpm(Math.round(totalWpm / sortedScores.length));

            // Prepare chart data (last 10 scores in chronological order)
            const last10Scores = sortedScores.slice(0, 10).reverse();
            setChartData({
              labels: last10Scores.map((_, index) => `Test ${index + 1}`),
              datasets: [
                {
                  label: "WPM",
                  data: last10Scores.map((score) => score.wpm),
                  borderColor: "rgb(59, 130, 246)",
                  backgroundColor: "rgba(59, 130, 246, 0.5)",
                },
              ],
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Welcome, {userDetails?.name || currentUser.displayName}!
        </h1>
        <div className="flex items-center">
          {currentUser.photoURL && (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              className="w-10 h-10 rounded-full mr-3"
            />
          )}
          <Link
            to="/profile"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Profile
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-medium text-gray-500 mb-2">High Score</h3>
          <p className="text-3xl font-bold text-blue-600">{highScore} WPM</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            Average Speed
          </h3>
          <p className="text-3xl font-bold text-blue-600">{averageWpm} WPM</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            Tests Completed
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {recentScores.length}
          </p>
        </div>
      </div>

      {chartData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Your Recent Performance
          </h2>
          <div className="h-64">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "WPM Over Time",
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Start a New Test
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/test?difficulty=easy&duration=30"
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-center transition-colors"
          >
            <h3 className="text-lg font-medium text-blue-800 mb-1">
              Quick Test
            </h3>
            <p className="text-blue-600">Easy • 30 seconds</p>
          </Link>

          <Link
            to="/test?difficulty=medium&duration=60"
            className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-center transition-colors"
          >
            <h3 className="text-lg font-medium text-green-800 mb-1">
              Standard Test
            </h3>
            <p className="text-green-600">Medium • 1 minute</p>
          </Link>

          <Link
            to="/test?difficulty=hard&duration=120"
            className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-center transition-colors"
          >
            <h3 className="text-lg font-medium text-red-800 mb-1">Challenge</h3>
            <p className="text-red-600">Hard • 2 minutes</p>
          </Link>

          <Link
            to="/test"
            className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-center transition-colors"
          >
            <h3 className="text-lg font-medium text-purple-800 mb-1">
              Custom Test
            </h3>
            <p className="text-purple-600">Choose your settings</p>
          </Link>
        </div>
      </div>

      {recentScores.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Recent Scores
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WPM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentScores.map((score, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(score.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {score.wpm}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {score.accuracy}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {score.difficulty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {score.duration}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
