export default function Footer() {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-6 text-center text-gray-400">
        <p>
          &copy; {new Date().getFullYear()} Master Prime. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}
