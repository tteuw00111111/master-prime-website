interface JsonLdProps {
  schemas: unknown[]
}

export const JsonLd = ({ schemas }: JsonLdProps) => (
  <>
    {schemas.map((schema, index) => (
      <script
        key={index}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
    ))}
  </>
)
