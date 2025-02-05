import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LoanModal from "./LoanModal";

const Dashboard = ({ setShowDashboard }) => {
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("monthly");
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalSpending, setTotalSpending] = useState(0);
  const [financeFeatures, setFinanceFeatures] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [availablePeriods, setAvailablePeriods] = useState({
    months: [],
    years: [],
  });

  // Add getFeaturesByPeriod function
  const getFeaturesByPeriod = () => {
    if (!financeFeatures.length) {
      return {
        dti_ratio: 0,
        savings_rate: 0,
        credit_utilization: 0,
        total_loan_payment: 0,
        num_loans_paid: 0,
        avg_transaction_amount: 0,
      };
    }

    if (selectedPeriod === "all") {
      // Calculate averages across all periods
      const averages = financeFeatures.reduce((acc, feature) => {
        Object.keys(feature).forEach((key) => {
          if (key !== "month") {
            acc[key] = (acc[key] || 0) + feature[key];
          }
        });
        return acc;
      }, {});

      Object.keys(averages).forEach((key) => {
        if (key !== "month") {
          averages[key] /= financeFeatures.length;
        }
      });

      return averages;
    }

    if (selectedPeriod === "monthly" && selectedMonth) {
      // Find features for selected month
      return (
        financeFeatures.find((f) => f.month === selectedMonth) ||
        getFeaturesByPeriod()
      );
    }

    if (selectedPeriod === "yearly" && selectedYear) {
      // Calculate averages for selected year
      const yearFeatures = financeFeatures.filter((f) =>
        f.month.startsWith(selectedYear)
      );
      if (!yearFeatures.length) return getFeaturesByPeriod();

      const yearAverages = yearFeatures.reduce((acc, feature) => {
        Object.keys(feature).forEach((key) => {
          if (key !== "month") {
            acc[key] = (acc[key] || 0) + feature[key];
          }
        });
        return acc;
      }, {});

      Object.keys(yearAverages).forEach((key) => {
        if (key !== "month") {
          yearAverages[key] /= yearFeatures.length;
        }
      });

      return yearAverages;
    }

    // Default to latest period if no selection
    return financeFeatures[financeFeatures.length - 1] || getFeaturesByPeriod();
  };

  // Update useEffect to include available periods calculation
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/transactions?user_id=${
            user._id
          }`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }
        const data = await response.json();
        setTransactions(data.transactions);
        setFinanceFeatures(data.finance_features || []);

        // Calculate available periods
        if (data.finance_features?.length > 0) {
          const months = [
            ...new Set(data.finance_features.map((f) => f.month)),
          ];
          const years = [...new Set(months.map((m) => m.substring(0, 4)))];
          setAvailablePeriods({ months, years });
        }

        // Calculate date range
        if (data.transactions.length > 0) {
          const dates = data.transactions.map((t) => new Date(t.date));
          const startDate = new Date(Math.min(...dates));
          const endDate = new Date(Math.max(...dates));
          setDateRange({ start: startDate, end: endDate });
        }

        // Calculate totals
        const income = data.transactions
          .filter((t) => t.prefix === 1)
          .reduce((sum, t) => sum + t.prefix * t.amount, 0);
        const spending = data.transactions
          .filter((t) => t.prefix === -1)
          .reduce((sum, t) => sum + t.prefix * t.amount, 0);

        setTotalIncome(income);
        setTotalSpending(spending);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user._id]);

  const processDataForChart = () => {
    if (!transactions.length) return [];

    const groupedData = transactions.reduce((acc, transaction) => {
      let dateKey;
      const date = new Date(transaction.date);

      switch (timeframe) {
        case "weekly":
          dateKey = format(date, "yyyy-'W'ww");
          break;
        case "monthly":
          dateKey = format(date, "yyyy-MM");
          break;
        case "yearly":
          dateKey = format(date, "yyyy");
          break;
        default:
          dateKey = format(date, "yyyy-MM");
      }

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, income: 0, spending: 0 };
      }

      if (transaction.prefix === 1) {
        acc[dateKey].income += transaction.amount;
      } else {
        acc[dateKey].spending += transaction.amount;
      }

      return acc;
    }, {});

    return Object.values(groupedData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  const chartData = processDataForChart();

  const periodFeatures = getFeaturesByPeriod();

  // Update the JSX where metrics are displayed
  return (
    <div className="space-y-6">
      {isLoanModalOpen && (
        <LoanModal
          isOpen={isLoanModalOpen}
          onClose={() => setIsLoanModalOpen(false)}
          darkMode={darkMode}
        />
      )}
      <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow`}>
        <div
          className={`px-6 py-4 flex justify-between items-center border-b ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}>
          <div>
            <h1
              className={`text-2xl font-bold ${
                darkMode ? "text-gray-200" : "text-gray-900"
              }`}>
              Financial Analysis Dashboard
            </h1>
            {dateRange.start && dateRange.end && (
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                } mt-1`}>
                {format(dateRange.start, "MMMM d, yyyy")} -{" "}
                {format(dateRange.end, "MMMM d, yyyy")}
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setIsLoanModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200">
              Get Loan
            </button>
            <button
              onClick={() => setShowDashboard(false)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
              Upload More PDFs
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200">
              Sign Out
            </button>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } p-6 rounded-lg shadow transform transition-all duration-300 hover:scale-105`}>
            <h3
              className={`text-lg font-medium ${
                darkMode ? "text-gray-200" : "text-gray-900"
              }`}>
              Total Income
            </h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </p>
          </div>
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } p-6 rounded-lg shadow transform transition-all duration-300 hover:scale-105`}>
            <h3
              className={`text-lg font-medium ${
                darkMode ? "text-gray-200" : "text-gray-900"
              }`}>
              Total Spending
            </h3>
            <p className="mt-2 text-3xl font-bold text-red-600">
              ${-totalSpending.toFixed(2)}
            </p>
          </div>
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } p-6 rounded-lg shadow transform transition-all duration-300 hover:scale-105`}>
            <h3
              className={`text-lg font-medium ${
                darkMode ? "text-gray-200" : "text-gray-900"
              }`}>
              Net Balance
            </h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              ${(totalIncome + totalSpending).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } p-6 rounded-lg shadow transform transition-all duration-300 hover:shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-900"
                }`}>
                Financial Health Metrics
              </h3>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => {
                    setSelectedPeriod(e.target.value);
                    setSelectedMonth("");
                    setSelectedYear("");
                  }}
                  className={`rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}>
                  <option value="all">All Time Average</option>
                  {availablePeriods.months.length > 0 && (
                    <option value="monthly">Monthly</option>
                  )}
                  {availablePeriods.years.length > 0 && (
                    <option value="yearly">Yearly</option>
                  )}
                </select>

                {selectedPeriod === "monthly" && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-gray-200"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}>
                    <option value="">Select Month</option>
                    {availablePeriods.months.map((month) => (
                      <option key={month} value={month}>
                        {format(new Date(month), "MMMM yyyy")}
                      </option>
                    ))}
                  </select>
                )}

                {selectedPeriod === "yearly" && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className={`rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-gray-200"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}>
                    <option value="">Select Year</option>
                    {availablePeriods.years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Debt-to-Income Ratio
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-200" : "text-gray-900"
                    }`}>
                    {(periodFeatures.dti_ratio * 100).toFixed(1)}%
                  </span>
                </div>
                <div
                  className={`h-2 ${
                    darkMode ? "bg-gray-700" : "bg-gray-200"
                  } rounded-full overflow-hidden`}>
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        periodFeatures.dti_ratio * 100,
                        100
                      )}%`,
                    }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Savings Rate
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-200" : "text-gray-900"
                    }`}>
                    {(periodFeatures.savings_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div
                  className={`h-2 ${
                    darkMode ? "bg-gray-700" : "bg-gray-200"
                  } rounded-full overflow-hidden`}>
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        periodFeatures.savings_rate * 100,
                        100
                      )}%`,
                    }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Credit Utilization
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-200" : "text-gray-900"
                    }`}>
                    {(periodFeatures.credit_utilization * 100).toFixed(1)}%
                  </span>
                </div>
                <div
                  className={`h-2 ${
                    darkMode ? "bg-gray-700" : "bg-gray-200"
                  } rounded-full overflow-hidden`}>
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        periodFeatures.credit_utilization * 100,
                        100
                      )}%`,
                    }}></div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } p-6 rounded-lg shadow transform transition-all duration-300 hover:shadow-lg`}>
            <h3
              className={`text-lg font-medium ${
                darkMode ? "text-gray-200" : "text-gray-900"
              } mb-4`}>
              Loan Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Total Loan Payment
                </span>
                <span
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}>
                  ${periodFeatures.total_loan_payment?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Number of Active Loans
                </span>
                <span
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}>
                  {periodFeatures.num_loans_paid || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Average Transaction Amount
                </span>
                <span
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}>
                  ${periodFeatures.avg_transaction_amount?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Income vs Spending chart */}
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } p-6 rounded-lg shadow transform transition-all duration-300 hover:shadow-lg`}>
          <div className="flex justify-between items-center mb-6">
            <h2
              className={`text-xl font-bold ${
                darkMode ? "text-gray-200" : "text-gray-900"
              }`}>
              Income vs Spending
            </h2>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className={`rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : "bg-white border-gray-300 text-gray-900"
              }`}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="date"
                  stroke={darkMode ? "#9CA3AF" : "#4B5563"}
                />
                <YAxis stroke={darkMode ? "#9CA3AF" : "#4B5563"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                    border: "none",
                    borderRadius: "0.375rem",
                    color: darkMode ? "#E5E7EB" : "#1F2937",
                  }}
                  labelStyle={{ color: darkMode ? "#E5E7EB" : "#1F2937" }}
                />
                <Legend
                  wrapperStyle={{ color: darkMode ? "#E5E7EB" : "#1F2937" }}
                />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="spending" fill="#EF4444" name="Spending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Existing Recent Transactions table */}
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } p-6 rounded-lg shadow overflow-x-auto transform transition-all duration-300 hover:shadow-lg`}>
          <h2
            className={`mb-4 text-xl font-bold ${
              darkMode ? "text-gray-200" : "text-gray-900"
            }`}>
            Recent Transactions
          </h2>
          <table
            className={`min-w-full divide-y ${
              darkMode ? "divide-gray-700" : "divide-gray-200"
            }`}>
            <thead className={darkMode ? "bg-gray-900" : "bg-gray-50"}>
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } uppercase tracking-wider`}>
                  Date
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } uppercase tracking-wider`}>
                  Description
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } uppercase tracking-wider`}>
                  Category
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } uppercase tracking-wider`}>
                  Type
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } uppercase tracking-wider`}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody
              className={`${darkMode ? "bg-gray-800" : "bg-white"} divide-y ${
                darkMode ? "divide-gray-700" : "divide-gray-200"
              }`}>
              {transactions.slice(0, 10).map((transaction, index) => (
                <tr key={index}>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                    {format(new Date(transaction.date), "MMM d, yyyy")}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-normal text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    } max-w-[200px] break-words`}>
                    {transaction.description}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                    {transaction.category.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.prefix === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                      {transaction.prefix === 1 ? "Credit" : "Debit"}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                    ${transaction.amount.toFixed(2)}
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

export default Dashboard;
