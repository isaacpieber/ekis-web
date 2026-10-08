export default function LoadingIndicator() {
  return (
    <div
      role="status"
      aria-label="Laddar"
      className="flex h-dvh w-full items-center justify-center"
    >
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-surface-dark border-t-primary"
      />
    </div>
  );
}
