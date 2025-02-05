import pandas as pd


class FinanceProcessor:
    @staticmethod
    def process_transactions(transactions: list) -> pd.DataFrame:
        # Convert transactions to DataFrame
        df = pd.DataFrame([t for t in transactions])

        # Convert date column to datetime with error handling
        try:
            df["date"] = pd.to_datetime(
                df["date"], format="mixed", errors="coerce")
            # Drop rows with invalid dates
            df = df.dropna(subset=["date"])
            # Ensure dates are within reasonable bounds (between 1950 and 2080)
            df = df[(df["date"].dt.year >= 1950) &
                    (df["date"].dt.year <= 2080)]
            # Extract month and year for aggregation
            df["month"] = df["date"].dt.to_period("M")
        except Exception as e:
            raise e

        # Adjust income and expenses based on prefix and category
        df["income"] = df.apply(
            lambda x: x["amount"] if x["prefix"] == 1 and x["category"] in [
                "income", "financial"] else 0,
            axis=1
        )
        df["expense"] = df.apply(
            lambda x: x["amount"] if x["prefix"] == -1 else 0,
            axis=1
        )

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
        loan_df = df[(df["category"] == "Financial") & (df["prefix"] == -1)]
        loan_payments = loan_df.groupby(["month"])["expense"].agg([
            ("total_loan_payment", lambda x: abs(sum(x))),
            ("num_loans_paid", "count")
        ]).reset_index()

        # Compute credit card expenses and utilization
        credit_expenses = df[
            (df["category"].isin(["Shopping", "Entertainment", "Food"])) &
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
        # Ensure DTI ratio is between 0 and 1, handling zero monthly income
        dti["dti_ratio"] = dti.apply(
            lambda x: min(1, x["total_loan_payment"] /
                          max(x["monthly_income"], 0.01)),
            axis=1
        )

        # Calculate max DTI ratio over 1-year interval
        dti["max_annual_dti"] = dti["dti_ratio"].rolling(
            window=12, min_periods=1).max()

        # Compute Savings Rate
        savings = pd.merge(monthly_income, monthly_expenses,
                           on="month", how="left").fillna(0)

        # Ensure savings rate is between 0 and 1
        savings["savings_rate"] = savings.apply(
            lambda x: max(0, min(
                1, (x["monthly_income"] - x["monthly_expenses"]) / max(x["monthly_income"], 0.01))),
            axis=1
        )

        # Merge all financial variables
        finance_features = dti.merge(savings.drop(
            columns=['monthly_income']), on="month", how="left")
        finance_features = finance_features.merge(
            avg_transaction, on="month", how="left")
        finance_features = finance_features.merge(
            credit_expenses, on="month", how="left")
        finance_features = finance_features.fillna(0)

        return finance_features
