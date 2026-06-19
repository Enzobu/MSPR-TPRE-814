import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <section className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Page introuvable</h1>
      <Button asChild>
        <Link to="/">Retour à l'accueil</Link>
      </Button>
    </section>
  );
}
