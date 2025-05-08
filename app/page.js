import CodeTyping from './components/CodeTyping';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Code Typing Practice</h1>
        <CodeTyping />
      </div>
    </main>
  );
}
