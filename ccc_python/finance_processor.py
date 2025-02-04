import pandas as pd


class FinanceProcessor:
    @staticmethod
    def process_transactions(transactions: list) -> pd.DataFrame:
        # Convert transactions to DataFrame
        df = pd.DataFrame([t for t in transactions])

        # Convert date column to datetime
        df["date"] = pd.to_datetime(df["date"])

        # Extract month and year for aggregation
        df["month"] = df["date"].dt.to_period("M")

        # Adjust income and expenses based on prefix
        df["income"] = df["amount"].where(
            df["prefix"] == 1, 0)  # Income if prefix = 1
        df["expense"] = df["amount"].where(
            df["prefix"] == -1, 0)  # Expense if prefix = -1

        # Compute total monthly income
        monthly_income = df.groupby(["month"])["income"].sum().reset_index()
        monthly_income.rename(
            columns={"income": "monthly_income"}, inplace=True)

        # Compute total monthly expenses
        monthly_expenses = df.groupby(["month"])["expense"].sum().reset_index()
        monthly_expenses.rename(
            columns={"expense": "monthly_expenses"}, inplace=True)
        monthly_expenses["monthly_expenses"] = monthly_expenses["monthly_expenses"].abs(
        )

        # Compute average transaction amount
        avg_transaction = df.groupby(
            ["month"])["amount"].mean().abs().reset_index()
        avg_transaction.rename(
            columns={"amount": "avg_transaction_amount"}, inplace=True)

        # Compute loan-related metrics
        loan_df = df[df["category"] == "loan"]
        loan_payments = loan_df.groupby(["month"])["expense"].agg([
            ("total_loan_payment", lambda x: abs(sum(x))),
            ("num_loans_paid", "count")
        ]).reset_index()

        # Compute credit card expenses and utilization
        credit_expenses = df[
            (df["category"] == "credit_card") &
            (df["prefix"] == -1)
        ].groupby(["month"])["amount"].sum().abs().reset_index()
        credit_expenses.rename(
            columns={"amount": "credit_expenses"}, inplace=True)

        # Note: Total credit limit should be provided as input for accurate calculation
        # Using a placeholder value of 10000 for demonstration
        credit_limit = 10000
        credit_expenses["credit_utilization"] = credit_expenses["credit_expenses"] / credit_limit

        # Compute Debt-to-Income Ratio (DTI)
        dti = pd.merge(monthly_income, loan_payments,
                       on="month", how="left").fillna(0)
        dti["dti_ratio"] = dti["total_loan_payment"] / dti["monthly_income"]

        # Compute Savings Rate
        savings = pd.merge(monthly_income, monthly_expenses,
                           on="month", how="left").fillna(0)
        savings["savings_rate"] = (
            savings["monthly_income"] - savings["monthly_expenses"]) / savings["monthly_income"]

        # Merge all financial variables
        finance_features = dti.merge(savings.drop(
            columns=['monthly_income']), on="month", how="left")
        finance_features = finance_features.merge(
            avg_transaction, on="month", how="left")
        finance_features = finance_features.merge(
            credit_expenses, on="month", how="left")
        finance_features = finance_features.fillna(0)

        return finance_features
