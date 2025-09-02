// src/app/local/page.tsx
export default function LocalPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <h1 className="text-2xl font-bold mb-4">
        Nossa Localização – Master Prime
      </h1>

      <p className="mb-4 text-neutral-700">
        Estamos no Info Shopping Campo Grande – Loja 101.
        <br />
        Avenida Cesário de Melo, 2869 – Campo Grande, RJ
      </p>

      {/* Google Maps embed */}
      <div className="aspect-video w-full mb-6">
        <iframe
          src="https://maps.app.goo.gl/8dXmkDka7nqTh7fq7"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <a
        href="https://maps.app.goo.gl/oJRJPmWeB5jyi1dq8/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-lg px-4 py-2 bg-green-600 text-white hover:bg-green-700"
      >
        Ver no Google Maps
      </a>
    </main>
  );
}
