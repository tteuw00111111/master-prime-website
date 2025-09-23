import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Delivery() {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Coleta e Entrega Expressa Master Prime
          </h1>
          <p className="text-lg text-gray-700 mb-4">
            Na Master Prime, oferecemos um serviço de coleta e entrega para
            facilitar a manutenção do seu equipamento. Entenda como funciona:
          </p>
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                1. Agendamento da Coleta
              </h2>
              <p className="text-gray-600">
                Você entra em contato conosco e agenda o melhor horário para a
                retirada do seu aparelho. Buscamos no seu endereço com total
                segurança.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                2. Orçamento e Manutenção
              </h2>
              <p className="text-gray-600">
                Assim que o aparelho chega em nosso laboratório, nossos
                profissionais realizam o diagnóstico e enviam o orçamento para
                sua aprovação. Com o orçamento aprovado, a manutenção é
                efetuada.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                3. Entrega Segura
              </h2>
              <p className="text-gray-600">
                Após a manutenção e testes de qualidade, agendamos a entrega do
                seu aparelho no seu endereço. Você recebe seu equipamento pronto
                para uso, com garantia do serviço.
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-700 mb-6">
              Pronto para começar? Fale com um de nossos especialistas.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <WhatsAppButton />
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
              >
                Visitar o site
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
