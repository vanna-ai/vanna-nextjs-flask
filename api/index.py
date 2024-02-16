from dotenv import load_dotenv
from functools import wraps
from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import flask
import os
from helpers.cache import MemoryCache
from vanna.remote import VannaDefault

load_dotenv()
app = Flask(__name__, static_url_path="")
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

# SETUP
cache = MemoryCache()

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


# NO NEED TO CHANGE ANYTHING BELOW THIS LINE
def requires_cache(fields):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            new_id = request.args.get("id")

            if new_id is None:
                return jsonify({"type": "error", "error": "No id provided"})

            for field in fields:
                if cache.get(id=new_id, field=field) is None:
                    return jsonify({"type": "error", "error": f"No {field} found"})

            field_values = {
                field: cache.get(id=new_id, field=field) for field in fields
            }

            # Add the id to the field_values
            field_values["id"] = new_id

            return f(*args, **field_values, **kwargs)

        return decorated

    return decorator


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
    question = flask.request.args.get("question")

    if question is None:
        return jsonify({"type": "error", "error": "No question provided"})

    new_id = cache.generate_id(question=question)
    sql = vn.generate_sql(question=question)

    cache.set(id=new_id, field="question", value=question)
    cache.set(id=new_id, field="sql", value=sql)

    return jsonify(
        {
            "type": "sql",
            "id": new_id,
            "text": sql,
        }
    )


@app.route("/api/v1/run_sql", methods=["GET"])
@requires_cache(["sql"])
def run_sql(id: str, sql: str):
    try:
        df = vn.run_sql(sql=sql)

        cache.set(id=id, field="df", value=df)

        return jsonify(
            {
                "type": "df",
                "id": id,
                "df": df.head(10).to_json(orient="records"),
            }
        )

    except Exception as e:
        return jsonify({"type": "error", "error": str(e)})


@app.route("/api/v1/download_csv", methods=["GET"])
@requires_cache(["df"])
def download_csv(id: str, df):
    csv = df.to_csv()

    return Response(
        csv,
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename={id}.csv"},
    )


@app.route("/api/v1/generate_plotly_figure", methods=["GET"])
@requires_cache(["df", "question", "sql"])
def generate_plotly_figure(id: str, df, question, sql):
    try:
        code = vn.generate_plotly_code(
            question=question,
            sql=sql,
            df=f"Running df.dtypes gives:\n {df.dtypes}",
        )
        fig = vn.get_plotly_figure(plotly_code=code, df=df, dark_mode=False)
        fig_json = fig.to_json()

        cache.set(id=id, field="fig_json", value=fig_json)

        return jsonify(
            {
                "type": "plotly_figure",
                "id": id,
                "fig": fig_json,
            }
        )
    except Exception as e:
        # Print the stack trace
        import traceback

        traceback.print_exc()

        return jsonify({"type": "error", "error": str(e)})


@app.route("/api/v1/get_training_data", methods=["GET"])
def get_training_data():
    df = vn.get_training_data()

    return jsonify(
        {
            "type": "df",
            "id": "training_data",
            "df": df.head(25).to_json(orient="records"),
        }
    )


@app.route("/api/v1/remove_training_data", methods=["POST"])
def remove_training_data():
    # Get id from the JSON body
    new_id = flask.request.json.get("id")

    if id is None:
        return jsonify({"type": "error", "error": "No id provided"})

    if vn.remove_training_data(id=new_id):
        return jsonify({"success": True})
    else:
        return jsonify({"type": "error", "error": "Couldn't remove training data"})


@app.route("/api/v1/train", methods=["POST"])
def add_training_data():
    question = flask.request.json.get("question")
    sql = flask.request.json.get("sql")
    ddl = flask.request.json.get("ddl")
    documentation = flask.request.json.get("documentation")

    try:
        new_id = vn.train(
            question=question, sql=sql, ddl=ddl, documentation=documentation
        )

        return jsonify({"id": new_id})
    except Exception as e:
        print("TRAINING ERROR", e)
        return jsonify({"type": "error", "error": str(e)})


@app.route("/api/v1/generate_followup_questions", methods=["GET"])
@requires_cache(["df", "question"])
def generate_followup_questions(id: str, df, question):
    followup_questions = vn.generate_followup_questions(question=question, df=df)

    cache.set(id=id, field="followup_questions", value=followup_questions)

    return jsonify(
        {
            "type": "question_list",
            "id": id,
            "questions": followup_questions,
            "header": "Here are some followup questions you can ask:",
        }
    )


@app.route("/api/v1/load_question", methods=["GET"])
@requires_cache(["question", "sql", "df", "fig_json", "followup_questions"])
def load_question(id: str, question, sql, df, fig_json, followup_questions):
    try:
        return jsonify(
            {
                "type": "question_cache",
                "id": id,
                "question": question,
                "sql": sql,
                "df": df.head(10).to_json(orient="records"),
                "fig": fig_json,
                "followup_questions": followup_questions,
            }
        )

    except Exception as e:
        return jsonify({"type": "error", "error": str(e)})


@app.route("/api/v1/get_question_history", methods=["GET"])
def get_question_history():
    return jsonify(
        {
            "type": "question_history",
            "questions": cache.get_all(field_list=["question"]),
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
