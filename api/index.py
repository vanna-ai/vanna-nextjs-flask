from dotenv import load_dotenv
from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import pandas as pd
import os
from vanna.remote import VannaDefault

load_dotenv()
app = Flask(__name__, static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# VANNA INITIALIZATION
vannakey = os.environ.get("VANNA_API_KEY")
account = os.environ.get("SNOWFLAKE_ACCOUNT")
username = os.environ.get("SNOWFLAKE_USERNAME")
password = os.environ.get("SNOWFLAKE_PASSWORD")
database = os.environ.get("SNOWFLAKE_DATABASE")
role = os.environ.get("SNOWFLAKE_ROLE")
model = os.environ.get("VANNA_MODEL")
vn = VannaDefault(model=model, api_key=vannakey)
vn.connect_to_snowflake(
    account=account, username=username, password=password, database=database, role=role
)


@app.route("/api/v1/generate_questions", methods=["GET"])
def generate_questions():
    return jsonify(
        {
            "type": "question_list",
            "questions": vn.generate_questions(),
            "header": "Here are some questions you can ask:",
        }
    )


@app.route("/api/v1/generate_sql", methods=["GET"])
def generate_sql():
    question = request.args.get("question")
    if question is None:
        return jsonify({"type": "error", "error": "No question provided"})
    sql = vn.generate_sql(question=question)
    return jsonify({"type": "sql", "text": sql})


@app.route("/api/v1/run_sql", methods=["POST"])
def run_sql():
    data = request.json
    sql = data.get("sql")
    if sql is None:
        return jsonify({"type": "error", "error": "No SQL query provided"})
    try:
        df = vn.run_sql(sql=sql)
        return jsonify({"type": "df", "df": df.head(10).to_json(orient="records")})
    except Exception as e:
        return jsonify({"type": "error", "error": str(e)})


@app.route("/api/v1/download_csv", methods=["POST"])
def download_csv():
    data = request.json
    df_json = data.get("df")
    if df_json is None:
        return jsonify({"type": "error", "error": "No DataFrame provided"})
    df = pd.read_json(df_json, orient="records")
    csv = df.to_csv(index=False)
    return Response(
        csv,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=data.csv"},
    )


@app.route("/api/v1/generate_plotly_figure", methods=["POST"])
def generate_plotly_figure():
    data = request.json
    df_json = data.get("df")
    question = data.get("question")
    sql = data.get("sql")
    if not df_json or not question or not sql:
        return jsonify(
            {"type": "error", "error": "Missing data for generating plotly figure"}
        )
    df = pd.read_json(df_json, orient="records")
    # Placeholder logic, replace with your actual method calls
    fig_json = '{"placeholder": true}'  # Placeholder response
    return jsonify({"type": "plotly_figure", "fig": fig_json})


@app.route("/api/v1/get_training_data", methods=["GET"])
def get_training_data():
    # Placeholder logic, replace with your actual method call to fetch training data
    df = pd.DataFrame()  # Placeholder DataFrame
    return jsonify({"type": "df", "df": df.head(25).to_json(orient="records")})


@app.route("/api/v1/remove_training_data", methods=["POST"])
def remove_training_data():
    data = request.json
    id = data.get("id")
    if id is None:
        return jsonify({"type": "error", "error": "No id provided"})
    # Placeholder logic, replace with actual call to remove training data
    success = True  # Placeholder for actual success/failure response
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"type": "error", "error": "Couldn't remove training data"})


@app.route("/api/v1/train", methods=["POST"])
def add_training_data():
    data = request.json
    question = data.get("question")
    sql = data.get("sql")
    ddl = data.get("ddl")
    documentation = data.get("documentation")
    try:
        new_id = vn.train(
            question=question, sql=sql, ddl=ddl, documentation=documentation
        )
        return jsonify({"id": new_id})
    except Exception as e:
        return jsonify({"type": "error", "error": str(e)})


@app.route("/api/v1/generate_followup_questions", methods=["POST"])
def generate_followup_questions():
    data = request.json
    df_json = data.get("df")
    question = data.get("question")
    if not df_json or not question:
        return jsonify(
            {"type": "error", "error": "Missing data for generating followup questions"}
        )
    df = pd.read_json(df_json, orient="records")
    # Placeholder logic for generating followup questions
    followup_questions = [
        "What is the next question?",
        "Another followup question?",
    ]  # Placeholder
    return jsonify(
        {
            "type": "question_list",
            "questions": followup_questions,
            "header": "Followup questions:",
        }
    )


@app.route("/api/v1/load_question", methods=["POST"])
def load_question():
    data = request.json
    # Assuming the necessary data is question, sql, df_json (as a string), and optionally fig_json and followup_questions
    question = data.get("question")
    sql = data.get("sql")
    df_json = data.get("df")
    fig_json = data.get("fig_json", "{}")  # Default to empty JSON if not provided
    followup_questions = data.get("followup_questions", [])
    if not question or not sql or not df_json:
        return jsonify({"type": "error", "error": "Missing required data"})
    # No actual loading as this is a stateless example; just echoing back for demonstration
    return jsonify(
        {
            "type": "question_data",
            "question": question,
            "sql": sql,
            "df": df_json,
            "fig": fig_json,
            "followup_questions": followup_questions,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
