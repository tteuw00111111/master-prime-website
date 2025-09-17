import { FaStar } from 'react-icons/fa';

const testimonials = [
  {
    name: "Ana Silva",
    title: "Cliente Satisfeita",
    quote: "Meu notebook ficou novo em folha! O atendimento foi super rápido e o preço justo. Recomendo demais a Master Prime.",
    avatar: "/placeholder-user.png" // Placeholder image
  },
  {
    name: "Carlos Souza",
    title: "Cliente Fiel",
    quote: "Sempre que preciso de peças ou de um upgrade no meu PC Gamer, falo com eles. Ajudam a escolher os melhores componentes e montam tudo na hora.",
    avatar: "/placeholder-user.png"
  },
  {
    name: "Juliana Pereira",
    title: "Cliente de Primeira Viagem",
    quote: "Tinha um problema na tela do meu celular que ninguém resolvia. Levei na Master Prime e eles consertaram no mesmo dia. Virei fã!",
    avatar: "/placeholder-user.png"
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-gray-900 text-white py-20">
      <div className="container mx-auto px-6">
        <header className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 text-transparent bg-clip-text">
            O que nossos clientes dizem
          </h2>
          <p className="text-gray-300 text-lg mt-4 max-w-3xl mx-auto">
            A confiança de quem já conhece nosso trabalho.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 flex flex-col items-center text-center transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => <FaStar key={i} />)}
              </div>
              <p className="text-gray-300 italic mb-6 flex-grow">“{testimonial.quote}”</p>
              <div>
                <h4 className="font-bold text-lg">{testimonial.name}</h4>
                <p className="text-sm text-gray-400">{testimonial.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
