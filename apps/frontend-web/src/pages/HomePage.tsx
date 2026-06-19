import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">
        Suivi des stocks de café vert
      </h1>
      <p className="text-muted-foreground">
        Backbone frontend prêt. Les écrans lots, mesures et alertes arrivent.
      </p>
      <Button
        onClick={() =>
          toast.success('Backbone opérationnel', {
            description: 'Toast de démonstration (sonner).',
          })
        }
      >
        Afficher un toast
      </Button>
    </section>
  );
}
