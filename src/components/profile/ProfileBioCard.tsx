interface ProfileBioCardProps {
  user?: any;
}

export default function ProfileBioCard({ user }: ProfileBioCardProps) {
  // Bio and meta details have been moved to ProfileHeader to match Instagram style layout.
  // This component now returns null, but is kept to prevent breaking imports in user-profile.tsx and public-profile.tsx.
  return null;
}
