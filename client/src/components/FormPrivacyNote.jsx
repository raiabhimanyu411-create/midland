import { Trans } from 'react-i18next';

// "By submitting you agree to our Privacy Policy" line shown next to every form's submit button.
export function FormPrivacyNote({ className = '' }) {
  return (
    <p className={`form-privacy-note ${className}`}>
      <Trans i18nKey="forms.privacyNote">
        By submitting this form you agree to our <a href="/privacy">Privacy Policy</a>.
      </Trans>
    </p>
  );
}
