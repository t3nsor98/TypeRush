import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../libs/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [scores, setScores] = useState([]);
  const [wpmChartData, setWpmChartData] = useState(null);
  const [accuracyChartData, setAccuracyChartData] = useState(null);
  const [difficultyDistribution, setDifficultyDistribution] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);

          if (data.scores && data.scores.length > 0) {
            // Sort scores by date (newest first)
            const sortedScores = [...data.scores].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            );
            setScores(sortedScores);

            // Prepare WPM chart data (chronological order)
            const last20Scores = sortedScores.slice(0, 20).reverse();
            setWpmChartData({
              labels: last20Scores.map((_, index) => `Test ${index + 1}`),
              datasets: [
                {
                  label: "WPM",
                  data: last20Scores.map((score) => score.wpm),
                  borderColor: "rgb(59, 130, 246)",
                  backgroundColor: "rgba(59, 130, 246, 0.5)",
                },
              ],
            });

            // Prepare accuracy chart data
            setAccuracyChartData({
              labels: last20Scores.map((_, index) => `Test ${index + 1}`),
              datasets: [
                {
                  label: "Accuracy (%)",
                  data: last20Scores.map((score) => score.accuracy),
                  borderColor: "rgb(220, 38, 38)",
                  backgroundColor: "rgba(220, 38, 38, 0.5)",
                },
              ],
            });

            // Prepare difficulty distribution
            const difficultyCount = {
              easy: sortedScores.filter((score) => score.difficulty === "easy")
                .length,
              medium: sortedScores.filter(
                (score) => score.difficulty === "medium"
              ).length,
              hard: sortedScores.filter((score) => score.difficulty === "hard")
                .length,
            };

            setDifficultyDistribution({
              labels: ["Easy", "Medium", "Hard"],
              datasets: [
                {
                  label: "Tests by Difficulty",
                  data: [
                    difficultyCount.easy,
                    difficultyCount.medium,
                    difficultyCount.hard,
                  ],
                  backgroundColor: [
                    "rgba(59, 130, 246, 0.5)",
                    "rgba(16, 185, 129, 0.5)",
                    "rgba(220, 38, 38, 0.5)",
                  ],
                  borderColor: [
                    "rgb(59, 130, 246)",
                    "rgb(16, 185, 129)",
                    "rgb(220, 38, 38)",
                  ],
                  borderWidth: 1,
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading profile data...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          {currentUser.photoURL && (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              className="w-16 h-16 rounded-full mr-4"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {userData.name}
            </h1>
            <p className="text-gray-600">{userData.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/test")}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            New Test
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            Tests Completed
          </h3>
          <p className="text-3xl font-bold text-blue-600">{scores.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-medium text-gray-500 mb-2">High Score</h3>
          <p className="text-3xl font-bold text-blue-600">
            {scores.length > 0
              ? Math.max(...scores.map((score) => score.wpm))
              : 0}{" "}
            WPM
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            Average Speed
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {scores.length > 0
              ? Math.round(
                  scores.reduce((sum, score) => sum + score.wpm, 0) /
                    scores.length
                )
              : 0}{" "}
            WPM
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            Average Accuracy
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {scores.length > 0
              ? Math.round(
                  scores.reduce((sum, score) => sum + score.accuracy, 0) /
                    scores.length
                )
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {wpmChartData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              WPM Progress
            </h2>
            <div className="h-64">
              <Line
                data={wpmChartData}
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

        {accuracyChartData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Accuracy Progress
            </h2>
            <div className="h-64">
              <Line
                data={accuracyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                    },
                    title: {
                      display: true,
                      text: "Accuracy Over Time",
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      {difficultyDistribution && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Tests by Difficulty
          </h2>
          <div className="h-64">
            <Bar
              data={difficultyDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "Test Distribution by Difficulty",
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          All Test Results
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
              {scores.map((score, index) => (
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
    </div>
  );
};

export default Profile;
