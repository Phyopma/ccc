import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const LoanModal = ({ isOpen, onClose, darkMode }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    age: "",
    credit_score: "",
    term: "",
    loan_amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/loan/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            user_id: user._id,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult({ success: true, data });
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setFormData({
      age: "",
      credit_score: "",
      term: "",
      loan_amount: "",
    });
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] ${
        !isOpen ? "hidden" : ""
      }`}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } w-full max-w-md p-6 rounded-lg shadow-xl relative`}>
        <div className="flex justify-between items-center mb-4">
          <h2
            className={`text-xl font-bold ${
              darkMode ? "text-gray-200" : "text-gray-900"
            }`}>
            Loan Application
          </h2>
          <button
            onClick={handleClose}
            className={`text-2xl ${
              darkMode
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-600 hover:text-gray-700"
            }`}>
            ×
          </button>
        </div>

        <AnimatePresence>
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg mb-4 ${
                result.data?.approved ? "bg-green-100" : "bg-red-100"
              }`}>
              {result.data?.approved ? (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl mb-2">
                    🎉
                  </motion.div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Congratulations!
                  </h3>
                  <p className="text-green-700 mb-2">
                    Your loan has been approved!
                  </p>
                  <div className="text-sm text-green-600">
                    <p>APR Rate: {result.data.apr_rate.toFixed(2)}%</p>
                    <p>
                      Annual Income: $
                      {result.data.annual_income.toLocaleString()}
                    </p>
                    <p>
                      DTI Ratio: {(result.data.dti_ratio * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl mb-2">
                    😔
                  </motion.div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    We're Sorry
                  </h3>
                  <p className="text-red-700">
                    {result.error ||
                      "Your loan application was not approved at this time."}
                  </p>
                </div>
              )}
              <button
                onClick={handleClose}
                className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Close
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="18"
                  max="100"
                  className={`w-full p-2 rounded-md border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                  Credit Score
                </label>
                <input
                  type="number"
                  name="credit_score"
                  value={formData.credit_score}
                  onChange={handleChange}
                  required
                  min="300"
                  max="850"
                  className={`w-full p-2 rounded-md border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                  Loan Term (months)
                </label>
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  required
                  className={`w-full p-2 rounded-md border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}>
                  <option value="">Select term</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                  <option value="48">48 months</option>
                  <option value="60">60 months</option>
                </select>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                  Loan Amount ($)
                </label>
                <input
                  type="number"
                  name="loan_amount"
                  value={formData.loan_amount}
                  onChange={handleChange}
                  required
                  min="1000"
                  max="1000000"
                  className={`w-full p-2 rounded-md border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 relative`}>
                {loading ? (
                  <>
                    <span className="opacity-0">Apply for Loan</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                ) : (
                  "Apply for Loan"
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoanModal;
