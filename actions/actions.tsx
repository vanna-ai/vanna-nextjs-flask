"use server";
import axios from "axios";

export async function generateQuestions() {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/generate_questions`
  );
  return response.data;
}

export async function generateSQL(question: string) {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/generate_sql`,
    {
      params: { question },
    }
  );
  return response.data;
}

export async function runSQL(sql: string) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/run_sql`,
    { sql }, // Encapsulate the SQL string in an object
    {
      headers: {
        "Content-Type": "application/json", // This line is technically optional as Axios sets it automatically for objects
      },
    }
  );

  console.log("run", response.data);

  return response.data;
}
