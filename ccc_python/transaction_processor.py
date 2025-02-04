import openai
from pydantic import BaseModel
from typing import List, Optional
from config import Config
import os
import json
from datetime import datetime
from db import transactions_collection


# Initialize OpenAI client
client = openai.OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")


class Transaction(BaseModel):
    date: datetime
    description: str
    prefix: int
    amount: float
    category: Optional[str]
    file_name: str
    page_number: int


class TransactionList(BaseModel):
    Transactions: List[Transaction]


def process_transaction_text(transaction_text: str, file_name: str, page_number: int) -> TransactionList:
    """Process transaction text using OpenAI API and return structured data"""
    try:
        current_year = datetime.now().year
        prompt = f"""
        Extract the following fields from the transaction text below, paying special attention to multi-row entries:

        - **Date:** Extract the date in the format "YYYY-MM-DD". If the year is not provided in the input, use the current year ({current_year}).
        - **Description:** Provide a concise summary of the transaction details (maximum 10 words). If the description spans multiple rows, combine them.
        - **Prefix:** Use 1 for a credit transaction (money in) and -1 for a debit transaction (money out).
        - **Amount:** Extract the transaction amount as a decimal number with 2 decimal places (e.g., 17.43, 100.00). If the amount is split across rows or columns, combine them correctly.
        - **Category:** Identify the type of transaction (e.g., rent, payment, groceries, etc). Use the transaction description and type to determine the most appropriate category.

        Important parsing rules:
        1. Some transactions may span multiple rows - combine them into a single transaction
        2. there might be a transaction has reference numbers or additional details in subsequent rows.
        3. Ensure transactions are properly combined when split across multiple rows

        Return the output strictly as a JSON object.
        Transaction text: \"{transaction_text}\"
        """

        completion = client.beta.chat.completions.parse(
            temperature=0,
            model="llama3.2:3b",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts structured transaction data from text."},
                {"role": "user", "content": prompt}
            ],
            response_format=TransactionList
        )
        response = completion.choices[0].message

        # Parse the response and create TransactionList
        transactions_data = response.parsed
        # insert to mongo db
        save_transactions(transactions_data)

        return transactions_data

    except Exception as e:
        print(f"Error processing transactions: {str(e)}")
        raise e


def save_transactions(transactions: TransactionList):
    """Save individual transactions to MongoDB"""

    try:
        saved_ids = []
        for transaction in transactions.Transactions:
            # Convert transaction to dictionary and add timestamp
            transaction_dict = transaction.model_dump()
            transaction_dict['created_at'] = datetime.now()

            # Insert into MongoDB
            result = transactions_collection.insert_one(transaction_dict)

            if result.inserted_id:
                saved_ids.append(str(result.inserted_id))
                print(f"""Transaction successfully saved to MongoDB with ID: {
                      result.inserted_id}""")
            else:
                raise Exception("Failed to save transaction to MongoDB")

        return saved_ids

    except Exception as e:
        error_msg = f"Error saving transactions: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)
