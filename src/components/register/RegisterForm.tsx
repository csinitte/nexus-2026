'use client';

import { useCallback, useEffect, useReducer, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  STEPS,
  buildPayload,
  firstInvalidStep,
  initialState,
  stepForServerError,
  syncDelegation,
  validateStep,
  type Errors,
  type FormState,
  type StudentDraft,
} from './model';
import { STEP_COMPONENTS } from './steps';
import { RegistrationSuccess, type RegistrationResult } from './RegistrationSuccess';

const DRAFT_KEY = 'nexus26-registration-draft-v1';

type Action =
  | { type: 'patch'; patch: Partial<FormState> }
  | { type: 'student'; index: number; patch: Partial<StudentDraft> }
  | { type: 'replace'; state: FormState };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'patch': {
      const next = { ...state, ...action.patch };
      const delegationChanged = 'totalRepresentatives' in action.patch || 'facultyAccompanying' in action.patch;
      return delegationChanged ? syncDelegation(next) : next;
    }
    case 'student':
      return { ...state, students: state.students.map((s, i) => (i === action.index ? { ...s, ...action.patch } : s)) };
    case 'replace':
      return syncDelegation({ ...initialState, ...action.state });
  }
}

type ServerProblem = { message: string; step: number };

/** `intro` is shown above the form and hidden once registration succeeds. */
export function RegisterForm({ intro }: { intro?: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [abstract, setAbstract] = useState<File | null>(null);
  const [problems, setProblems] = useState<ServerProblem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const inFlight = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const moved = useRef(false);

  // Restore a saved draft once (PRD: preserve entered data). Files cannot be stored.
  useEffect(() => {
    let saved: { state?: FormState; step?: number; visited?: number } | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    } catch {
      saved = null;
    }
    queueMicrotask(() => {
      if (saved?.state) {
        dispatch({ type: 'replace', state: saved.state });
        setStep(Math.min(saved.step ?? 0, STEPS.length - 1));
        setVisited(Math.min(saved.visited ?? 0, STEPS.length - 1));
        setDraftRestored(true);
      }
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current || result) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ state, step, visited }));
      } catch {
        /* storage unavailable (private mode): the form still works */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [state, step, visited, result]);

  // Move focus to the step heading after navigating so screen readers announce it.
  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus({ preventScroll: true });
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const update = useCallback((patch: Partial<FormState>) => {
    dispatch({ type: 'patch', patch });
    setErrors((prev) => {
      const keys = Object.keys(patch);
      if (!keys.some((k) => prev[k] || k.startsWith('maleAcc') || k.startsWith('femaleAcc') || k === 'accommodationPeople')) return prev;
      const next = { ...prev };
      for (const k of keys) delete next[k];
      delete next.accommodationCounts;
      return next;
    });
  }, []);

  const updateStudent = useCallback((index: number, patch: Partial<StudentDraft>) => {
    dispatch({ type: 'student', index, patch });
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(patch)) delete next[`s${index}-${k}`];
      return next;
    });
  }, []);

  const goTo = useCallback((target: number) => {
    moved.current = true;
    setErrors({});
    setStep(target);
  }, []);

  const focusFirstError = (errs: Errors) => {
    const first = Object.keys(errs)[0];
    requestAnimationFrame(() => {
      const el = document.getElementById(first);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    });
  };

  const next = () => {
    const errs = validateStep(step, state, abstract);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);
    const target = Math.min(step + 1, STEPS.length - 1);
    setVisited((v) => Math.max(v, target));
    goTo(target);
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();
    if (inFlight.current) return; // guards against double taps (PRD: no duplicate submissions)

    const invalid = firstInvalidStep(state, abstract);
    if (invalid !== null) {
      const errs = validateStep(invalid, state, abstract);
      if (invalid !== step) goTo(invalid);
      setErrors(errs);
      return focusFirstError(errs);
    }

    inFlight.current = true;
    setSubmitting(true);
    setProblems([]);
    const body = new FormData();
    body.set('payload', JSON.stringify(buildPayload(state)));
    if (state.participatingInExpo === 'yes' && abstract) body.set('abstract', abstract);

    try {
      const response = await fetch('/api/registrations', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const messages: string[] = data.errors ?? [
          data.error ??
            (response.status === 413
              ? 'The upload was too large. Please choose a smaller PDF.'
              : 'Registration could not be completed. Please try again.'),
        ];
        setProblems(messages.map((message) => ({ message: friendly(message, response.status), step: stepForServerError(message) })));
        inFlight.current = false;
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setResult(data as RegistrationResult);
      window.scrollTo({ top: 0 });
    } catch {
      setProblems([
        {
          message: 'We couldn’t reach the server. Check your connection and try again — your details are still here.',
          step: STEPS.length - 1,
        },
      ]);
      inFlight.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  const startOver = () => {
    if (!window.confirm('Clear everything you have entered and start again?')) return;
    dispatch({ type: 'replace', state: initialState });
    setAbstract(null);
    setVisited(0);
    setDraftRestored(false);
    setProblems([]);
    goTo(0);
  };

  if (result) return <RegistrationSuccess result={result} coordinatorEmail={state.facultyCoordinatorEmail} />;

  const Step = STEP_COMPONENTS[step];
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const errorCount = Object.keys(errors).length;

  return (
    <>
      {intro}
      <div className="register" ref={formTopRef}>
        <nav className="stepper-nav" aria-label="Registration progress">
          <p className="stepper-count">
            Step {step + 1} of {STEPS.length}
            <span> · {current.label}</span>
          </p>
          <div className="progress-bar" aria-hidden="true">
            <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <ol>
            {STEPS.map((s, i) => {
              const status = i === step ? 'current' : i <= visited ? 'done' : 'todo';
              return (
                <li key={s.id} className={`is-${status}`}>
                  <button type="button" onClick={() => goTo(i)} disabled={i > visited} aria-current={i === step ? 'step' : undefined}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {draftRestored && step === 0 && (
          <div className="draft-banner" role="status">
            <span>We restored the details you entered earlier on this device.</span>
            <button type="button" className="link-button" onClick={startOver}>
              Start over
            </button>
          </div>
        )}

        <form className="step-form" onSubmit={submit} noValidate>
          <header className="step-header">
            <p className="eyebrow">Section {String(step + 1).padStart(2, '0')}</p>
            <h2 ref={headingRef} tabIndex={-1}>
              {current.title}
            </h2>
          </header>

          {errorCount > 0 && (
            <div className="form-alert" role="alert">
              {errorCount === 1 ? 'One field needs attention.' : `${errorCount} fields need attention.`} Check the highlighted fields below.
            </div>
          )}

          <Step
            state={state}
            errors={errors}
            update={update}
            updateStudent={updateStudent}
            abstract={abstract}
            setAbstract={(file) => {
              setAbstract(file);
              setErrors((prev) => {
                const next = { ...prev };
                delete next.abstract;
                return next;
              });
            }}
            goTo={goTo}
          />

          {problems.length > 0 && (
            <div className="form-alert server" role="alert">
              <strong>We couldn’t submit your registration yet.</strong>
              <ul>
                {problems.map((p) => (
                  <li key={p.message}>
                    {p.message}{' '}
                    {p.step !== step && (
                      <button type="button" className="link-button" onClick={() => goTo(p.step)}>
                        Go to {STEPS[p.step].label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="step-actions">
            {step > 0 ? (
              <button type="button" className="button outline" onClick={() => goTo(step - 1)}>
                <span aria-hidden="true">←</span> Back
              </button>
            ) : (
              <span />
            )}
            <button type="submit" className="button" disabled={submitting} aria-busy={submitting || undefined}>
              {isLast ? (submitting ? 'Submitting…' : 'Submit registration') : `Continue to ${STEPS[step + 1].label}`}
              <span aria-hidden="true">{isLast ? '↗' : '→'}</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function friendly(message: string, status: number): string {
  if (status === 409)
    return 'This college and faculty coordinator are already registered. Contact the organising team if you need to make changes.';
  const map: [RegExp, string][] = [
    [/collegeName is required/i, 'Enter your college name.'],
    [/csiChapterName is required/i, 'Enter your CSI chapter name.'],
    [/city is required/i, 'Enter your city.'],
    [/facultyCoordinatorName is required/i, 'Enter the faculty coordinator’s name.'],
    [/facultyCoordinatorContact is required/i, 'Enter the faculty coordinator’s contact number.'],
    [/facultyCoordinatorEmail/i, 'Enter a valid faculty coordinator email.'],
    [/A valid PDF abstract/i, 'Upload a valid PDF abstract (10 MB or smaller).'],
  ];
  return map.find(([re]) => re.test(message))?.[1] ?? message;
}
