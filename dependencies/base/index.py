r"""

# Nomenclature

| Prefix | Definition | Examples |
| --- | --- | --- |
| `vn.get_` | Fetch some data | [`vn.get_related_ddl(...)`][vanna.base.base.VannaBase.get_related_ddl] |
| `vn.add_` | Adds something to the retrieval layer | [`vn.add_question_sql(...)`][vanna.base.base.VannaBase.add_question_sql] <br> [`vn.add_ddl(...)`][vanna.base.base.VannaBase.add_ddl] |
| `vn.generate_` | Generates something using AI based on the information in the model | [`vn.generate_sql(...)`][vanna.base.base.VannaBase.generate_sql] <br> [`vn.generate_explanation()`][vanna.base.base.VannaBase.generate_explanation] |
| `vn.run_` | Runs code (SQL) | [`vn.run_sql`][vanna.base.base.VannaBase.run_sql] |
| `vn.remove_` | Removes something from the retrieval layer | [`vn.remove_training_data`][vanna.base.base.VannaBase.remove_training_data] |
| `vn.connect_` | Connects to a database | [`vn.connect_to_snowflake(...)`][vanna.base.base.VannaBase.connect_to_snowflake] |
| `vn.update_` | Updates something | N/A -- unused |
| `vn.set_` | Sets something | N/A -- unused  |

# Open-Source and Extending

Vanna.AI is open-source and extensible. If you'd like to use Vanna without the servers, see an example [here](/docs/local.html).

The following is an example of where various functions are implemented in the codebase when using the default "local" version of Vanna. `vanna.base.VannaBase` is the base class which provides a `vanna.base.VannaBase.ask` and `vanna.base.VannaBase.train` function. Those rely on abstract methods which are implemented in the subclasses `vanna.openai_chat.OpenAI_Chat` and `vanna.chromadb_vector.ChromaDB_VectorStore`. `vanna.openai_chat.OpenAI_Chat` uses the OpenAI API to generate SQL and Plotly code. `vanna.chromadb_vector.ChromaDB_VectorStore` uses ChromaDB to store training data and generate embeddings.

If you want to use Vanna with other LLMs or databases, you can create your own subclass of `vanna.base.VannaBase` and implement the abstract methods.

```mermaid
flowchart
    subgraph VannaBase
        ask
        train
    end

    subgraph OpenAI_Chat
        get_sql_prompt
        submit_prompt
        generate_question
        generate_plotly_code
    end

    subgraph ChromaDB_VectorStore
        generate_embedding
        add_question_sql
        add_ddl
        add_documentation
        get_similar_question_sql
        get_related_ddl
        get_related_documentation
    end
```
"""

import os
import re
import traceback
from abc import ABC, abstractmethod
from typing import List, Tuple, Union

import pandas as pd

from ..exceptions.index import DependencyError, ImproperlyConfigured, ValidationError
from ..types.index import TrainingPlan, TrainingPlanItem


class VannaBase(ABC):
    def __init__(self, config=None):
        self.config = config
        self.run_sql_is_set = False
        self.static_documentation = ""

    def log(self, message: str):
        print(message)

    def generate_sql(self, question: str, **kwargs) -> str:
        """
        Example:
        ```python
        vn.generate_sql("What are the top 10 customers by sales?")
        ```

        Uses the LLM to generate a SQL query that answers a question. It runs the following methods:

        - [`get_similar_question_sql`][vanna.base.base.VannaBase.get_similar_question_sql]

        - [`get_related_ddl`][vanna.base.base.VannaBase.get_related_ddl]

        - [`get_related_documentation`][vanna.base.base.VannaBase.get_related_documentation]

        - [`get_sql_prompt`][vanna.base.base.VannaBase.get_sql_prompt]

        - [`submit_prompt`][vanna.base.base.VannaBase.submit_prompt]


        Args:
            question (str): The question to generate a SQL query for.

        Returns:
            str: The SQL query that answers the question.
        """
        question_sql_list = self.get_similar_question_sql(question, **kwargs)
        ddl_list = self.get_related_ddl(question, **kwargs)
        doc_list = self.get_related_documentation(question, **kwargs)
        prompt = self.get_sql_prompt(
            question=question,
            question_sql_list=question_sql_list,
            ddl_list=ddl_list,
            doc_list=doc_list,
            **kwargs,
        )
        self.log(prompt)
        llm_response = self.submit_prompt(prompt, **kwargs)
        self.log(llm_response)
        return self.extract_sql(llm_response)

    def extract_sql(self, llm_response: str) -> str:
        # If the llm_response contains a markdown code block, with or without the sql tag, extract the sql from it
        sql = re.search(r"```sql\n(.*)```", llm_response, re.DOTALL)
        if sql:
            self.log(f"Output from LLM: {llm_response} \nExtracted SQL: {sql.group(1)}")
            return sql.group(1)

        sql = re.search(r"```(.*)```", llm_response, re.DOTALL)
        if sql:
            self.log(f"Output from LLM: {llm_response} \nExtracted SQL: {sql.group(1)}")
            return sql.group(1)

        return llm_response

    def is_sql_valid(self, sql: str) -> bool:
        # This is a check to see the SQL is valid and should be run
        # This simple function just checks if the SQL contains a SELECT statement

        if "SELECT" in sql.upper():
            return True
        else:
            return False

    def generate_followup_questions(
        self, question: str, sql: str, df: pd.DataFrame, **kwargs
    ) -> list:
        """
        **Example:**
        ```python
        vn.generate_followup_questions("What are the top 10 customers by sales?", df)
        ```

        Generate a list of followup questions that you can ask Vanna.AI.

        Args:
            question (str): The question that was asked.
            df (pd.DataFrame): The results of the SQL query.

        Returns:
            list: A list of followup questions that you can ask Vanna.AI.
        """

        message_log = [
            self.system_message(
                f"You are a helpful data assistant. The user asked the question: '{question}'\n\nThe SQL query for this question was: {sql}\n\nThe following is a pandas DataFrame with the results of the query: \n{df.to_markdown()}\n\n"
            ),
            self.user_message(
                "Generate a list of followup questions that the user might ask about this data. Respond with a list of questions, one per line. Do not answer with any explanations -- just the questions. Remember that there should be an unambiguous SQL query that can be generated from the question. Prefer questions that are answerable outside of the context of this conversation. Prefer questions that are slight modifications of the SQL query that was generated that allow digging deeper into the data. Each question will be turned into a button that the user can click to generate a new SQL query so don't use 'example' type questions. Each question must have a one-to-one correspondence with an instantiated SQL query."
            ),
        ]

        llm_response = self.submit_prompt(message_log, **kwargs)

        numbers_removed = re.sub(r"^\d+\.\s*", "", llm_response, flags=re.MULTILINE)
        return numbers_removed.split("\n")

    def generate_questions(self, **kwargs) -> List[str]:
        """
        **Example:**
        ```python
        vn.generate_questions()
        ```

        Generate a list of questions that you can ask Vanna.AI.
        """
        question_sql = self.get_similar_question_sql(question="", **kwargs)

        return [q["question"] for q in question_sql]

    def generate_summary(self, question: str, df: pd.DataFrame, **kwargs) -> str:
        """
        **Example:**
        ```python
        vn.generate_summary("What are the top 10 customers by sales?", df)
        ```

        Generate a summary of the results of a SQL query.

        Args:
            question (str): The question that was asked.
            df (pd.DataFrame): The results of the SQL query.

        Returns:
            str: The summary of the results of the SQL query.
        """

        message_log = [
            self.system_message(
                f"You are a helpful data assistant. The user asked the question: '{question}'\n\nThe following is a pandas DataFrame with the results of the query: \n{df.to_markdown()}\n\n"
            ),
            self.user_message(
                "Briefly summarize the data based on the question that was asked. Do not respond with any additional explanation beyond the summary."
            ),
        ]

        summary = self.submit_prompt(message_log, **kwargs)

        return summary

    # ----------------- Use Any Embeddings API ----------------- #
    @abstractmethod
    def generate_embedding(self, data: str, **kwargs) -> List[float]:
        pass

    # ----------------- Use Any Database to Store and Retrieve Context ----------------- #
    @abstractmethod
    def get_similar_question_sql(self, question: str, **kwargs) -> list:
        """
        This method is used to get similar questions and their corresponding SQL statements.

        Args:
            question (str): The question to get similar questions and their corresponding SQL statements for.

        Returns:
            list: A list of similar questions and their corresponding SQL statements.
        """
        pass

    @abstractmethod
    def get_related_ddl(self, question: str, **kwargs) -> list:
        """
        This method is used to get related DDL statements to a question.

        Args:
            question (str): The question to get related DDL statements for.

        Returns:
            list: A list of related DDL statements.
        """
        pass

    @abstractmethod
    def get_related_documentation(self, question: str, **kwargs) -> list:
        """
        This method is used to get related documentation to a question.

        Args:
            question (str): The question to get related documentation for.

        Returns:
            list: A list of related documentation.
        """
        pass

    @abstractmethod
    def add_question_sql(self, question: str, sql: str, **kwargs) -> str:
        """
        This method is used to add a question and its corresponding SQL query to the training data.

        Args:
            question (str): The question to add.
            sql (str): The SQL query to add.

        Returns:
            str: The ID of the training data that was added.
        """
        pass

    @abstractmethod
    def add_ddl(self, ddl: str, **kwargs) -> str:
        """
        This method is used to add a DDL statement to the training data.

        Args:
            ddl (str): The DDL statement to add.

        Returns:
            str: The ID of the training data that was added.
        """
        pass

    @abstractmethod
    def add_documentation(self, documentation: str, **kwargs) -> str:
        """
        This method is used to add documentation to the training data.

        Args:
            documentation (str): The documentation to add.

        Returns:
            str: The ID of the training data that was added.
        """
        pass

    @abstractmethod
    def get_training_data(self, **kwargs) -> pd.DataFrame:
        """
        Example:
        ```python
        vn.get_training_data()
        ```

        This method is used to get all the training data from the retrieval layer.

        Returns:
            pd.DataFrame: The training data.
        """
        pass

    @abstractmethod
    def remove_training_data(id: str, **kwargs) -> bool:
        """
        Example:
        ```python
        vn.remove_training_data(id="123-ddl")
        ```

        This method is used to remove training data from the retrieval layer.

        Args:
            id (str): The ID of the training data to remove.

        Returns:
            bool: True if the training data was removed, False otherwise.
        """
        pass

    # ----------------- Use Any Language Model API ----------------- #

    @abstractmethod
    def system_message(self, message: str) -> any:
        pass

    @abstractmethod
    def user_message(self, message: str) -> any:
        pass

    @abstractmethod
    def assistant_message(self, message: str) -> any:
        pass

    def str_to_approx_token_count(self, string: str) -> int:
        return len(string) / 4

    def add_ddl_to_prompt(
        self, initial_prompt: str, ddl_list: list[str], max_tokens: int = 14000
    ) -> str:
        if len(ddl_list) > 0:
            initial_prompt += f"\nYou may use the following DDL statements as a reference for what tables might be available. Use responses to past questions also to guide you:\n\n"

            for ddl in ddl_list:
                if (
                    self.str_to_approx_token_count(initial_prompt)
                    + self.str_to_approx_token_count(ddl)
                    < max_tokens
                ):
                    initial_prompt += f"{ddl}\n\n"

        return initial_prompt

    def add_documentation_to_prompt(
        self,
        initial_prompt: str,
        documentation_list: list[str],
        max_tokens: int = 14000,
    ) -> str:
        if len(documentation_list) > 0:
            initial_prompt += f"\nYou may use the following documentation as a reference for what tables might be available. Use responses to past questions also to guide you:\n\n"

            for documentation in documentation_list:
                if (
                    self.str_to_approx_token_count(initial_prompt)
                    + self.str_to_approx_token_count(documentation)
                    < max_tokens
                ):
                    initial_prompt += f"{documentation}\n\n"

        return initial_prompt

    def add_sql_to_prompt(
        self, initial_prompt: str, sql_list: list[str], max_tokens: int = 14000
    ) -> str:
        if len(sql_list) > 0:
            initial_prompt += f"\nYou may use the following SQL statements as a reference for what tables might be available. Use responses to past questions also to guide you:\n\n"

            for question in sql_list:
                if (
                    self.str_to_approx_token_count(initial_prompt)
                    + self.str_to_approx_token_count(question["sql"])
                    < max_tokens
                ):
                    initial_prompt += f"{question['question']}\n{question['sql']}\n\n"

        return initial_prompt

    def get_sql_prompt(
        self,
        question: str,
        question_sql_list: list,
        ddl_list: list,
        doc_list: list,
        **kwargs,
    ):
        """
        Example:
        ```python
        vn.get_sql_prompt(
            question="What are the top 10 customers by sales?",
            question_sql_list=[{"question": "What are the top 10 customers by sales?", "sql": "SELECT * FROM customers ORDER BY sales DESC LIMIT 10"}],
            ddl_list=["CREATE TABLE customers (id INT, name TEXT, sales DECIMAL)"],
            doc_list=["The customers table contains information about customers and their sales."],
        )

        ```

        This method is used to generate a prompt for the LLM to generate SQL.

        Args:
            question (str): The question to generate SQL for.
            question_sql_list (list): A list of questions and their corresponding SQL statements.
            ddl_list (list): A list of DDL statements.
            doc_list (list): A list of documentation.

        Returns:
            any: The prompt for the LLM to generate SQL.
        """
        initial_prompt = "The user provides a question and you provide SQL. You will only respond with SQL code and not with any explanations.\n\nRespond with only SQL code. Do not answer with any explanations -- just the code.\n"

        initial_prompt = self.add_ddl_to_prompt(
            initial_prompt, ddl_list, max_tokens=14000
        )

        if self.static_documentation != "":
            doc_list.append(self.static_documentation)

        initial_prompt = self.add_documentation_to_prompt(
            initial_prompt, doc_list, max_tokens=14000
        )

        message_log = [self.system_message(initial_prompt)]

        for example in question_sql_list:
            if example is None:
                print("example is None")
            else:
                if example is not None and "question" in example and "sql" in example:
                    message_log.append(self.user_message(example["question"]))
                    message_log.append(self.assistant_message(example["sql"]))

        message_log.append(self.user_message(question))

        return message_log

    def get_followup_questions_prompt(
        self,
        question: str,
        question_sql_list: list,
        ddl_list: list,
        doc_list: list,
        **kwargs,
    ) -> list:
        initial_prompt = f"The user initially asked the question: '{question}': \n\n"

        initial_prompt = self.add_ddl_to_prompt(
            initial_prompt, ddl_list, max_tokens=14000
        )

        initial_prompt = self.add_documentation_to_prompt(
            initial_prompt, doc_list, max_tokens=14000
        )

        initial_prompt = self.add_sql_to_prompt(
            initial_prompt, question_sql_list, max_tokens=14000
        )

        message_log = [self.system_message(initial_prompt)]
        message_log.append(
            self.user_message(
                "Generate a list of followup questions that the user might ask about this data. Respond with a list of questions, one per line. Do not answer with any explanations -- just the questions."
            )
        )

        return message_log

    @abstractmethod
    def submit_prompt(self, prompt, **kwargs) -> str:
        """
        Example:
        ```python
        vn.submit_prompt(
            [
                vn.system_message("The user will give you SQL and you will try to guess what the business question this query is answering. Return just the question without any additional explanation. Do not reference the table name in the question."),
                vn.user_message("What are the top 10 customers by sales?"),
            ]
        )
        ```

        This method is used to submit a prompt to the LLM.

        Args:
            prompt (any): The prompt to submit to the LLM.

        Returns:
            str: The response from the LLM.
        """
        pass

    def generate_question(self, sql: str, **kwargs) -> str:
        response = self.submit_prompt(
            [
                self.system_message(
                    "The user will give you SQL and you will try to guess what the business question this query is answering. Return just the question without any additional explanation. Do not reference the table name in the question."
                ),
                self.user_message(sql),
            ],
            **kwargs,
        )

        return response

    def _extract_python_code(self, markdown_string: str) -> str:
        # Regex pattern to match Python code blocks
        pattern = r"```[\w\s]*python\n([\s\S]*?)```|```([\s\S]*?)```"

        # Find all matches in the markdown string
        matches = re.findall(pattern, markdown_string, re.IGNORECASE)

        # Extract the Python code from the matches
        python_code = []
        for match in matches:
            python = match[0] if match[0] else match[1]
            python_code.append(python.strip())

        if len(python_code) == 0:
            return markdown_string

        return python_code[0]

    # ----------------- Connect to Any Database to run the Generated SQL ----------------- #

    def connect_to_snowflake(
        self,
        account: str,
        username: str,
        password: str,
        database: str,
        role: Union[str, None] = None,
        warehouse: Union[str, None] = None,
    ):
        try:
            snowflake = __import__("snowflake.connector")
        except ImportError:
            raise DependencyError(
                "You need to install required dependencies to execute this method, run command:"
                " \npip install vanna[snowflake]"
            )

        if username == "my-username":
            username_env = os.getenv("SNOWFLAKE_USERNAME")

            if username_env is not None:
                username = username_env
            else:
                raise ImproperlyConfigured("Please set your Snowflake username.")

        if password == "my-password":
            password_env = os.getenv("SNOWFLAKE_PASSWORD")

            if password_env is not None:
                password = password_env
            else:
                raise ImproperlyConfigured("Please set your Snowflake password.")

        if account == "my-account":
            account_env = os.getenv("SNOWFLAKE_ACCOUNT")

            if account_env is not None:
                account = account_env
            else:
                raise ImproperlyConfigured("Please set your Snowflake account.")

        if database == "my-database":
            database_env = os.getenv("SNOWFLAKE_DATABASE")

            if database_env is not None:
                database = database_env
            else:
                raise ImproperlyConfigured("Please set your Snowflake database.")

        conn = snowflake.connector.connect(
            user=username,
            password=password,
            account=account,
            database=database,
        )

        def run_sql_snowflake(sql: str) -> pd.DataFrame:
            cs = conn.cursor()

            if role is not None:
                cs.execute(f"USE ROLE {role}")

            if warehouse is not None:
                cs.execute(f"USE WAREHOUSE {warehouse}")
            cs.execute(f"USE DATABASE {database}")

            cur = cs.execute(sql)

            results = cur.fetchall()

            # Create a pandas dataframe from the results
            df = pd.DataFrame(results, columns=[desc[0] for desc in cur.description])

            return df

        self.static_documentation = "This is a Snowflake database"
        self.run_sql = run_sql_snowflake
        self.run_sql_is_set = True

    def run_sql(self, sql: str, **kwargs) -> pd.DataFrame:
        """
        Example:
        ```python
        vn.run_sql("SELECT * FROM my_table")
        ```

        Run a SQL query on the connected database.

        Args:
            sql (str): The SQL query to run.

        Returns:
            pd.DataFrame: The results of the SQL query.
        """
        raise Exception(
            "You need to connect to a database first by running vn.connect_to_snowflake(), vn.connect_to_postgres(), similar function, or manually set vn.run_sql"
        )

    def ask(
        self,
        question: Union[str, None] = None,
        auto_train: bool = True,
    ) -> Union[
        Tuple[
            Union[str, None],
            Union[pd.DataFrame, None],
        ],
        None,
    ]:
        """
        **Example:**
        ```python
        vn.ask("What are the top 10 customers by sales?")
        ```

        Ask Vanna.AI a question and get the SQL query that answers it.

        Args:
            question (str): The question to ask.
            print_results (bool): Whether to print the results of the SQL query.
            auto_train (bool): Whether to automatically train Vanna.AI on the question and SQL query.

        Returns:
            Tuple[str, pd.DataFrame ]: The SQL query, the results of the SQL query, and the plotly figure.
        """

        if question is None:
            question = input("Enter a question: ")

        try:
            sql = self.generate_sql(question=question)
        except Exception as e:
            print(e)
            return None, None, None

        if self.run_sql_is_set is False:
            print(
                "If you want to run the SQL query, connect to a database first. See here: https://vanna.ai/docs/databases.html"
            )
            return sql, None, None

        try:
            df = self.run_sql(sql)

            if len(df) > 0 and auto_train:
                self.add_question_sql(question=question, sql=sql)
            # Only generate plotly code if visualize is True

            return sql, df, None

        except Exception as e:
            print("Couldn't run sql: ", e)
            return sql, None, None

    def train(
        self,
        question: str = None,
        sql: str = None,
        ddl: str = None,
        documentation: str = None,
        plan: TrainingPlan = None,
    ) -> str:
        """
        **Example:**
        ```python
        vn.train()
        ```

        Train Vanna.AI on a question and its corresponding SQL query.
        If you call it with no arguments, it will check if you connected to a database and it will attempt to train on the metadata of that database.
        If you call it with the sql argument, it's equivalent to [`vn.add_question_sql()`][vanna.base.base.VannaBase.add_question_sql].
        If you call it with the ddl argument, it's equivalent to [`vn.add_ddl()`][vanna.base.base.VannaBase.add_ddl].
        If you call it with the documentation argument, it's equivalent to [`vn.add_documentation()`][vanna.base.base.VannaBase.add_documentation].
        Additionally, you can pass a [`TrainingPlan`][vanna.types.TrainingPlan] object. Get a training plan with [`vn.get_training_plan_generic()`][vanna.base.base.VannaBase.get_training_plan_generic].

        Args:
            question (str): The question to train on.
            sql (str): The SQL query to train on.
            ddl (str):  The DDL statement.
            documentation (str): The documentation to train on.
            plan (TrainingPlan): The training plan to train on.
        """

        if question and not sql:
            raise ValidationError(f"Please also provide a SQL query")

        if documentation:
            print("Adding documentation....")
            return self.add_documentation(documentation)

        if sql:
            if question is None:
                question = self.generate_question(sql)
                print("Question generated with sql:", question, "\nAdding SQL...")
            return self.add_question_sql(question=question, sql=sql)

        if ddl:
            print("Adding ddl:", ddl)
            return self.add_ddl(ddl)

        if plan:
            for item in plan._plan:
                if item.item_type == TrainingPlanItem.ITEM_TYPE_DDL:
                    self.add_ddl(item.item_value)
                elif item.item_type == TrainingPlanItem.ITEM_TYPE_IS:
                    self.add_documentation(item.item_value)
                elif item.item_type == TrainingPlanItem.ITEM_TYPE_SQL:
                    self.add_question_sql(question=item.item_name, sql=item.item_value)

    def _get_databases(self) -> List[str]:
        try:
            print("Trying INFORMATION_SCHEMA.DATABASES")
            df_databases = self.run_sql("SELECT * FROM INFORMATION_SCHEMA.DATABASES")
        except Exception as e:
            print(e)
            try:
                print("Trying SHOW DATABASES")
                df_databases = self.run_sql("SHOW DATABASES")
            except Exception as e:
                print(e)
                return []

        return df_databases["DATABASE_NAME"].unique().tolist()

    def _get_information_schema_tables(self, database: str) -> pd.DataFrame:
        df_tables = self.run_sql(f"SELECT * FROM {database}.INFORMATION_SCHEMA.TABLES")

        return df_tables

    def get_training_plan_generic(self, df) -> TrainingPlan:
        """
        This method is used to generate a training plan from an information schema dataframe.

        Basically what it does is breaks up INFORMATION_SCHEMA.COLUMNS into groups of table/column descriptions that can be used to pass to the LLM.

        Args:
            df (pd.DataFrame): The dataframe to generate the training plan from.

        Returns:
            TrainingPlan: The training plan.
        """
        # For each of the following, we look at the df columns to see if there's a match:
        database_column = df.columns[
            df.columns.str.lower().str.contains("database")
            | df.columns.str.lower().str.contains("table_catalog")
        ].to_list()[0]
        schema_column = df.columns[
            df.columns.str.lower().str.contains("table_schema")
        ].to_list()[0]
        table_column = df.columns[
            df.columns.str.lower().str.contains("table_name")
        ].to_list()[0]
        column_column = df.columns[
            df.columns.str.lower().str.contains("column_name")
        ].to_list()[0]
        data_type_column = df.columns[
            df.columns.str.lower().str.contains("data_type")
        ].to_list()[0]

        plan = TrainingPlan([])

        for database in df[database_column].unique().tolist():
            for schema in (
                df.query(f'{database_column} == "{database}"')[schema_column]
                .unique()
                .tolist()
            ):
                for table in (
                    df.query(
                        f'{database_column} == "{database}" and {schema_column} == "{schema}"'
                    )[table_column]
                    .unique()
                    .tolist()
                ):
                    df_columns_filtered_to_table = df.query(
                        f'{database_column} == "{database}" and {schema_column} == "{schema}" and {table_column} == "{table}"'
                    )
                    doc = f"The following columns are in the {table} table in the {database} database:\n\n"
                    doc += df_columns_filtered_to_table[
                        [
                            database_column,
                            schema_column,
                            table_column,
                            column_column,
                            data_type_column,
                        ]
                    ].to_markdown()

                    plan._plan.append(
                        TrainingPlanItem(
                            item_type=TrainingPlanItem.ITEM_TYPE_IS,
                            item_group=f"{database}.{schema}",
                            item_name=table,
                            item_value=doc,
                        )
                    )

        return plan

    def get_training_plan_snowflake(
        self,
        filter_databases: Union[List[str], None] = None,
        filter_schemas: Union[List[str], None] = None,
        include_information_schema: bool = False,
        use_historical_queries: bool = True,
    ) -> TrainingPlan:
        plan = TrainingPlan([])

        if self.run_sql_is_set is False:
            raise ImproperlyConfigured("Please connect to a database first.")

        if use_historical_queries:
            try:
                print("Trying query history")
                df_history = self.run_sql(
                    """ select * from table(information_schema.query_history(result_limit => 5000)) order by start_time"""
                )

                df_history_filtered = df_history.query("ROWS_PRODUCED > 1")
                if filter_databases is not None:
                    mask = (
                        df_history_filtered["QUERY_TEXT"]
                        .str.lower()
                        .apply(
                            lambda x: any(
                                s in x for s in [s.lower() for s in filter_databases]
                            )
                        )
                    )
                    df_history_filtered = df_history_filtered[mask]

                if filter_schemas is not None:
                    mask = (
                        df_history_filtered["QUERY_TEXT"]
                        .str.lower()
                        .apply(
                            lambda x: any(
                                s in x for s in [s.lower() for s in filter_schemas]
                            )
                        )
                    )
                    df_history_filtered = df_history_filtered[mask]

                if len(df_history_filtered) > 10:
                    df_history_filtered = df_history_filtered.sample(10)

                for query in df_history_filtered["QUERY_TEXT"].unique().tolist():
                    plan._plan.append(
                        TrainingPlanItem(
                            item_type=TrainingPlanItem.ITEM_TYPE_SQL,
                            item_group="",
                            item_name=self.generate_question(query),
                            item_value=query,
                        )
                    )

            except Exception as e:
                print(e)

        databases = self._get_databases()

        for database in databases:
            if filter_databases is not None and database not in filter_databases:
                continue

            try:
                df_tables = self._get_information_schema_tables(database=database)

                print(f"Trying INFORMATION_SCHEMA.COLUMNS for {database}")
                df_columns = self.run_sql(
                    f"SELECT * FROM {database}.INFORMATION_SCHEMA.COLUMNS"
                )

                for schema in df_tables["TABLE_SCHEMA"].unique().tolist():
                    if filter_schemas is not None and schema not in filter_schemas:
                        continue

                    if (
                        not include_information_schema
                        and schema == "INFORMATION_SCHEMA"
                    ):
                        continue

                    df_columns_filtered_to_schema = df_columns.query(
                        f"TABLE_SCHEMA == '{schema}'"
                    )

                    try:
                        tables = (
                            df_columns_filtered_to_schema["TABLE_NAME"]
                            .unique()
                            .tolist()
                        )

                        for table in tables:
                            df_columns_filtered_to_table = (
                                df_columns_filtered_to_schema.query(
                                    f"TABLE_NAME == '{table}'"
                                )
                            )
                            doc = f"The following columns are in the {table} table in the {database} database:\n\n"
                            doc += df_columns_filtered_to_table[
                                [
                                    "TABLE_CATALOG",
                                    "TABLE_SCHEMA",
                                    "TABLE_NAME",
                                    "COLUMN_NAME",
                                    "DATA_TYPE",
                                    "COMMENT",
                                ]
                            ].to_markdown()

                            plan._plan.append(
                                TrainingPlanItem(
                                    item_type=TrainingPlanItem.ITEM_TYPE_IS,
                                    item_group=f"{database}.{schema}",
                                    item_name=table,
                                    item_value=doc,
                                )
                            )

                    except Exception as e:
                        print(e)
                        pass
            except Exception as e:
                print(e)

        print(f"plan : {plan}")
        return plan
