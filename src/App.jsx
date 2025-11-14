import { useState, useEffect } from "react";
import OpenAI from "openai";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/verify", {
          credentials: "include", // Important: sends cookies
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.authenticated === true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: sends and receives cookies
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setPassword("");
      } else {
        setPasswordError(data.error || "Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (error) {
      console.error("Auth error:", error);
      setPasswordError("Error connecting to server. Please try again.");
    }
  };

  const parseQuestions = (text) => {
    const questions = [];
    const lines = text.split("\n").filter((line) => line.trim());

    let currentQuestion = null;
    let currentAnswers = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // Check if line is a question (starts with number, Q, or Question, or ends with ?)
      if (trimmed.match(/^(\d+[.)]\s*|Q\d+[:.]\s*|Question\s+\d+[:.]\s*)/i)) {
        // Save previous question if exists (accept 2+ answers for this-or-that, 10 for scale, 4+ for others)
        if (currentQuestion && currentAnswers.length >= 2) {
          questions.push({
            question: currentQuestion,
            answers: currentAnswers,
          });
        }
        // Start new question - remove the prefix
        currentQuestion = trimmed
          .replace(/^(\d+[.)]\s*|Q\d+[:.]\s*|Question\s+\d+[:.]\s*)/i, "")
          .trim();
        currentAnswers = [];
      }
      // Check if line is an answer option (starts with letter a-z, dash, bullet, or number)
      else if (
        trimmed.match(/^([a-z][.)]\s*|[-•*]\s*|\d+[.)]\s*)/i) &&
        trimmed.length < 200
      ) {
        const answer = trimmed
          .replace(/^([a-z][.)]\s*|[-•*]\s*|\d+[.)]\s*)/i, "")
          .trim();
        if (answer && currentQuestion) {
          currentAnswers.push(answer);
        }
      }
      // Special handling for scale questions - if we see "1" through "10" as separate lines
      else if (
        currentQuestion &&
        /^(\d+)$/.test(trimmed) &&
        parseInt(trimmed) >= 1 &&
        parseInt(trimmed) <= 10
      ) {
        currentAnswers.push(trimmed);
      }
      // If line ends with ? and we don't have a current question, it might be a question
      else if (
        trimmed.endsWith("?") &&
        trimmed.length > 15 &&
        !currentQuestion
      ) {
        currentQuestion = trimmed;
        currentAnswers = [];
      }
      // If we have a question but no answers yet, and this line looks like an answer
      else if (
        currentQuestion &&
        currentAnswers.length === 0 &&
        trimmed.length < 200 &&
        !trimmed.endsWith("?")
      ) {
        // Might be an answer without a prefix
        currentAnswers.push(trimmed);
      }
    }

    // Add last question if it has at least 2 answers
    if (currentQuestion && currentAnswers.length >= 2) {
      questions.push({
        question: currentQuestion,
        answers: currentAnswers,
      });
    }

    return questions;
  };

  const generateQuestions = async () => {
    setLoading(true);
    setError("");
    setQuestions([]);

    try {
      const today = new Date();
      const dateStr = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a creative assistant that generates fun, engaging survey questions for office whiteboards. Your questions should be pop-culture themed, lighthearted, comical, and spark conversation among coworkers. You MUST always generate exactly 4 questions. At least one question MUST be a 'scale of 1-10' question (e.g., 'On a scale of 1-10, how do you...'). Mix different question types: preference questions (this or that), scale questions (1-10), and some with whimsical, comical answer options.",
          },
          {
            role: "user",
            content: `Generate exactly 4 fun, diverse survey questions for an office whiteboard. Today's date is ${dateStr} - you can reference it for some questions, but mix in other types too.

REQUIREMENTS:
- You MUST generate exactly 4 questions - no more, no less
- At least ONE question MUST be a "scale of 1-10" question (e.g., "On a scale of 1-10, how do you feel about...?" or "Rate from 1-10 how much you...")
- Create a variety:
  * Some "this or that" preference questions (2 options)
  * At least one scale question asking "On a scale of 1-10, how do you..." (answer options: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
  * Some comical questions with whimsical, funny answer options (4-5 options)
- Mix pop-culture references, office humor, and lighthearted topics

Format your response EXACTLY like this:
1. [Question text?]
a) Option 1
b) Option 2
(For this-or-that: just 2 options. For scale questions: list 1, 2, 3, 4, 5, 6, 7, 8, 9, 10. For others: 4-5 options)

2. [Question text?]
a) Option 1
b) Option 2
c) Option 3
d) Option 4

3. [Question text?]
1
2
3
4
5
6
7
8
9
10

4. [Question text?]
a) Option 1
b) Option 2
c) Option 3
d) Option 4
e) Option 5

Remember: Always generate exactly 4 questions, and at least one must be a "scale of 1-10" question!`,
          },
        ],
        temperature: 0.95,
        max_tokens: 1000,
      });

      const generatedText = completion.choices[0]?.message?.content?.trim();
      if (generatedText) {
        const parsedQuestions = parseQuestions(generatedText);
        if (parsedQuestions.length === 4) {
          setQuestions(parsedQuestions);
        } else if (parsedQuestions.length > 0) {
          // If we got some questions but not exactly 4, take the first 4 or pad if needed
          if (parsedQuestions.length > 4) {
            setQuestions(parsedQuestions.slice(0, 4));
          } else {
            // If we got less than 4, still show what we have but log a warning
            console.warn(
              `Expected 4 questions but got ${parsedQuestions.length}`
            );
            setQuestions(parsedQuestions);
          }
        } else {
          // Fallback: try to parse differently or show raw text
          console.log("Raw response:", generatedText);
          setError("Failed to parse questions. Please try again.");
        }
      } else {
        setError("Failed to generate questions. Please try again.");
      }
    } catch (err) {
      console.error("Error generating questions:", err);
      setError(
        err.message ||
          "Failed to generate questions. Please check your API key and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (question, answers) => {
    const isScaleQuestion = answers.length === 10 && /^\d+$/.test(answers[0]);
    let text;
    if (isScaleQuestion) {
      text = `${question}\nRate 1-10`;
    } else {
      text = `${question}\n${answers
        .map((a, i) => `${String.fromCharCode(97 + i)}) ${a}`)
        .join("\n")}`;
    }
    navigator.clipboard.writeText(text);
  };

  // Show loading state while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3">
              Office Poller
            </h1>
            <p className="text-gray-600">
              Please enter the password to continue
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                autoFocus
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3">
              Office Poller
            </h1>
            <p className="text-gray-600 text-lg">
              Generate fun, pop-culture-themed survey questions for your office
              whiteboard
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="mb-8">
            <button
              onClick={generateQuestions}
              disabled={loading}
              className="w-full md:w-auto mx-auto block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating Questions...
                </span>
              ) : (
                "✨ Generate 4 Questions"
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {questions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questions.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex-1">
                      {item.question}
                    </h2>
                    <button
                      onClick={() =>
                        copyToClipboard(item.question, item.answers)
                      }
                      className="text-purple-600 hover:text-purple-800 transition-colors ml-2 flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div>
                    {(() => {
                      const isScaleQuestion =
                        item.answers.length === 10 &&
                        /^\d+$/.test(item.answers[0]);
                      if (isScaleQuestion) {
                        return (
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-gray-600 mr-2">
                              Rate:
                            </span>
                            {item.answers.map((answer, answerIndex) => (
                              <span
                                key={answerIndex}
                                className="text-purple-600 font-medium px-2 py-1 bg-purple-50 rounded"
                              >
                                {answer}
                              </span>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="space-y-2">
                            {item.answers.map((answer, answerIndex) => {
                              const label = String.fromCharCode(
                                97 + answerIndex
                              );
                              return (
                                <div
                                  key={answerIndex}
                                  className="flex items-start"
                                >
                                  <span className="text-purple-600 font-medium mr-2 mt-1">
                                    {label})
                                  </span>
                                  <span className="text-gray-700">
                                    {answer}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {questions.length === 0 && !loading && !error && (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">
                Click the button above to generate 4 fun survey questions!
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Powered by OpenAI • Questions generated based on today's date</p>
        </div>
      </div>
    </div>
  );
}

export default App;
