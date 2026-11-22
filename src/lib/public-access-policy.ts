// Public applications are discontinued; staff invitation workflows remain unchanged.
export const PUBLIC_REGISTRATION_ENABLED = false;
export function publicRegistrationDestination(): "/" | "/register" {
  return PUBLIC_REGISTRATION_ENABLED ? "/register" : "/";
}