import { LegalLayout } from "./LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated={new Date().toLocaleDateString()}>
      <p>
        Your privacy matters. This page explains what Studyflow collects, why, and your choices.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data</strong> — email, display name, and profile picture (if you upload one).</li>
        <li><strong>Study content</strong> — notes, flashcards, quizzes, assignments, calendar events, and timer sessions you create.</li>
        <li><strong>Usage data</strong> — basic logs needed to keep the service reliable and secure.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To provide and improve the features you use.</li>
        <li>To save your work so it's available across sessions and devices.</li>
        <li>To send AI requests on your behalf to our AI provider for the feature you triggered.</li>
      </ul>
      <h2>What we don't do</h2>
      <ul>
        <li>We don't sell your personal data.</li>
        <li>We don't share your study content with third parties for advertising.</li>
      </ul>
      <h2>Your choices</h2>
      <ul>
        <li>You can delete any note, quiz, flashcard, assignment, or session at any time.</li>
        <li>You can request full account deletion by emailing us.</li>
      </ul>
      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:itxhaseeb36@gmail.com">itxhaseeb36@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
