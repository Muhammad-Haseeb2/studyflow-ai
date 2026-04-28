import { LegalLayout } from "./LegalLayout";

export default function About() {
  return (
    <LegalLayout title="About Studyflow">
      <p>
        Studyflow is an AI-powered study companion built to help students learn faster, stay organized,
        and study with focus. It brings together quizzes, flashcards, mind maps, voice tutoring,
        essay writing, assignment generation, notes, calendars, and a focus timer in a single calm workspace.
      </p>
      <h2>Our mission</h2>
      <p>
        Make high-quality, personalized learning available to every student — regardless of school, language, or budget.
      </p>
      <h2>Built by</h2>
      <p>
        Studyflow is built and maintained by <strong>Muhammad Haseeb</strong>.
        Reach out at <a href="mailto:itxhaseeb36@gmail.com">itxhaseeb36@gmail.com</a> or on{" "}
        <a href="https://www.linkedin.com/in/muhammad-haseeb-hsb" target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>.
      </p>
    </LegalLayout>
  );
}
