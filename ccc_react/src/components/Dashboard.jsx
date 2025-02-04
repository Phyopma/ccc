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

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("monthly");
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalSpending, setTotalSpending] = useState(0);
  const [financeFeatures, setFinanceFeatures] = useState([]);
  const { user } = useAuth();

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
  const latestFeatures = financeFeatures[financeFeatures.length - 1] || {};

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow transform transition-all duration-300 hover:scale-105">
          <h3 className="text-lg font-medium text-gray-900">Total Income</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            ${totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow transform transition-all duration-300 hover:scale-105">
          <h3 className="text-lg font-medium text-gray-900">Total Spending</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">
            ${totalSpending.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow transform transition-all duration-300 hover:scale-105">
          <h3 className="text-lg font-medium text-gray-900">Net Balance</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            ${(totalIncome - totalSpending).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow transform transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Financial Health Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Debt-to-Income Ratio
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {(latestFeatures.dti_ratio * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(latestFeatures.dti_ratio * 100, 100)}%`,
                  }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Savings Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {(latestFeatures.savings_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      latestFeatures.savings_rate * 100,
                      100
                    )}%`,
                  }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Credit Utilization
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {(latestFeatures.credit_utilization * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      latestFeatures.credit_utilization * 100,
                      100
                    )}%`,
                  }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow transform transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Loan Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Loan Payment</span>
              <span className="text-sm font-medium text-gray-900">
                ${latestFeatures.total_loan_payment?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Number of Active Loans
              </span>
              <span className="text-sm font-medium text-gray-900">
                {latestFeatures.num_loans_paid || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Average Transaction Amount
              </span>
              <span className="text-sm font-medium text-gray-900">
                ${latestFeatures.avg_transaction_amount?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Income vs Spending chart */}
      <div className="bg-white p-6 rounded-lg shadow transform transition-all duration-300 hover:shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Income vs Spending
          </h2>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" />
              <Bar dataKey="spending" fill="#EF4444" name="Spending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Existing Recent Transactions table */}
      <div className="bg-white p-6 rounded-lg shadow overflow-x-auto transform transition-all duration-300 hover:shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Recent Transactions
        </h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.slice(0, 10).map((transaction, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(transaction.date), "MMM d, yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-[200px] break-words">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${transaction.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
