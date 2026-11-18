'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ABSTRACT_INSTRUCTIONS, EVENT } from '@/content/nexus';
import {
  COLLEGE_CATEGORIES,
  DECLARATION_TEXT,
  EXPO_PROJECT_CATEGORIES,
  MAX_EXPO_TEAM_MEMBERS,
  MIN_EXPO_TEAM_MEMBERS,
  MIN_TOTAL_REPRESENTATIVES,
  MAX_TOTAL_REPRESENTATIVES,
  MAX_PAYMENT_PROOF_BYTES,
  PAYMENT_PROOF_TYPES,
  isNmamit,
  PAYMENT_FEES,
} from '@/lib/nexus/constants';
import { CheckList, ChoiceGroup, FieldError, SelectField, TextArea, TextField } from './fields';
import {
  ARRIVAL_LABELS,
  blankStudent,
  MAX_ABSTRACT_BYTES,
  MAX_DESCRIPTION_LENGTH,
  STEPS,
  delegationPeople,
  studentCount,
  validatePaymentScreenshot,
  type Errors,
  type FormState,
  type StudentDraft,
  type YesNo,
} from './model';

export type StepProps = {
  state: FormState;
  errors: Errors;
  update: (patch: Partial<FormState>) => void;
  updateStudent: (index: number, patch: Partial<StudentDraft>) => void;
  abstract: File | null;
  setAbstract: (file: File | null) => void;
  screenshot: File | null;
  setScreenshot: (file: File | null) => void;
  goTo: (step: number) => void;
};

const YES_NO = (yes: string, no: string, yesDetail?: string, noDetail?: string) =>
  [
    { value: 'yes', label: yes, detail: yesDetail },
    { value: 'no', label: no, detail: noDetail },
  ] as { value: Exclude<YesNo, ''>; label: string; detail?: string }[];

export function CollegeStep({ state, errors, update }: StepProps) {
  const isActiveCsi = state.collegeCategory === 'active_csi';
  const dialog = useRef<HTMLDialogElement>(null);
  const shown = useRef(false);
  const [confirmedHost, setConfirmedHost] = useState(false);
  const showNmamitNotice = () => {
    if (!dialog.current || dialog.current.open) return;
    setConfirmedHost(false);
    dialog.current.showModal();
  };
  return (
    <div className="fields" onBlur={(event) => {
      if ((event.target as HTMLElement).id !== 'collegeName' || !isNmamit(state.collegeName) || shown.current) return;
      shown.current = true;
      showNmamitNotice();
    }}>
      <dialog ref={dialog} className="registration-dialog" aria-labelledby="nmamit-category-title" aria-describedby="nmamit-category-description">
        <h3 id="nmamit-category-title">Are you from NMAMIT, Nitte?</h3>
        <p id="nmamit-category-description" aria-live="polite">
          {confirmedHost
            ? 'Since NMAMIT, Nitte is hosting NEXUS, choose “No Active CSI Branch” as your registration category.'
            : 'Confirm whether NMAM Institute of Technology, Nitte is your college.'}
        </p>
        <div className="registration-dialog-actions">
          <button type="button" className="button" onClick={() => {
            if (!confirmedHost) {
              setConfirmedHost(true);
              return;
            }
            update({ collegeCategory: 'no_active_csi' });
            dialog.current?.close();
          }}>{confirmedHost ? 'Use No Active CSI Branch' : 'Yes, I’m from NMAMIT'}</button>
          {!confirmedHost && (
            <button type="button" className="button outline" onClick={() => dialog.current?.close()}>No</button>
          )}
        </div>
      </dialog>
      <TextField
        id="collegeName"
        label="College name"
        value={state.collegeName}
        onChange={(collegeName) => update({ collegeName })}
        error={errors.collegeName}
        autoComplete="organization"
        wide
      />
      <SelectField
        id="collegeCategory"
        label="College category"
        value={state.collegeCategory}
        onChange={(collegeCategory) => {
          update({ collegeCategory: collegeCategory as typeof state.collegeCategory });
          if (collegeCategory === 'active_csi' && isNmamit(state.collegeName)) showNmamitNotice();
        }}
        options={COLLEGE_CATEGORIES.map((c) => ({ value: c, label: c === 'active_csi' ? 'Active CSI Branch' : 'No Active CSI Branch' }))}
        error={errors.collegeCategory}
        placeholder="Select college category"
      />
      {isActiveCsi && (
        <>
          <TextField
            id="csiChapterName"
            label="CSI student branch name"
            value={state.csiChapterName}
            onChange={(csiChapterName) => update({ csiChapterName })}
            error={errors.csiChapterName}
          />
          <TextField
            id="csiChapterId"
            label="CSI branch ID"
            optional
            value={state.csiChapterId}
            onChange={(csiChapterId) => update({ csiChapterId })}
          />
        </>
      )}
      <TextField
        id="city"
        label="City"
        value={state.city}
        onChange={(city) => update({ city })}
        error={errors.city}
        autoComplete="address-level2"
      />
    </div>
  );
}

export function FacultyStep({ state, errors, update }: StepProps) {
  const isActiveCsi = state.collegeCategory === 'active_csi';
  if (!isActiveCsi) {
    return (
      <p className="step-note">You can continue without faculty coordinator details for this registration category.</p>
    );
  }
  return (
    <>
      <p className="step-note">Collected for institutional coordination and verification. The confirmation email is sent here.</p>
      <div className="fields">
        <TextField
          id="facultyCoordinatorName"
          label="Faculty coordinator’s name"
          value={state.facultyCoordinatorName}
          onChange={(facultyCoordinatorName) => update({ facultyCoordinatorName })}
          error={errors.facultyCoordinatorName}
          autoComplete="name"
          wide
        />
        <TextField
          id="facultyCoordinatorEmail"
          label="Email ID"
          type="email"
          inputMode="email"
          value={state.facultyCoordinatorEmail}
          onChange={(facultyCoordinatorEmail) => update({ facultyCoordinatorEmail })}
          error={errors.facultyCoordinatorEmail}
          autoComplete="email"
        />
        <TextField
          id="facultyCoordinatorContact"
          label="Contact number"
          type="tel"
          inputMode="tel"
          value={state.facultyCoordinatorContact}
          onChange={(facultyCoordinatorContact) => update({ facultyCoordinatorContact })}
          error={errors.facultyCoordinatorContact}
          autoComplete="tel"
          placeholder="+91"
        />
      </div>
      <ChoiceGroup
        id="facultyAccompanying"
        legend="Is the faculty coordinator accompanying the delegation?"
        hint="Tell us whether your faculty coordinator will be attending with the delegation."
        value={state.facultyAccompanying}
        onChange={(facultyAccompanying) => update({ facultyAccompanying })}
        error={errors.facultyAccompanying}
        options={YES_NO(
          'Yes',
          'No',
          'Faculty coordinator will accompany',
          'Faculty coordinator will not accompany',
        )}
      />
    </>
  );
}

export function DelegationStep({ state, errors, update, updateStudent }: StepProps) {
  const count = studentCount(state);
  return (
    <>
      <div className="limit-banner">
        <strong>Multiple teams from the same college are welcome</strong>
        <span>Register {MIN_TOTAL_REPRESENTATIVES}–{MAX_TOTAL_REPRESENTATIVES} students per delegation. The faculty coordinator is counted separately.</span>
      </div>
      <FieldError id="totalRepresentatives" message={errors.totalRepresentatives} />
      {state.students.map((s, i) => {
        const p = `s${i}-`;
        return (
          <fieldset key={i} className="student-card">
            <legend>
              Student {String(i + 1).padStart(2, '0')}
              <span> of {String(count).padStart(2, '0')}</span>
            </legend>
            {i === count - 1 && count > MIN_TOTAL_REPRESENTATIVES && (
              <button type="button" className="link-button" onClick={() => update({ students: state.students.slice(0, -1) })}>
                Remove last student
              </button>
            )}
            <div className="fields">
              <TextField
                id={`${p}fullName`}
                label="Full name"
                value={s.fullName}
                onChange={(fullName) => updateStudent(i, { fullName })}
                error={errors[`${p}fullName`]}
                autoComplete="off"
                wide
              />
              <TextField
                id={`${p}department`}
                label="Department"
                value={s.department}
                onChange={(department) => updateStudent(i, { department })}
                error={errors[`${p}department`]}
                placeholder="e.g. Computer Science"
              />
              <SelectField
                id={`${p}year`}
                label="Year of study"
                value={s.year}
                onChange={(year) => updateStudent(i, { year })}
                error={errors[`${p}year`]}
                placeholder="Select year"
                options={[1, 2, 3, 4].map((y) => ({ value: String(y), label: `Year ${y}` }))}
              />
              <TextField
                id={`${p}contactNumber`}
                label="Contact number"
                type="tel"
                inputMode="tel"
                value={s.contactNumber}
                onChange={(contactNumber) => updateStudent(i, { contactNumber })}
                error={errors[`${p}contactNumber`]}
                autoComplete="off"
              />
              <TextField
                id={`${p}email`}
                label="Email ID"
                type="email"
                inputMode="email"
                value={s.email}
                onChange={(email) => updateStudent(i, { email })}
                error={errors[`${p}email`]}
                autoComplete="off"
              />
            </div>
          </fieldset>
        );
      })}
      <button
        id="totalRepresentatives"
        type="button"
        className="button outline"
        disabled={count >= MAX_TOTAL_REPRESENTATIVES}
        onClick={() => update({ students: [...state.students, blankStudent()] })}
      >
        Add a student <span aria-hidden="true">+</span>
      </button>
    </>
  );
}

export function ShowcaseStep({ state, errors, update }: StepProps) {
  const isActiveCsi = state.collegeCategory === 'active_csi';
  if (!isActiveCsi) {
    return (
      <p className="step-note">Your college does not have an active CSI branch. The Student Branch Showcase is not applicable.</p>
    );
  }
  return (
    <>
      <p className="step-note">
        Every registered CSI branch takes part in the Student Branch Showcase with a five-minute presentation using the standard template.
      </p>
      <ChoiceGroup
        id="presenterIndex"
        legend="Who will be presenting your Student Branch Showcase presentation?"
        hint="Choose the student representative who will deliver the five-minute chapter presentation."
        value={state.presenterIndex === null ? '' : String(state.presenterIndex)}
        onChange={(v) => update({ presenterIndex: Number(v) })}
        error={errors.presenterIndex}
        options={state.students.map((s, i) => ({
          value: String(i),
          label: s.fullName.trim() || `Student ${i + 1}`,
          detail: s.department.trim() || undefined,
        }))}
      />
      <a className="text-link" href={EVENT.showcaseTemplateUrl} download>
        Download presentation template <span aria-hidden="true">↓</span>
      </a>
    </>
  );
}

export function ExpoStep({ state, errors, update, abstract, setAbstract }: StepProps) {
  const count = studentCount(state);
  const toggleMember = (key: string) => {
    const i = Number(key);
    update({ teamIndexes: state.teamIndexes.includes(i) ? state.teamIndexes.filter((x) => x !== i) : [...state.teamIndexes, i] });
  };
  return (
    <>
      <ChoiceGroup
        id="participatingInExpo"
        legend="Will this registration include a Student Project Expo team?"
        value={state.participatingInExpo}
        onChange={(participatingInExpo) => update({ participatingInExpo })}
        error={errors.participatingInExpo}
        options={YES_NO(
          'Yes',
          'No',
          count < MIN_EXPO_TEAM_MEMBERS ? `Needs ${MIN_EXPO_TEAM_MEMBERS}+ students` : 'Add project details',
          'Skip this section',
        ).map((o) => ({ ...o, disabled: o.value === 'yes' && count < MIN_EXPO_TEAM_MEMBERS }))}
      />
      {state.participatingInExpo === 'yes' && (
        <div className="conditional">
          <aside className="instructions" aria-labelledby="abstract-instructions">
            <h3 id="abstract-instructions">Abstract instructions</h3>
            <ul className="check-list">
              {ABSTRACT_INSTRUCTIONS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </aside>
          <ChoiceGroup
            id="expoTeamSize"
            legend="How many students are on this Expo team?"
            value={state.expoTeamSize}
            onChange={(expoTeamSize) => {
              const teamSize = Number(expoTeamSize);
              update({ expoTeamSize, teamIndexes: state.teamIndexes.slice(0, teamSize) });
            }}
            error={errors.expoTeamSize}
            options={Array.from({ length: MAX_EXPO_TEAM_MEMBERS - MIN_EXPO_TEAM_MEMBERS + 1 }, (_, i) => {
              const size = i + MIN_EXPO_TEAM_MEMBERS;
              return { value: String(size), label: String(size), detail: `${size} student${size === 1 ? '' : 's'}` };
            })}
          />
          <div className="fields">
            <TextField
              id="teamName"
              label="Team name"
              value={state.teamName}
              onChange={(teamName) => update({ teamName })}
              error={errors.teamName}
              maxLength={160}
              wide
            />
            <TextField
              id="projectTitle"
              label="Project / product title"
              value={state.projectTitle}
              onChange={(projectTitle) => update({ projectTitle })}
              error={errors.projectTitle}
              maxLength={160}
              wide
            />
            <SelectField
              id="category"
              label="Project category"
              value={state.category}
              onChange={(category) => update({ category })}
              error={errors.category}
              placeholder="Select a category"
              options={EXPO_PROJECT_CATEGORIES.map((c) => ({ value: c, label: c }))}
              wide
            />
            <TextArea
              id="description"
              label="Brief project description (optional)"
              hint="Two or three sentences are enough. The full detail belongs in your abstract."
              value={state.description}
              onChange={(description) => update({ description })}
              error={errors.description}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <div className={`field wide file-field${errors.abstract ? ' has-error' : ''}`}>
              <label htmlFor="abstract">Project abstract (PDF)</label>
              <input
                id="abstract"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setAbstract(e.target.files?.[0] ?? null)}
                aria-invalid={errors.abstract ? true : undefined}
                aria-describedby={`abstract-hint${errors.abstract ? ' abstract-error' : ''}`}
              />
              <p className="field-hint" id="abstract-hint">
                {abstract
                  ? `Selected: ${abstract.name} (${(abstract.size / 1024 / 1024).toFixed(2)} MB)`
                  : `PDF only, up to ${Math.round(MAX_ABSTRACT_BYTES / 1024 / 1024)} MB. If you reloaded the page, choose the file again.`}
              </p>
              <FieldError id="abstract" message={errors.abstract} />
            </div>
          </div>
          <CheckList
            id="teamIndexes"
            legend="Expo team members"
            hint={`Select the ${state.expoTeamSize || 'chosen number of'} students from this registration. ${state.teamIndexes.length} selected.`}
            items={state.students.map((s, i) => ({
              key: String(i),
              label: s.fullName.trim() || `Student ${i + 1}`,
              detail: s.department.trim() ? `${s.department.trim()} · Year ${s.year || '–'}` : undefined,
            }))}
            selected={state.teamIndexes.map(String)}
            onToggle={toggleMember}
            limit={Number(state.expoTeamSize) || MAX_EXPO_TEAM_MEMBERS}
            error={errors.teamIndexes}
          />
        </div>
      )}
    </>
  );
}

export function AccommodationStep({ state, errors, update }: StepProps) {
  const people = delegationPeople(state);
  const toggle = (key: string) =>
    update({
      accommodationPeople: state.accommodationPeople.includes(key)
        ? state.accommodationPeople.filter((k) => k !== key)
        : [...state.accommodationPeople, key],
    });
  return (
    <>
      <p className="step-note">
        Student participants requiring accommodation must indicate their requirements below. Faculty coordinators are not included. Accommodation is subject to availability.
      </p>
      <ChoiceGroup
        id="accommodationRequired"
        legend="Do you require accommodation?"
        value={state.accommodationRequired}
        onChange={(accommodationRequired) => update({ accommodationRequired })}
        error={errors.accommodationRequired}
        options={YES_NO('Yes', 'No')}
      />
      {state.accommodationRequired === 'yes' && (
        <div className="conditional">
          <ChoiceGroup
            id="arrivalPlan"
            legend="When do you plan to arrive?"
            value={state.arrivalPlan}
            onChange={(arrivalPlan) => update({ arrivalPlan })}
            error={errors.arrivalPlan}
            options={Object.entries(ARRIVAL_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <CheckList
            id="accommodationPeople"
            legend="Which students require accommodation?"
            hint={`Select from the students in this registration. ${state.accommodationPeople.length} selected.`}
            items={people.map((p) => ({ key: p.key, label: p.name, detail: p.role }))}
            selected={state.accommodationPeople}
            onToggle={toggle}
            error={errors.accommodationPeople}
          />
          <div className="fields" id="accommodationCounts" tabIndex={-1}>
            <NumberField
              id="maleAccommodationCount"
              label="Number of male students"
              value={state.maleAccommodationCount}
              min={0}
              max={people.length}
              onChange={(maleAccommodationCount) => update({ maleAccommodationCount })}
              error={errors.maleAccommodationCount}
            />
            <NumberField
              id="femaleAccommodationCount"
              label="Number of female students"
              value={state.femaleAccommodationCount}
              min={0}
              max={people.length}
              onChange={(femaleAccommodationCount) => update({ femaleAccommodationCount })}
              error={errors.femaleAccommodationCount}
            />
            <FieldError id="accommodationCounts" message={errors.accommodationCounts} />
          </div>
          <p className="notice" role="note">
            Accommodation is subject to availability. Submission of a request does not guarantee accommodation.
          </p>
        </div>
      )}
    </>
  );
}

function NumberField({
  id,
  label,
  value,
  min = 0,
  max,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  min?: number;
  max?: number;
  onChange: (v: string) => void;
  error?: string;
}) {
  const n = Number(value) || 0;
  return (
    <div className={`field stepper${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="stepper-control">
        <button type="button" onClick={() => onChange(String(Math.max(min, n - 1)))} aria-label={`Decrease ${label.toLowerCase()}`}>
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="button" onClick={() => onChange(String(max === undefined ? n + 1 : Math.min(max, n + 1)))} aria-label={`Increase ${label.toLowerCase()}`}>
          +
        </button>
        </div>
        <FieldError id={id} message={error} />
      </div>
    );
  }
export function PaymentStep({ state, errors, update, screenshot, setScreenshot }: StepProps) {
  const fee = state.collegeCategory === 'active_csi' ? PAYMENT_FEES.ACTIVE_CSI : PAYMENT_FEES.NO_ACTIVE_CSI;
  const [preparing, setPreparing] = useState(false);
  const [fileError, setFileError] = useState('');

  async function handleFile(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setScreenshot(null);
    setFileError('');
    setPreparing(true);
    try {
      const proof = file.size > MAX_PAYMENT_PROOF_BYTES && PAYMENT_PROOF_TYPES.includes(file.type)
        ? await compressScreenshot(file)
        : file;
      if (!input.isConnected) return;
      const error = validatePaymentScreenshot(proof);
      if (error) setFileError(error);
      else setScreenshot(proof);
    } catch {
      if (input.isConnected) setFileError('Could not read this screenshot. Choose another PNG or JPEG.');
    } finally {
      if (input.isConnected) setPreparing(false);
    }
  }
  return (
    <div className="fields">
      <p className="step-note">
        Pay via UPI and upload the payment screenshot. The fee is calculated based on your college category.
      </p>
      <div className="payment-fee">
        <span>Registration fee</span>
        <strong>₹{fee}</strong>
      </div>
      <div className="payment-upi">
        <Image src="/payment-qr.jpeg" alt="UPI QR code for NEXUS 2026 payments" width={927} height={1009} unoptimized />
        <p>Scan the QR to pay.</p>
      </div>
      <p className="step-note">
        College category: {state.collegeCategory === 'active_csi' ? 'Active CSI Branch' : 'No Active CSI Branch'} — Fee: ₹{fee}
      </p>
      <TextField
        id="utrNumber"
        label="UPI Transaction ID / UTR Number"
        value={state.utrNumber}
        onChange={(utrNumber) => update({ utrNumber })}
        error={errors.utrNumber}
        placeholder="e.g. 123456789012"
        hint="Enter the 12-digit UTR from your payment app."
      />
      <div className="field">
        <label className="field-label" htmlFor="paymentScreenshot">
          Payment screenshot <span aria-hidden="true">*</span>
        </label>
        <label
          htmlFor="paymentScreenshot"
          className={`dropzone${(fileError || errors.paymentScreenshot) ? ' has-error' : ''}`}
        >
          <input
            id="paymentScreenshot"
            type="file"
            accept={PAYMENT_PROOF_TYPES.join(',')}
            className="sr-only"
            disabled={preparing}
            aria-invalid={Boolean(fileError || errors.paymentScreenshot)}
            aria-describedby={`payment-screenshot-hint${fileError || errors.paymentScreenshot ? ' paymentScreenshot-error' : ''}`}
            onChange={(e) => void handleFile(e.currentTarget)}
          />
          <span className="dropzone-text" role="status">
            {preparing ? 'Preparing screenshot…' : (screenshot?.name ?? 'Choose a PNG or JPEG screenshot')}
          </span>
        </label>
        <p id="payment-screenshot-hint" className="field-hint">Large screenshots are compressed for upload. If you reload, select the file again.</p>
        <FieldError id="paymentScreenshot" message={fileError || errors.paymentScreenshot} />
      </div>
    </div>
  );
}

async function compressScreenshot(file: File): Promise<File> {
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Image conversion unavailable');
    for (const maxSide of [2000, 1600, 1200]) {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      if (blob && blob.size <= MAX_PAYMENT_PROOF_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: blob.type });
      }
    }
    return file;
  } finally {
    image.close();
  }
}

export function ReviewStep({ state, errors, update, abstract, screenshot, goTo }: StepProps) {
  const people = delegationPeople(state);
  const yes = (v: YesNo) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '—');
  const sections: { step: number; rows: [string, string][] }[] = [
    {
      step: 0,
      rows: [
        ['College', state.collegeName],
        ['CSI branch', `${state.csiChapterName}${state.csiChapterId ? ` (ID ${state.csiChapterId})` : ''}`],
        ['City', state.city],
      ],
    },
    {
      step: 1,
      rows: [
        ['Faculty coordinator', state.facultyCoordinatorName],
        ['Email · contact', `${state.facultyCoordinatorEmail} · ${state.facultyCoordinatorContact}`],
        ['Accompanying', yes(state.facultyAccompanying)],
      ],
    },
    {
      step: 2,
      rows: [
        ['Students in this registration', `${state.students.length} student${state.students.length === 1 ? '' : 's'}`],
        ...state.students.map((s, i): [string, string] => [`Student ${i + 1}`, `${s.fullName} · ${s.department} · Year ${s.year}`]),
      ],
    },
    {
      step: 3,
      rows: [['Showcase presenter', state.presenterIndex !== null ? (state.students[state.presenterIndex]?.fullName ?? '') : '']],
    },
    {
      step: 4,
      rows:
        state.participatingInExpo === 'yes'
          ? [
              ['Team name', state.teamName],
              ['Team size', `${state.teamIndexes.length} student${state.teamIndexes.length === 1 ? '' : 's'}`],
              ['Project', `${state.projectTitle} · ${state.category}`],
              ['Team', state.teamIndexes.map((i) => state.students[i]?.fullName).join(', ')],
              ['Abstract', abstract?.name ?? 'Not selected'],
            ]
          : [['Project Expo', 'Not participating']],
    },
    {
      step: 5,
      rows:
        state.accommodationRequired === 'yes'
          ? [
              ['Arrival', ARRIVAL_LABELS[state.arrivalPlan as keyof typeof ARRIVAL_LABELS] ?? '—'],
              ['Students requiring accommodation', state.accommodationPeople.map((k) => people.find((p) => p.key === k)?.name).join(', ')],
              ['Male · female', `${state.maleAccommodationCount} · ${state.femaleAccommodationCount}`],
            ]
          : [['Accommodation', 'Not required']],
    },
  ];
  return (
    <>
      <div className="review">
        {sections.map((section) => (
          <section key={section.step} className="review-block" aria-labelledby={`review-${section.step}`}>
            <header>
              <h3 id={`review-${section.step}`}>{STEPS[section.step].title}</h3>
              <button type="button" className="link-button" onClick={() => goTo(section.step)}>
                Edit<span className="sr-only"> {STEPS[section.step].title}</span>
              </button>
            </header>
            <dl>
              {section.rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <div className="review-block" aria-labelledby="review-payment">
        <header>
          <h3 id="review-payment">{STEPS[6].title}</h3>
          <button type="button" className="link-button" onClick={() => goTo(6)}>
            Edit<span className="sr-only"> {STEPS[6].title}</span>
          </button>
        </header>
        <dl>
          <div>
            <dt>College category</dt>
            <dd>{state.collegeCategory === 'active_csi' ? 'Active CSI Branch' : 'No Active CSI Branch'}</dd>
          </div>
          <div>
            <dt>Fee</dt>
            <dd>{state.collegeCategory === 'active_csi' ? `₹${PAYMENT_FEES.ACTIVE_CSI} (Active CSI)` : `₹${PAYMENT_FEES.NO_ACTIVE_CSI} (General)`}</dd>
          </div>
          <div>
            <dt>UTR / Transaction ID</dt>
            <dd>{state.utrNumber || '—'}</dd>
          </div>
          <div>
            <dt>Payment proof</dt>
            <dd>{screenshot?.name ?? 'Not selected'}</dd>
          </div>
        </dl>
      </div>
      <div className={`declaration${errors.declarationAccepted ? ' has-error' : ''}`}>
        <label className="choice check is-block">
          <input
            id="declarationAccepted"
            type="checkbox"
            checked={state.declarationAccepted}
            onChange={(e) => update({ declarationAccepted: e.target.checked })}
            aria-invalid={errors.declarationAccepted ? true : undefined}
            aria-describedby={errors.declarationAccepted ? 'declarationAccepted-error' : undefined}
          />
          <span>
            <strong>Declaration</strong>
            <small>{DECLARATION_TEXT}</small>
          </span>
        </label>
        <FieldError id="declarationAccepted" message={errors.declarationAccepted} />
      </div>
    </>
  );
}

export const STEP_COMPONENTS = [CollegeStep, FacultyStep, DelegationStep, ShowcaseStep, ExpoStep, AccommodationStep, PaymentStep, ReviewStep];





