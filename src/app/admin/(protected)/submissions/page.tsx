import SubmissionsClient from './submissions-client';

// This is a server component that renders the submissions page
export default async function SubmissionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Game Submissions</h1>
      <SubmissionsClient />
    </div>
  );
}
