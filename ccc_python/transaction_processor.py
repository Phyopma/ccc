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
    user_id: str


class TransactionList(BaseModel):
    Transactions: List[Transaction]


def process_transaction_text(transaction_text: str, user_id: str) -> TransactionList:
    """Process transaction text using OpenAI API and return structured data"""

    try:
        # Remove first line (Page #)
        transaction_texts = transaction_text.split('\n')[1:]
        # Define maximum chunk size (in characters)
        MAX_CHUNK_SIZE = 2300
        first_line = transaction_texts[0]
        # If text is shorter than max size, process it directly
        if len(transaction_text) <= MAX_CHUNK_SIZE:
            tmp = _process_single_chunk(transaction_text)
            return save_transactions(tmp, user_id)

        # Split text into chunks at newline boundaries
        chunks = []
        current_chunk = ""

        for line in transaction_texts:
            if len(current_chunk) + len(line) + 1 <= MAX_CHUNK_SIZE:
                current_chunk += line + '\n'
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = first_line + '\n'+line + '\n'

        # Add the last chunk if it exists
        if current_chunk:
            chunks.append(first_line+'\n'+current_chunk)

        # Process each chunk and combine results
        all_transactions = []
        for chunk in chunks:
            print("this chunk is processing: ", chunk)
            chunk_result = _process_single_chunk(chunk)
            save_transactions(chunk_result, user_id)
            all_transactions.extend(chunk_result.Transactions)

        # Create combined TransactionList
        combined_transactions = TransactionList(
            Transactions=all_transactions)

        # Save all transactions
        # save_transactions(combined_transactions, user_id)

        return combined_transactions
    except Exception as e:
        print(f"Error processing transactions: {str(e)}")
        raise e


def _process_single_chunk(transaction_text: str) -> TransactionList:
    """Process a single chunk of transaction text"""
    current_year = datetime.now().year
    prompt = f"""
    Parse transaction text into structured data with these fields:
    - Date: Give in YYYY-MM-DD format (use {current_year} if year missing)
      * YYYY should be between 1950 and 2080
      * Handle various date formats (DD/MM, MM/DD, etc.) Don't confuse DD with YY.

    - Description: Concise summary (<10 words)
      * Keep merchant/payee names intact
      * Standardize common transaction descriptions
      * Make sure add description for all vaild transactions

    - Prefix: 1=incoming(credit/deposit, etc), -1=outgoing(debit/withdrawal, etc)
      * Use amount position first then keywords to determine prefix
      * Consider positive/negative amount indicators

    - Amount: Decimal with 2 places
      * Extract numerical values only
      * All amounts should be positive, if negative make prefix -1 and amount positive

    - Category: Transaction type
      * Categorize based on description keywords and merchant name
      * Use standardized categories:
        - Income: salary, wages, deposits
        - Housing: rent, mortgage, utilities
        - Food: groceries, restaurants, dining
        - Transportation: fuel, parking, transit
        - Shopping: retail, clothing, electronics
        - Bills: phone, internet, insurance
        - Entertainment: movies, games, subscriptions
        - Health: medical, pharmacy, fitness
        - Education: tuition, books, courses
        - Financial: investments, transfers, loans

    *** Notes: Sometimes when u detect 3 columns; ignore last column since they are just the aggregate of previous 2 columns.

    Text: \"{transaction_text}\"
    """

    try:
        completion = client.beta.chat.completions.parse(
            temperature=0.43,
            model="llama3.2:3b",
            messages=[
                {"role": "system", "content": "You are a financial data extraction expert that accurately parses transaction data from text while maintaining data integrity and consistency."},
                {"role": "user", "content": prompt}
            ],
            response_format=TransactionList
        )
        response = completion.choices[0].message
        return response.parsed
    except Exception as e:
        print(f"Error processing transactions: {str(e)}")
        raise e


def save_transactions(transactions: TransactionList, user_id: str):
    """Save individual transactions to MongoDB"""

    try:
        saved_ids = []
        for transaction in transactions.Transactions:
            # Convert transaction to dictionary and add timestamp
            transaction_dict = transaction.model_dump()
            transaction_dict['created_at'] = datetime.now()
            transaction_dict['user_id'] = user_id

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
