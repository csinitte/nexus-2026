'use client';

import { ABSTRACT_INSTRUCTIONS, EVENT } from '@/content/nexus';
import {
  DECLARATION_TEXT,
  EXPO_PROJECT_CATEGORIES,
  MAX_EXPO_TEAM_MEMBERS,
  MAX_STUDENTS_WITH_FACULTY,
  MAX_TOTAL_REPRESENTATIVES,
  MIN_EXPO_TEAM_MEMBERS,
} from '@/lib/nexus/constants';
import { CheckList, ChoiceGroup, FieldError, SelectField, TextArea, TextField } from './fields';
import {
  ARRIVAL_LABELS,
  MAX_ABSTRACT_BYTES,
  MAX_DESCRIPTION_LENGTH,
  STEPS,
  delegationPeople,
  studentCount,
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
  return (
    <div className="fields">
      <TextField
        id="collegeName"
        label="College name"
        value={state.collegeName}
        onChange={(collegeName) => update({ collegeName })}
        error={errors.collegeName}
        autoComplete="organization"
        wide
      />
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
        hint="An accompanying coordinator counts towards the five-person limit."
        value={state.facultyAccompanying}
        onChange={(facultyAccompanying) => update({ facultyAccompanying })}
        error={errors.facultyAccompanying}
        options={YES_NO(
          'Yes',
          'No',
          `Up to ${MAX_STUDENTS_WITH_FACULTY} students can join`,
          `Up to ${MAX_TOTAL_REPRESENTATIVES} students can join`,
        )}
      />
    </>
  );
}

export function DelegationStep({ state, errors, update, updateStudent }: StepProps) {
  const faculty = state.facultyAccompanying === 'yes';
  const count = studentCount(state);
  return (
    <>
      <div className="limit-banner">
        <strong>Maximum {MAX_TOTAL_REPRESENTATIVES} representatives per college</strong>
        <span>Including the faculty coordinator if accompanying.</span>
      </div>
      <ChoiceGroup
        id="totalRepresentatives"
        legend="Total number of representatives"
        hint={
          faculty
            ? 'Your faculty coordinator is accompanying, so they take one place. Their details are not needed again below.'
            : 'Your faculty coordinator is not accompanying, so every place is for a student.'
        }
        value={state.totalRepresentatives}
        onChange={(totalRepresentatives) => update({ totalRepresentatives })}
        error={errors.totalRepresentatives}
        options={Array.from({ length: MAX_TOTAL_REPRESENTATIVES }, (_, i) => {
          const total = i + 1;
          const students = total - (faculty ? 1 : 0);
          return {
            value: String(total),
            label: String(total),
            detail: students < 1 ? 'Needs a student' : `${students} student${students === 1 ? '' : 's'}${faculty ? ' + faculty' : ''}`,
            disabled: students < 1,
          };
        })}
      />
      {state.students.map((s, i) => {
        const p = `s${i}-`;
        return (
          <fieldset key={i} className="student-card">
            <legend>
              Student {String(i + 1).padStart(2, '0')}
              <span> of {String(count).padStart(2, '0')}</span>
            </legend>
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
    </>
  );
}

export function ShowcaseStep({ state, errors, update }: StepProps) {
  return (
    <>
      <p className="step-note">
        Every registered CSI branch takes part in the Chapter Showcase with a five-minute presentation using the standard template.
      </p>
      <ChoiceGroup
        id="presenterIndex"
        legend="Who will be presenting your CSI Branch Showcase presentation?"
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
        legend="Will your college be participating in the Student Project Expo?"
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
            hint={`Select ${MIN_EXPO_TEAM_MEMBERS}–${MAX_EXPO_TEAM_MEMBERS} members from your registered students. ${state.teamIndexes.length} selected.`}
            items={state.students.map((s, i) => ({
              key: String(i),
              label: s.fullName.trim() || `Student ${i + 1}`,
              detail: s.department.trim() ? `${s.department.trim()} · Year ${s.year || '–'}` : undefined,
            }))}
            selected={state.teamIndexes.map(String)}
            onToggle={toggleMember}
            limit={MAX_EXPO_TEAM_MEMBERS}
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
        Participants requiring accommodation must indicate their requirements below. Accommodation is subject to availability.
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
            legend="Who requires accommodation?"
            hint={`Select from your registered delegation. ${state.accommodationPeople.length} selected.`}
            items={people.map((p) => ({ key: p.key, label: p.name, detail: p.role }))}
            selected={state.accommodationPeople}
            onToggle={toggle}
            error={errors.accommodationPeople}
          />
          <div className="fields" id="accommodationCounts" tabIndex={-1}>
            <NumberField
              id="maleAccommodationCount"
              label="Number of male participants"
              value={state.maleAccommodationCount}
              max={people.length}
              onChange={(maleAccommodationCount) => update({ maleAccommodationCount })}
              error={errors.maleAccommodationCount}
            />
            <NumberField
              id="femaleAccommodationCount"
              label="Number of female participants"
              value={state.femaleAccommodationCount}
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
  max,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  error?: string;
}) {
  const n = Number(value) || 0;
  return (
    <div className={`field stepper${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="stepper-control">
        <button type="button" onClick={() => onChange(String(Math.max(0, n - 1)))} aria-label={`Decrease ${label.toLowerCase()}`}>
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="button" onClick={() => onChange(String(Math.min(max, n + 1)))} aria-label={`Increase ${label.toLowerCase()}`}>
          +
        </button>
        </div>
      </div>
    );
  }
export function PaymentStep({ state, errors, update, screenshot, setScreenshot }: StepProps) {
  const fee = state.hasCsiMembership === 'yes' ? 200 : 300;
  const handleFile = (file: File | null) => {
    setScreenshot(file);
  };
  return (
    <div className="fields">
      <p className="step-note">
        Pay via UPI and upload the payment screenshot. The fee is calculated on the server — ₹200 for CSI members and ₹300 for general registrations.
      </p>
      <div className="payment-fee">
        <span>Registration fee</span>
        <strong>₹{fee}</strong>
      </div>
      <div className="payment-upi">
        <img src="/payment-qr.jpeg" alt="UPI QR code for NEXUS 2026 payments" />
        <p>Scan the QR to pay.</p>
      </div>
      <ChoiceGroup
        id="hasCsiMembership"
        legend="Are you paying as a CSI member?"
        value={state.hasCsiMembership}
        onChange={(v) => update({ hasCsiMembership: v as YesNo })}
        options={[
          { value: 'no', label: 'No', detail: '₹300 fee applies' },
          { value: 'yes', label: 'Yes', detail: '₹200 fee applies' },
        ]}
        error={errors.hasCsiMembership}
      />
      {state.hasCsiMembership === 'yes' && (
        <>
          <TextField
            id="csiMemberId"
            label="CSI membership ID"
            value={state.csiMemberId}
            onChange={(csiMemberId) => update({ csiMemberId })}
            error={errors.csiMemberId}
            placeholder="e.g. CSI-2024-042"
          />
          <TextField
            id="csiMemberName"
            label="Full name of the CSI member"
            value={state.csiMemberName}
            onChange={(csiMemberName) => update({ csiMemberName })}
            error={errors.csiMemberName}
            autoComplete="name"
          />
        </>
      )}
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
          className={`dropzone${errors.paymentScreenshot ? ' has-error' : ''}`}
        >
          <input
            id="paymentScreenshot"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <span className="dropzone-emoji">📄</span>
          <span className="dropzone-text">
            {screenshot
              ? screenshot.name
              : 'Drop PNG/JPG/JPEG here or click to browse'}
            <br />
            Max 5 MB.
          </span>
        </label>
        <FieldError id="paymentScreenshot" message={errors.paymentScreenshot} />
      </div>
    </div>
  );
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
        ['Representatives', `${state.totalRepresentatives} in total`],
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
              ['Guests', state.accommodationPeople.map((k) => people.find((p) => p.key === k)?.name).join(', ')],
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
            <dt>CSI membership</dt>
            <dd>{state.hasCsiMembership === 'yes' ? `Yes${state.csiMemberName ? ` — ${state.csiMemberName}` : ''}${state.csiMemberId ? ` (ID: ${state.csiMemberId})` : ''}` : 'No'}</dd>
          </div>
          <div>
            <dt>Fee</dt>
            <dd>{state.hasCsiMembership === 'yes' ? '₹200 (CSI member)' : '₹300 (General)'}</dd>
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





