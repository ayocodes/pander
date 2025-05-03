/**
 * Date-Aware Automated Poll Resolution System
 * Uses Exa.ai for search and OpenRouter for analysis
 * Properly handles date references based on poll creation date
 */

import Exa from "exa-js";
import dotenv from "dotenv";

dotenv.config();

// Initialize Exa client
const exa = new Exa(process.env.EXASEARCH_API_KEY || "");

// Types
interface ResolutionResult {
  winningPosition: boolean;
  confidence: number;
  sources: string[];
  reasoning: string;
}

/**
 * Core function to resolve a poll using Exa.ai and OpenRouter
 * Now accepts startDate parameter to properly handle date references
 */
export async function resolveWithAI(
  question: string,
  startDate?: number
): Promise<ResolutionResult> {
  try {
    // 1. Format the question for better searching using the start date
    const referenceDate = startDate ? new Date(startDate) : undefined;
    const formattedQuery = formatSearchQuery(question, referenceDate);
    console.log(`Reformatted query: "${formattedQuery}"`);

    // 2. Search for information using Exa
    const searchResult = await exa.searchAndContents(formattedQuery, {
      type: "auto",
      text: true,
      numResults: 10,
    });

    // 3. Prepare the context for LLM analysis
    // Collect source information for analysis
    const sourcesInfo = searchResult.results
      .map((r, i) => {
        const text = r.text?.slice(0, 500) || "";
        return `Source ${i + 1}: ${r.title || "Untitled"} - ${
          r.url
        }\nExcerpt: ${text}\n`;
      })
      .join("\n");

    console.log(`source info from exa: ${sourcesInfo}`);

    // 4. Send to OpenRouter for analysis
    const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: [
            {
              role: "user",
              content: `Based on these search results, and result on net, answer the following question with Yes or No:

Original question: "${question}"
Search query used: "${formattedQuery}"
${
  referenceDate
    ? `Poll creation date: ${referenceDate.toISOString().split("T")[0]}`
    : ""
}

Search results:
${sourcesInfo}

Provide your answer in this exact format:
ANSWER: [Yes/No]
CONFIDENCE: [number between 50-100]
REASONING: [Brief explanation]`,
            },
          ],
        }),
      }
    );

    // 5. Process the response
    const data = await response.json();
    const analysisText = data.choices[0].message.content || "";

    // 6. Parse the analysis
    const answerMatch = /ANSWER:\s*(Yes|No)/i.exec(analysisText);
    const confidenceMatch = /CONFIDENCE:\s*(\d+)/i.exec(analysisText);
    const reasoningMatch = /REASONING:\s*(.*)/i.exec(analysisText);

    // 7. Create the final result
    return {
      winningPosition: answerMatch?.[1].toLowerCase() === "yes" || false,
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.5,
      sources: searchResult.results.map((r) => r.url),
      reasoning: reasoningMatch?.[1] || "No specific reasoning provided",
    };
  } catch (error) {
    console.error(`Error resolving poll: ${error}`);

    // Fallback to simple resolution if LLM analysis fails
    return fallbackResolution(question, startDate);
  }
}

/**
 * Format the poll question for better searching
 * Now handles date references based on poll creation date
 */
function formatSearchQuery(question: string, referenceDate?: Date): string {
  question = question.trim().replace(/\?/g, "");

  // Use provided reference date or current date
  const baseDate = referenceDate || new Date();

  // Basic replacements - convert future tense to past tense
  if (question.toLowerCase().includes("will ")) {
    question = question.replace(/will /i, "did ");
  }

  // Handle relative date references
  // "yesterday" = the day before reference date
  if (question.toLowerCase().includes("yesterday")) {
    const yesterday = new Date(baseDate);
    yesterday.setDate(baseDate.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    question = question.replace(/yesterday/i, `on ${yesterdayStr}`);
  }

  // "tomorrow" = the day after reference date
  if (question.toLowerCase().includes("tomorrow")) {
    const tomorrow = new Date(baseDate);
    tomorrow.setDate(baseDate.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    question = question.replace(/tomorrow/i, `on ${tomorrowStr}`);
  }

  // "today" = the reference date
  if (question.toLowerCase().includes("today")) {
    const todayStr = baseDate.toISOString().split("T")[0];
    question = question.replace(/today/i, `on ${todayStr}`);
  }

  // "this week" = the week of the reference date
  if (question.toLowerCase().includes("this week")) {
    const weekStr = baseDate.toISOString().split("T")[0];
    question = question.replace(/this week/i, `in the week of ${weekStr}`);
  }

  // "this month" = the month of the reference date
  if (question.toLowerCase().includes("this month")) {
    const monthName = baseDate.toLocaleString("default", { month: "long" });
    const year = baseDate.getFullYear();
    question = question.replace(/this month/i, `in ${monthName} ${year}`);
  }

  // Add date reference if needed for questions without specific time markers
  if (
    !question.includes(" on ") &&
    !question.includes(" in ") &&
    !question.includes(" by ") &&
    !question.includes(" during ") &&
    !question.includes(" at ")
  ) {
    // Default to day after reference date for future-oriented questions
    const defaultDate = new Date(baseDate);
    defaultDate.setDate(baseDate.getDate() + 1); // For "will" questions, look at the day after
    question += ` on ${defaultDate.toISOString().split("T")[0]}`;
  }

  return question;
}

/**
 * Simple fallback resolution method using Exa.ai summary approach
 * Now handles date references
 */
async function fallbackResolution(
  question: string,
  startDate?: number
): Promise<ResolutionResult> {
  const referenceDate = startDate ? new Date(startDate) : undefined;
  const formattedQuery = formatSearchQuery(question, referenceDate);

  // Execute search with summary request
  const result = await exa.searchAndContents(formattedQuery, {
    type: "auto",
    summary: {
      query: `Give me only a Yes or No answer, nothing else. ${formattedQuery}`,
    },
    numResults: 10,
  });

  // Extract the summary results
  const responses = result.results
    .filter((r) => r.summary)
    .map((r) => (r.summary || "").trim().toLowerCase());

  // Aggregate responses - simple majority rule
  const yesCount = responses.filter((r) => r === "yes").length;
  const noCount = responses.filter((r) => r === "no").length;
  const totalResponses = yesCount + noCount;

  // Calculate confidence as a percentage of agreeing sources
  const confidence =
    totalResponses > 0 ? Math.max(yesCount, noCount) / totalResponses : 0.5;

  // Determine the winning position
  const winningPosition = yesCount > noCount;

  return {
    winningPosition,
    confidence,
    sources: result.results.map((r) => r.url),
    reasoning: `Based on direct source summaries: ${yesCount} Yes votes vs ${noCount} No votes.`,
  };
}

/**
 * Manual resolution function for the admin interface
 */
export async function manuallyResolvePollWithAI(
  question: string,
  startDate?: number
): Promise<ResolutionResult> {
  return resolveWithAI(question, startDate);
}
