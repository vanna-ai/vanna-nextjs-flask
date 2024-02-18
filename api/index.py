from dotenv import load_dotenv
from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import pandas as pd
import os
from dependencies.vanna import VannaDefault
import sys

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
    print({database})
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
    sql = request.args.get("sql")
    print(sql)
    if sql is None:
        return jsonify({"type": "error", "error": "No SQL query provided", "sql": sql})
    try:
        df = vn.run_sql(sql=sql)
        return jsonify({"type": "df", "df": df.head(10).to_json(orient="records")})
    except Exception as e:
        return jsonify({"type": "error", "error": str(e)})


@app.route("/api/v1/download_csv", methods=["POST"])
def download_csv():
    data = request.get_json()
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


@app.route("/api/v1/get_training_data", methods=["GET"])
def get_training_data():
    df = vn.get_training_data()

    print(df, file=sys.stderr)
    return jsonify(
        {
            "type": "df",
            "id": "training_data",
            "df": df.head(25).to_json(orient="records"),
        }
    )


@app.route("/api/v1/remove_training_data", methods=["POST"])
def remove_training_data():
    data = request.json
    new_id = data.get("id")
    if new_id is None:
        return jsonify({"type": "error", "error": "No id provided"})
    # Placeholder logic, replace with actual call to remove training data
    if vn.remove_training_data(id=new_id):
        return jsonify({"success": True})
    else:
        return jsonify({"type": "error", "error": "Couldn't remove training data"})


@app.route("/api/v1/train", methods=["POST"])
def add_training_data():
    data = request.get_json()
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


@app.route("/api/v1/load_question", methods=["POST"])
def load_question():
    data = request.get_json()
    question = data.get("question")
    sql = data.get("sql")
    df_json = data.get("df")
    fig_json = data.get("fig_json", "{}")
    followup_questions = data.get("followup_questions", [])
    if not question or not sql or not df_json:
        return jsonify({"type": "error", "error": "Missing required data"})

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
