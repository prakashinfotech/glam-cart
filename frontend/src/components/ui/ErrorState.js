export default function ErrorState({ message, onRetry, icon = '📡', className = '' }) {
  return (
    <div className={`text-center py-20 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-glamcart-dark mb-2">{message}</h3>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-4 px-8">Try Again</button>
      )}
    </div>
  )
}
