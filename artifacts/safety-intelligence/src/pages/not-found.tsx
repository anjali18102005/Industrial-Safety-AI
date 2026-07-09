import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex w-full items-center justify-center min-h-[50vh]">
      <div className="bg-card text-card-foreground border p-8 rounded-lg shadow-sm max-w-md w-full flex flex-col items-center text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold tracking-tight mb-2">404 - Area Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The restricted zone or module you are looking for does not exist in the current system configuration.
        </p>
        <Link href="/" className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors">
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}
