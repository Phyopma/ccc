import pandas as pd
import joblib
import warnings

# Filter XGBoost version compatibility warnings
warnings.filterwarnings('ignore', category=UserWarning, module='xgboost.core')


class LoanModel:
    def __init__(self, model_path='models/'):
        """Initialize LoanModel with path to model files."""
        self.model_path = model_path
        self.approval_model = None
        self.apr_model = None
        self.load_models()
        self.threshold = 0.36

    def load_models(self):
        """Load trained models from disk with error handling."""
        try:
            self.approval_model = joblib.load(
                f'{self.model_path}classification_model.pkl')
            self.apr_model = joblib.load(
                f'{self.model_path}regression_model.pkl')
        except Exception as e:
            raise RuntimeError(f"Error loading models: {str(e)}")

    def predict(self, data):
        """Predict loan approval probability and APR rate.

        Args:
            data (pd.DataFrame): DataFrame containing features:
                - age: numeric value
                - Credit_Score: credit score value
                - income: annual income in dollars
                - term: loan term in months
                - loan_amount: requested loan amount in dollars
                - dtir1: debt-to-income ratio

        Returns:
            tuple: (approval_probability, apr_rate)
        """
        if not isinstance(data, pd.DataFrame):
            raise ValueError("Input must be a pandas DataFrame")

        required_features = ['age', 'Credit_Score',
                             'income', 'term', 'loan_amount', 'dtir1']
        if not all(feature in data.columns for feature in required_features):
            raise ValueError(f"""Missing required features. Required: {
                             required_features}""")

        # Predict loan approval probability
        approval_prob = int(self.approval_model.predict_proba(data)[
            0][1] >= self.threshold)

        # Predict APR rate
        apr_rate = self.apr_model.predict(data)[0]
        print("approved: ", approval_prob, ", APR: ", apr_rate)
        return approval_prob, apr_rate


if __name__ == "__main__":
    # Example usage
    new_data = pd.DataFrame({
        'age': [29.5],              # Example numeric value for age
        'Credit_Score': [700],       # Example credit score
        'income': [50000],           # Example annual income in dollars
        'term': [360],               # Example loan term in months
        'loan_amount': [200000],     # Example loan amount in dollars
        'dtir1': [0.35]              # Example debt-to-income ratio
    })

    # Initialize and use the model
    model = LoanModel()
    prob, apr = model.predict(new_data)

    print(f'Loan Approval Probability: {prob:.2%}')
    print(f'Predicted APR: {apr:.2f}%')
