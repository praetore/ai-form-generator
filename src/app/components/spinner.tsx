export default function Spinner() {
  return (
    <div className="flex w-full justify-center py-6" role="status" aria-label="Laden">
      <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
