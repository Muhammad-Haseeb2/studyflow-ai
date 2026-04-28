import { LegalLayout } from "./LegalLayout";

export default function Terms() {
  return (
    <LegalLayout title="Terms & Conditions" updated={new Date().toLocaleDateString()}>
      <p>
        By creating an account or using Studyflow, you agree to these terms.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Use Studyflow for personal study and learning.</li>
        <li>Don't attempt to abuse, attack, or reverse-engineer the service.</li>
        <li>Don't generate content that is illegal, harmful, or violates others' rights.</li>
      </ul>
      <h2>AI-generated content</h2>
      <p>
        AI features can make mistakes. Always review AI-generated quizzes, essays, notes, and answers
        before relying on them for graded work.
      </p>
      <h2>Account</h2>
      <p>
        You're responsible for keeping your login credentials safe. Notify us immediately if you
        suspect unauthorized access.
      </p>
      <h2>Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these terms. You can delete your account at any time.
      </p>
      <h2>Changes</h2>
      <p>
        We may update these terms occasionally. Continued use after changes means you accept the updated terms.
      </p>
      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:itxhaseeb36@gmail.com">itxhaseeb36@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
