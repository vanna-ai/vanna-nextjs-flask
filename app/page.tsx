import Dashboard from "@/components/Dashboard";
import { generateQuestions } from "@/actions/actions";
export default async function Home() {
  return <Dashboard generateQuestions={generateQuestions} />;
}
