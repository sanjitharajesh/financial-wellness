import React, { useMemo, useState } from "react";
import { submitAssessment } from "../api";
import { activeFields, shouldShowDebtQuestion, shouldShowIncomeStability } from "../scoring";

const PERSONAS = [
  {
    value: "starting_out",
    label: "Just starting out, first job, building habits",
  },
  {
    value: "tight",
    label: "Getting by but it's tight, income comes in, not much stays",
  },
  {
    value: "rough_patch",
    label: "Hit a rough patch, unexpected expense or income drop",
  },
  {
    value: "doing_okay",
    label: "Doing okay, want to understand my risks better",
  },
];

function buildSections(profile) {
  const showQ2 = shouldShowIncomeStability(profile);
  const showQ5 = shouldShowDebtQuestion(profile);

  const emergencyQuestions = [];
  if (showQ2) {
    emergencyQuestions.push({
      key: "q2_income_stability",
      label: "How predictable is your income month to month?",
      why: "Stable income changes how much cushion you need and how tight your budget can be.",
      options: [
        { value: "very_consistent", label: "Very consistent" },
        { value: "mostly_consistent", label: "Mostly consistent, some variation" },
        { value: "varies_lot", label: "Varies a lot" },
        { value: "unpredictable_gig", label: "Unpredictable gig or contract work" },
      ],
    });
  }
  if (showQ5) {
    emergencyQuestions.push({
      key: "q5_debt",
      label: "How would you describe your student loan or overall debt situation?",
      why: "Early-career debt shapes cash flow and how fast you can build a safety net.",
      options: [
        { value: "none_significant", label: "No significant debt" },
        { value: "manageable_plan", label: "Manageable, on a plan" },
        { value: "stressful_payments", label: "Stressful but making payments" },
        { value: "behind", label: "Behind on payments" },
      ],
    });
  }
  emergencyQuestions.push(
    {
      key: "q6_emergency_resilience",
      label: "Your car breaks down and the repair costs $900. What happens?",
      why: "Typical surprise costs test whether savings and credit habits work in real life.",
      options: [
        { value: "savings_easily", label: "Cover it from savings easily" },
        { value: "card_pay_next", label: "Put it on a card, pay it off next month" },
        { value: "borrow_bnpl", label: "Would need to borrow or use BNPL" },
        { value: "dont_know", label: "Genuinely don't know what I'd do" },
      ],
    },
    {
      key: "q7_emergency_buffer",
      label: "How many months could you cover your expenses if you lost your income tomorrow?",
      why: "Your runway determines how long you can handle a job loss or health shock.",
      options: [
        { value: "three_plus", label: "3 or more months" },
        { value: "one_to_two", label: "1 to 2 months" },
        { value: "less_than_month", label: "Less than a month" },
        { value: "havent_thought", label: "I haven't thought about it" },
      ],
    }
  );

  return [
    {
      title: "Banking Access",
      subtitle: "Cash rhythm and liquidity",
      questions: [
        {
          key: "q1_cash_flow",
          label:
            "After rent, bills, and necessities, what's typically left at the end of the month?",
          why: "Leftover cash is the lever for savings, investing, and weathering shocks.",
          options: [
            { value: "save_comfortable", label: "Enough to save comfortably" },
            { value: "little_inconsistent", label: "A little, but nothing consistent" },
            { value: "barely_anything", label: "Barely anything" },
            { value: "come_up_short", label: "I usually come up short" },
          ],
        },
      ],
    },
    {
      title: "Emergency Preparedness",
      subtitle: "Resilience when life happens",
      questions: emergencyQuestions,
    },
    {
      title: "Spending Behavior",
      subtitle: "Credit and buy-now-pay-later",
      questions: [
        {
          key: "q3_credit_behavior",
          label: "Your credit card bill comes. What usually happens?",
          why: "Revolving balances are one of the fastest paths to stressed cash flow.",
          options: [
            { value: "paid_full", label: "Paid in full every month" },
            { value: "more_than_min", label: "Pay more than minimum but not all" },
            { value: "minimum", label: "Pay the minimum" },
            { value: "no_cc", label: "I don't have a credit card" },
          ],
        },
        {
          key: "q4_bnpl",
          label: "Do you currently have active Buy Now Pay Later plans (Klarna, Afterpay, Affirm)?",
          why: "Stacked installments can quietly consume next month's income.",
          options: [
            { value: "none", label: "No" },
            { value: "one_active", label: "One active plan" },
            { value: "two_plus", label: "Two or more active" },
            { value: "regular_large", label: "I use it regularly for large purchases" },
          ],
        },
      ],
    },
    {
      title: "Financial Literacy",
      subtitle: "Awareness and saving habits",
      questions: [
        {
          key: "q8_money_awareness",
          label: "How often do you actively check your bank balance or track spending?",
          why: "Visibility helps you steer before small leaks become debt.",
          options: [
            { value: "daily", label: "Daily or regularly" },
            { value: "weekly", label: "Weekly" },
            { value: "rarely_avoid", label: "Rarely, I avoid it" },
            { value: "dont_track", label: "I don't track it at all" },
          ],
        },
        {
          key: "q9_savings_behavior",
          label: "Do you set money aside each month intentionally, or does saving happen when there's leftover?",
          why: "Intentional saving beats hope, especially when income is uneven.",
          options: [
            { value: "automatic", label: "Automatic transfers set up" },
            { value: "intentional_manual", label: "Intentional but manual" },
            { value: "leftover_only", label: "Only when there's leftover" },
            { value: "rarely_never", label: "Rarely or never" },
          ],
        },
      ],
    },
  ];
}

export default function AssessmentForm({ profile, onComplete }) {
  const [phase, setPhase] = useState("persona");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const SECTIONS = useMemo(() => buildSections(profile), [profile]);
  const totalScored = useMemo(
    () => SECTIONS.reduce((n, s) => n + s.questions.length, 0),
    [SECTIONS]
  );
  const requiredKeys = useMemo(() => activeFields(profile), [profile]);

  const section = SECTIONS[sectionIndex];
  const question = section?.questions[questionIndex];
  const isLastSection = sectionIndex === SECTIONS.length - 1;
  const isLastQuestion = question && questionIndex === section.questions.length - 1;

  const questionsBefore =
    SECTIONS.slice(0, sectionIndex).reduce((n, s) => n + s.questions.length, 0) + questionIndex;
  const progressPct =
    phase === "persona" ? 0 : Math.round((questionsBefore / Math.max(totalScored, 1)) * 100);

  const handlePersonaSelect = (value) => {
    setAnswers((prev) => ({ ...prev, persona: value }));
  };

  const handleSelect = (value) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
  };

  const buildPayload = () => {
    const payload = { persona: answers.persona };
    requiredKeys.forEach((k) => {
      payload[k] = answers[k] || "";
    });
    return payload;
  };

  const handleNext = async () => {
    if (phase === "persona") {
      setPhase("questions");
      return;
    }
    if (!isLastQuestion) {
      setQuestionIndex((i) => i + 1);
    } else if (!isLastSection) {
      setSectionIndex((i) => i + 1);
      setQuestionIndex(0);
    } else {
      setLoading(true);
      setError(null);
      try {
        const { data } = await submitAssessment(buildPayload());
        onComplete(data, buildPayload());
      } catch (err) {
        if (err.response?.status === 400) {
          const d = err.response.data;
          const firstMsg = typeof d === "object" ? Object.values(d)[0] : d;
          setError(Array.isArray(firstMsg) ? firstMsg[0] : String(firstMsg));
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (phase === "persona") return;
    if (questionIndex > 0 || sectionIndex > 0) {
      if (questionIndex > 0) {
        setQuestionIndex((i) => i - 1);
      } else if (sectionIndex > 0) {
        const prevSection = SECTIONS[sectionIndex - 1];
        setSectionIndex((i) => i - 1);
        setQuestionIndex(prevSection.questions.length - 1);
      }
    } else {
      setPhase("persona");
    }
  };

  if (profile === undefined) {
    return (
      <div className="form-card">
        <p style={{ color: "#5A5A5A" }}>Loading profile…</p>
      </div>
    );
  }

  const personaSelected = answers.persona !== undefined;
  const selected = phase === "persona" ? personaSelected : answers[question?.key] !== undefined;
  const canProceed =
    phase === "persona" ? personaSelected : selected && question;

  if (phase === "persona") {
    return (
      <div className="form-card persona-card">
        <p className="persona-prompt">What best describes where you are financially right now?</p>
        <p className="persona-hint">Tap one to continue. This sets the tone and is not scored.</p>
        <div className="persona-options">
          {PERSONAS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`persona-option${answers.persona === p.value ? " selected" : ""}`}
              onClick={() => handlePersonaSelect(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {error && <p className="error-msg">{error}</p>}
        <div className="form-nav">
          <button className="btn-secondary" onClick={handleBack} disabled>
            Back
          </button>
          <button className="btn-primary" onClick={handleNext} disabled={!canProceed || loading}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-card assessment-question-card">
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="section-tabs">
        {SECTIONS.map((s, i) => (
          <span
            key={s.title}
            className={`section-tab${i === sectionIndex ? " active" : ""}${i < sectionIndex ? " done" : ""}`}
          >
            {i < sectionIndex ? "✓" : i + 1}. {s.title}
          </span>
        ))}
      </div>

      <p className="step-indicator">{section.subtitle}</p>
      <h2 className="question-label question-label-large">{question.label}</h2>

      <div className="options-list options-list-large">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`option-btn option-btn-large${answers[question.key] === opt.value ? " selected" : ""}`}
            onClick={() => handleSelect(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="question-why">{question.why}</p>

      {error && <p className="error-msg">{error}</p>}

      <div className="form-nav">
        <button className="btn-secondary" onClick={handleBack} disabled={loading}>
          Back
        </button>
        <button
          className="btn-primary"
          onClick={handleNext}
          disabled={!canProceed || loading}
        >
          {loading
            ? "Scoring…"
            : isLastSection && isLastQuestion
            ? "Get Results"
            : "Next"}
        </button>
      </div>
    </div>
  );
}
