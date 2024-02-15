"use server";
import axios from "axios";

export async function generateQuestions() {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/generate_questions`
  );
  return response.data; // Directly return the data part of the response
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

export async function runSQL(id: string) {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/run_sql`,
    {
      params: { id },
    }
  );
  return response.data;
}
