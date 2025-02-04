import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, signup, logout, user } = useAuth();
  const { darkMode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      } py-12 px-4 sm:px-6 lg:px-8`}>
      <div
        className={`max-w-md w-full space-y-8 ${
          darkMode ? "bg-gray-800" : "bg-white"
        } p-8 rounded-lg shadow-xl`}>
        <div>
          <h2
            className={`mt-6 text-center text-3xl font-extrabold ${
              darkMode ? "text-gray-200" : "text-gray-900"
            }`}>
            {isLogin ? "Sign in to your account" : "Create new account"}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400"
                    : "border-gray-300 placeholder-gray-500 text-gray-900"
                } rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400"
                    : "border-gray-300 placeholder-gray-500 text-gray-900"
                } rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div
              className={`text-red-500 text-sm text-center ${
                darkMode ? "bg-red-900" : "bg-red-50"
              } p-2 rounded-md`}>
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {isLogin ? "Sign in" : "Sign up"}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            className={`${
              darkMode
                ? "text-indigo-400 hover:text-indigo-300"
                : "text-indigo-600 hover:text-indigo-500"
            }`}
            onClick={() => setIsLogin(!isLogin)}>
            {isLogin
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
